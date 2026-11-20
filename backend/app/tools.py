import json, re
from contextvars import ContextVar
from sqlalchemy import text, inspect
from langchain_core.tools import tool
from .db import ro_engine
from .operations_analytics import (
    get_vehicle_delay_analysis,
    get_tat_optimization_analysis,
    get_vehicle_tat_detail,
    get_dock_allocation_recommendations,
    generate_logistics_report,
)

# Verified authenticated user context injected strictly by backend JWT verification
AI_USER_CONTEXT: ContextVar[dict | None] = ContextVar("AI_USER_CONTEXT", default=None)

FORBIDDEN_SQL = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do|merge|execute|vacuum|analyze|refresh|set|reset)\b",
    re.I
)

FORBIDDEN_SYSTEM_TABLES = re.compile(
    r"\b(pg_catalog|information_schema|conversations|messages|ingestion_metadata|dock_allocation_approvals|users|roles|permissions|role_permissions|audit_logs)\b",
    re.I
)

DISPATCH_RESTRICTED_TOKENS = re.compile(
    r"\b(freight_cost_inr|unit_price_inr|standard_price_inr|unit_cost_inr|standard_unit_cost_inr|fact_manufacturing_cost|fact_executive_decision_log|fact_rfq_quote)\b",
    re.I
)

LOGISTICS_TABLES = {
    "fact_shipment_milestone", "fact_customer_order", "fact_inventory_daily_snapshot",
    "dim_customer", "dim_plant", "dim_product", "dim_material", "dim_supplier",
    "dim_defect_code", "dim_product_routing", "dim_shift_calendar", "dim_station",
    "fact_purchase_order_receipt", "fact_production_order", "fact_bom_component",
    "fact_quality_inspection", "fact_ncr_capa"
}

DISPATCH_ALLOWED_TABLES = {
    "fact_shipment_milestone", "fact_customer_order", "fact_inventory_daily_snapshot",
    "dim_plant", "dim_product", "dim_customer"
}


def _ctx() -> dict:
    return AI_USER_CONTEXT.get() or {"role": "MANAGER", "plant_id": "ALL", "permissions": ["*"]}


def _has_perm(*required_any: str) -> bool:
    u = _ctx()
    perms = set(u.get("permissions", []))
    if "*" in perms or (u.get("role") == "MANAGER" and "user_management" in perms):
        return True
    return any(r in perms for r in required_any)


def _plant_scope() -> str | None:
    p = (_ctx().get("plant_id") or "ALL").upper()
    return None if p == "ALL" else p


@tool
def get_database_schema() -> str:
    """Discover manufacturing logistics tables permitted for the authenticated user's role, their columns, relationships, and documented VMS field limitations."""
    u = _ctx()
    role = u.get("role", "MANAGER")
    allowed_set = DISPATCH_ALLOWED_TABLES if role == "DISPATCH_WORKER" else LOGISTICS_TABLES
    inspector = inspect(ro_engine)
    target_schema = "manufacturing_logistics" if ro_engine.dialect.name == "postgresql" else None
    available = set(inspector.get_table_names(schema=target_schema))
    if not available and target_schema:
        target_schema = "public"
        available = set(inspector.get_table_names(schema=target_schema))
    schema = {}
    for table in sorted(allowed_set.intersection(available)):
        cols = [f"{c['name']} ({c['type']})" for c in inspector.get_columns(table, schema=target_schema)]
        if role == "DISPATCH_WORKER":
            cols = [c for c in cols if not DISPATCH_RESTRICTED_TOKENS.search(c)]
        schema[table] = cols
    return json.dumps({
        "database": ro_engine.dialect.name,
        "schema": target_schema or "main",
        "role_scope": role,
        "plant_scope": u.get("plant_id", "ALL"),
        "tables": schema,
        "missing_vms_fields": [
            "vehicle_number (license plate)", "gate_entry_ts", "weighbridge_in_ts", "yard_arrival_ts",
            "dock_id", "dock_type", "dock_capacity", "dock_occupied_status", "gate_exit_ts"
        ]
    }, default=str)


@tool
def run_readonly_sql(query: str) -> str:
    """Execute one safe read-only PostgreSQL SELECT or WITH query within the authenticated user's authorized role and plant scope. Capped at 100 rows."""
    u = _ctx()
    role = u.get("role", "MANAGER")
    plant = _plant_scope()
    q = query.strip().rstrip(";").strip()
    if ";" in q or not re.match(r"^(select|with)\b", q, re.I) or FORBIDDEN_SQL.search(q):
        return "ERROR: only one read-only SELECT or WITH query is allowed."
    if FORBIDDEN_SYSTEM_TABLES.search(q):
        return "PERMISSION DENIED: System, authentication, audit, and approval tables cannot be queried."
    if role == "DISPATCH_WORKER":
        if DISPATCH_RESTRICTED_TOKENS.search(q):
            return "PERMISSION DENIED: Dispatch Workers are not authorized to query freight cost, pricing, or carrier cost analytics."
        if re.search(r"\b(fact_quality_inspection|fact_ncr_capa|fact_purchase_order_receipt|dim_supplier)\b", q, re.I):
            return "PERMISSION DENIED: Dispatch Workers may only query dispatch, customer order, and finished goods inventory tables."
    if plant and re.search(r"\bplant_id\b", q, re.I) is None and re.search(r"\b(fact_shipment_milestone|fact_inventory_daily_snapshot)\b", q, re.I):
        q = f"SELECT * FROM ({q}) AS scoped_q WHERE 1=1"
        # Enforce row-level filter by wrapping table query when user has a single assigned plant
    try:
        with ro_engine.connect() as conn:
            with conn.begin():
                if ro_engine.dialect.name == "postgresql":
                    conn.execute(text("SET TRANSACTION READ ONLY"))
                    conn.execute(text("SET LOCAL statement_timeout = 10000"))
                wrapped = f"SELECT * FROM ({q}) AS agent_result"
                params = {}
                if plant and re.search(r"\b(fact_shipment_milestone|fact_inventory_daily_snapshot|fact_production_order)\b", q, re.I):
                    # Check if plant_id is projected; if not, require explicit plant filter on source
                    if not re.search(r"plant_id\s*=\s*'" + re.escape(plant) + r"'", q, re.I):
                        return f"PERMISSION SCOPE NOTICE: Your account is restricted to plant '{plant}'. Include WHERE plant_id = '{plant}' in your SQL query."
                result = conn.execute(text(f"{wrapped} LIMIT 100"), params)
                fetched = [dict(r._mapping) for r in result.fetchall()]
        if role == "DISPATCH_WORKER":
            for r in fetched:
                for k in list(r.keys()):
                    if DISPATCH_RESTRICTED_TOKENS.search(k):
                        r.pop(k, None)
        return json.dumps(fetched, default=str) if fetched else "No matching rows were found."
    except Exception as exc:
        return f"SQL error: {str(exc)[:500]}"


@tool
def get_vehicle_journey(shipment_or_order_id: str) -> str:
    """Retrieve journey milestones, dispatch turnaround time, and order details for a specific shipment or order ID within your authorized plant scope."""
    if not _has_perm("dispatch_dashboard", "logistics_dashboard", "delay_risk", "tat_optimization"):
        return "PERMISSION DENIED: Your role is not authorized to view vehicle journey records."
    u = _ctx()
    plant = _plant_scope()
    try:
        detail = get_vehicle_tat_detail(shipment_or_order_id)
        if not detail:
            return f"No vehicle dispatch found matching '{shipment_or_order_id}'."
        if plant and detail.get("plant_id") != plant:
            return f"PERMISSION DENIED: Dispatch '{shipment_or_order_id}' belongs to plant '{detail.get('plant_id')}', outside your assigned plant scope '{plant}'."
        if u.get("role") == "DISPATCH_WORKER":
            detail.pop("freight_cost_inr", None)
        return json.dumps(detail, default=str)
    except Exception as exc:
        return f"Vehicle journey lookup error: {str(exc)[:300]}"


@tool
def analyze_vehicle_delay_risk(risk_level: str = "ALL", search: str = "") -> str:
    """Analyze predictive vehicle delay risk (CRITICAL, HIGH, MEDIUM, LOW) within the authenticated user's authorized plant and role scope."""
    if not _has_perm("delay_risk"):
        return "PERMISSION DENIED: Your role lacks 'delay_risk' permission."
    u = _ctx()
    plant = _plant_scope()
    try:
        res = get_vehicle_delay_analysis(risk_level=risk_level, search=search, plant_id=plant, limit=25)
        if u.get("role") == "DISPATCH_WORKER":
            for v in res["vehicles"]:
                v.pop("freight_cost_inr", None)
        return json.dumps(res, default=str)
    except Exception as exc:
        return f"Delay risk analysis error: {str(exc)[:300]}"


@tool
def calculate_vehicle_tat(start_date: str = "", end_date: str = "") -> str:
    """Calculate total dispatch-to-delivery Turnaround Time (TAT) and comparisons by vehicle type, carrier, and plant (Logistics & Manager scope)."""
    if not _has_perm("tat_optimization", "logistics_dashboard"):
        return "PERMISSION DENIED: Your role is not authorized to access Vehicle TAT Optimization and carrier performance analytics."
    try:
        res = get_tat_optimization_analysis(start_date=start_date or None, end_date=end_date or None)
        return json.dumps({
            "summary": res["summary"],
            "by_vehicle_type": res["by_vehicle_type"],
            "by_carrier": res["by_carrier"],
            "by_plant": res["by_plant"],
            "longest_journeys": res["longest_journeys"][:10],
            "shift_analysis": res["shift_analysis"],
        }, default=str)
    except Exception as exc:
        return f"TAT calculation error: {str(exc)[:300]}"


@tool
def analyze_stage_waiting_times() -> str:
    """Break down the manufacturing logistics lifecycle into available stages and report missing VMS gate/weighbridge timestamps (Logistics & Manager scope)."""
    if not _has_perm("tat_optimization", "logistics_dashboard"):
        return "PERMISSION DENIED: Your role lacks 'tat_optimization' permission."
    try:
        res = get_tat_optimization_analysis()
        return json.dumps({
            "stage_breakdown": res["stage_breakdown"],
            "largest_delay_contributor": res["largest_delay_contributor"],
            "shift_analysis": res["shift_analysis"],
            "missing_vms_checkpoints": res["missing_vms_checkpoints"],
        }, default=str)
    except Exception as exc:
        return f"Stage waiting analysis error: {str(exc)[:300]}"


@tool
def analyze_bottlenecks() -> str:
    """Identify recurring bottlenecks across stages, carriers, vehicle types, and plants (Logistics & Manager scope)."""
    if not _has_perm("tat_optimization", "carrier_performance"):
        return "PERMISSION DENIED: Your role is not authorized to access carrier and TAT bottleneck analytics."
    plant = _plant_scope()
    try:
        tat = get_tat_optimization_analysis()
        delay = get_vehicle_delay_analysis(risk_level="CRITICAL", plant_id=plant, limit=10)
        return json.dumps({
            "largest_delay_stage": tat["largest_delay_contributor"],
            "vehicle_type_bottlenecks": tat["by_vehicle_type"],
            "carrier_bottlenecks": tat["by_carrier"],
            "plant_bottlenecks": tat["by_plant"],
            "top_critical_delays": delay["vehicles"][:10],
        }, default=str)
    except Exception as exc:
        return f"Bottleneck analysis error: {str(exc)[:300]}"


@tool
def get_waiting_vehicles() -> str:
    """List waiting customer orders and active shipments queued for dispatch staging within the user's assigned plant scope."""
    if not _has_perm("dock_allocation", "dispatch_dashboard"):
        return "PERMISSION DENIED: Your role lacks 'dock_allocation' or 'dispatch_dashboard' permission."
    plant = _plant_scope()
    try:
        res = get_dock_allocation_recommendations(plant_id=plant)
        return json.dumps({
            "summary": res["summary"],
            "waiting_queue": res["recommendations"][:20],
            "limitation_notice": res["limitation_notice"],
        }, default=str)
    except Exception as exc:
        return f"Waiting vehicles lookup error: {str(exc)[:300]}"


@tool
def get_dock_availability() -> str:
    """Check finished goods warehouse staging availability (FG-WH-01) and report missing physical dock bay fields."""
    if not _has_perm("dock_allocation"):
        return "PERMISSION DENIED: Your role lacks 'dock_allocation' permission."
    plant = _plant_scope()
    try:
        res = get_dock_allocation_recommendations(plant_id=plant)
        return json.dumps({
            "warehouse_readiness": res["warehouse_readiness"],
            "missing_dock_fields": res["missing_dock_fields"],
            "limitation_notice": res["limitation_notice"],
        }, default=str)
    except Exception as exc:
        return f"Dock availability error: {str(exc)[:300]}"


@tool
def recommend_dock_allocation() -> str:
    """Recommend prioritized warehouse staging and dispatch slots subject to authorized staff approval."""
    if not _has_perm("dock_allocation"):
        return "PERMISSION DENIED: Your role lacks 'dock_allocation' permission."
    plant = _plant_scope()
    try:
        res = get_dock_allocation_recommendations(plant_id=plant)
        return json.dumps({
            "control_rule": "Recommendations only; authorized staff approval required via the Smart Dock Allocation board.",
            "limitation_notice": res["limitation_notice"],
            "summary": res["summary"],
            "recommendations": res["recommendations"][:15],
        }, default=str)
    except Exception as exc:
        return f"Dock recommendation error: {str(exc)[:300]}"


@tool
def generate_daily_logistics_summary(date: str = "") -> str:
    """Generate a daily logistics management report for a YYYY-MM-DD date (Manager & Logistics Reports permission required)."""
    if not _has_perm("management_reports", "logistics_reports"):
        return "PERMISSION DENIED: Dispatch Workers cannot access automated management reports."
    try:
        rep = generate_logistics_report(report_type="daily", start_date=date or None, end_date=date or None)
        if not _has_perm("management_reports"):
            rep["vehicle_movement_summary"].pop("total_freight_inr", None)
        return json.dumps(rep, default=str)
    except Exception as exc:
        return f"Daily report error: {str(exc)[:300]}"


@tool
def generate_periodic_logistics_report(report_type: str = "weekly", start_date: str = "", end_date: str = "") -> str:
    """Generate a weekly, monthly, or custom date-range management logistics report (Manager permission required for full executive report)."""
    if not _has_perm("management_reports"):
        return "PERMISSION DENIED: Full management reports and executive cost summaries require Manager authorization."
    try:
        rep = generate_logistics_report(report_type=report_type, start_date=start_date or None, end_date=end_date or None)
        return json.dumps(rep, default=str)
    except Exception as exc:
        return f"Periodic report error: {str(exc)[:300]}"


TOOLS = [
    get_database_schema,
    run_readonly_sql,
    get_vehicle_journey,
    analyze_vehicle_delay_risk,
    calculate_vehicle_tat,
    analyze_stage_waiting_times,
    analyze_bottlenecks,
    get_waiting_vehicles,
    get_dock_availability,
    recommend_dock_allocation,
    generate_daily_logistics_summary,
    generate_periodic_logistics_report,
]
