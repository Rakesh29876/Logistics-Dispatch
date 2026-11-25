from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import text, or_
from sqlalchemy.orm import joinedload
from .config import settings
from .db import (
    SessionLocal, Conversation, Message, Role, Permission, RolePermission, User, AuditLog,
    init_db, engine
)
from .analytics import (
    dashboard, shipment_trends, carrier_performance,
    shipments, shipment_detail, orders, inventory
)
from .operations_analytics import (
    get_vehicle_delay_analysis,
    get_tat_optimization_analysis,
    get_vehicle_tat_detail,
    get_dock_allocation_recommendations,
    record_dock_approval,
    generate_logistics_report,
    export_logistics_report_xlsx,
    export_logistics_report_pdf,
    get_dispatch_dashboard,
    get_logistics_dashboard,
    get_digital_twin_snapshot,
    get_drilldown_details,
    invalidate_analytics_cache,
)
from .auth import (
    seed_rbac_and_admin, hash_password, verify_password, validate_password_strength,
    create_access_token, write_audit_log, get_current_user, require_permissions,
    get_user_permissions, serialize_user
)
from .agent import run_agent
from .data_ingestion import ingest_all, get_ingestion_summary
from .email_trigger_agent import (
    generate_management_email_report,
    get_email_alert_history,
    get_email_alert_by_id,
    get_email_trigger_config,
    update_email_trigger_config,
    get_weighbridge_inbound_prioritization,
    get_plant_dwell_tat_anomalies,
    get_urgent_dock_allocations,
)
from .agent_architecture import (
    seed_agent_architecture_defaults,
    get_architecture_overview,
    get_agent_architecture_detail,
    execute_agent_processing,
    generate_agent_ai_insights,
    update_business_rule,
    get_pipeline_monitoring,
    trigger_pipeline_refresh,
    get_motherson_pipeline_architecture,
    trigger_motherson_pipeline_etl,
)

app = FastAPI(
    title="Intelligent Logistics Operations Agent API",
    version="2.0.0",
    description="Role-based Manufacturing Logistics Control Tower, Predictive Delay, TAT, Dock Allocation, Reports, 3D Digital Twin & Domo AI."
)

cors_origins_list = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    import time
    for attempt in range(3):
        try:
            init_db()
            seed_rbac_and_admin()
            break
        except Exception as err:
            if attempt == 2:
                print(f"Startup DB init failed after 3 attempts: {err}")
                raise
            print(f"Neon DB waking up (attempt {attempt + 1}/3)... retrying in 2s")
            time.sleep(2)
    try:
        ingest_all(force=settings.data_reload_on_startup)
        seed_agent_architecture_defaults()
    except Exception as e:
        print(f"Startup data validation/ingestion failed: {e}")


# ---------- Pydantic Schemas ----------
class LoginIn(BaseModel):
    identifier: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=1, max_length=200)
    remember_me: bool = False


class ForgotPasswordIn(BaseModel):
    identifier: str = Field(min_length=2, max_length=150)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=8, max_length=200)


class CreateUserIn(BaseModel):
    employee_id: str = Field(min_length=2, max_length=40)
    full_name: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=3, max_length=80)
    email: str = Field(min_length=5, max_length=150)
    department: str = Field(min_length=2, max_length=100)
    plant_id: str = Field(default="ALL", max_length=40)
    role_id: int
    password: str = Field(min_length=8, max_length=200)


class UpdateUserIn(BaseModel):
    role_id: int | None = None
    department: str | None = Field(default=None, max_length=100)
    plant_id: str | None = Field(default=None, max_length=40)
    is_active: bool | None = None


class ResetPasswordIn(BaseModel):
    new_password: str = Field(min_length=8, max_length=200)


class UpdateRolePermissionsIn(BaseModel):
    permission_keys: list[str]


class ChatIn(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=2, max_length=4000)


class DockApprovalIn(BaseModel):
    reference_id: str = Field(min_length=2, max_length=64)
    recommended_facility: str = Field(min_length=2, max_length=64)
    priority_tier: str = Field(min_length=2, max_length=32)
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    notes: str | None = Field(default=None, max_length=500)


# ---------- Public Health & Auth Routes ----------
@app.get("/api/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "database_host": settings.masked_database_host,
            "dialect": engine.dialect.name,
            "agent": "configured" if settings.domo_token else "missing Domo token",
            "model": settings.domo_model
        }
    except Exception as exc:
        raise HTTPException(503, f"Database connection failed: {str(exc)[:250]}")


@app.post("/api/auth/login")
def login(body: LoginIn):
    ident = body.identifier.strip()
    now = datetime.now(timezone.utc)
    with SessionLocal() as session:
        user = (
            session.query(User)
            .options(joinedload(User.role))
            .filter(or_(User.username == ident, User.employee_id == ident, User.email == ident))
            .first()
        )
        if not user:
            write_audit_log(None, "LOGIN_FAILED", "Auth", f"Unknown login identifier '{ident}'")
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username/employee ID or password.")

        if not user.is_active:
            write_audit_log(user.id, "LOGIN_BLOCKED_INACTIVE", "Auth", f"Inactive user '{user.username}' attempted login.")
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account is inactive. Contact your Operations Manager.")

        if user.locked_until:
            lu = user.locked_until if user.locked_until.tzinfo else user.locked_until.replace(tzinfo=timezone.utc)
            if lu > now:
                mins = int((lu - now).total_seconds() // 60) + 1
                write_audit_log(user.id, "LOGIN_LOCKED", "Auth", f"Locked account '{user.username}' attempted login.")
                raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Account temporarily locked due to failed attempts. Try again in {mins} min.")

        if not verify_password(body.password, user.password_hash):
            user.failed_attempts = (user.failed_attempts or 0) + 1
            if user.failed_attempts >= 5:
                user.locked_until = now + timedelta(minutes=10)
            session.commit()
            write_audit_log(user.id, "LOGIN_FAILED", "Auth", f"Invalid password for '{user.username}' (attempt {user.failed_attempts})")
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username/employee ID or password.")

        user.failed_attempts = 0
        user.locked_until = None
        user.last_login = now
        session.commit()

        perms = get_user_permissions(session, user.role_id)
        token, expires_in = create_access_token(user, remember_me=body.remember_me)
        user_payload = serialize_user(user, perms)

    write_audit_log(user_payload["id"], "LOGIN_SUCCESS", "Auth", f"Logged in as {user_payload['role']} (plant: {user_payload['plant_id']})")
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": user_payload}


@app.post("/api/auth/forgot-password")
def forgot_password(body: ForgotPasswordIn):
    ident = body.identifier.strip()
    with SessionLocal() as session:
        user = session.query(User).filter(or_(User.username == ident, User.employee_id == ident, User.email == ident)).first()
        uid = user.id if user else None
    write_audit_log(uid, "FORGOT_PASSWORD_REQUEST", "Auth", f"Password reset requested for identifier '{ident}'")
    return {"status": "submitted", "message": "If an account matches that ID/username, your password reset request has been logged for Manager approval."}


@app.get("/api/auth/me")
def auth_me(user: dict = Depends(get_current_user)):
    return user


@app.post("/api/auth/logout")
def logout(user: dict = Depends(get_current_user)):
    write_audit_log(user["id"], "LOGOUT", "Auth", f"User '{user['username']}' signed out.")
    return {"status": "ok"}


@app.post("/api/auth/change-password")
def change_password(body: ChangePasswordIn, user: dict = Depends(get_current_user)):
    try:
        validate_password_strength(body.new_password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    with SessionLocal() as session:
        db_user = session.query(User).filter_by(id=user["id"]).first()
        if not db_user or not verify_password(body.current_password, db_user.password_hash):
            raise HTTPException(400, "Current password is incorrect.")
        db_user.password_hash = hash_password(body.new_password)
        db_user.updated_at = datetime.now(timezone.utc)
        session.commit()
    write_audit_log(user["id"], "PASSWORD_CHANGED", "User Profile", "User updated their own password.")
    return {"status": "ok", "message": "Password updated successfully."}


# ---------- Data Health (Manager Only) ----------
@app.get("/api/data-health")
def data_health(user: dict = Depends(require_permissions("data_health"))):
    return get_ingestion_summary(engine)


@app.post("/api/data-reload")
def reload_data(user: dict = Depends(require_permissions("data_health"))):
    try:
        summary = ingest_all(force=True)
        write_audit_log(user["id"], "DATA_RELOAD", "Data Health", "Full dataset reload from data.zip triggered.")
        return {"status": "success", "message": "Datasets reloaded successfully", "summary": summary}
    except Exception as exc:
        raise HTTPException(500, f"Data reload failed: {str(exc)[:300]}")


# ---------- Role-Scoped Dashboards & 3D Digital Twin ----------
@app.get("/api/dashboard")
@app.get("/api/dashboard/summary")
def get_dashboard_summary(
    year: int | None = None,
    month: int | None = None,
    week: int | None = None,
    day: str | None = None,
    time_shift: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    plant_id: str | None = None,
    carrier: str | None = None,
    vehicle_type: str | None = None,
    shipment_status: str | None = None,
    delay_risk: str | None = None,
    priority: str | None = None,
    user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard")),
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    res = dashboard(
        year=year,
        month=month,
        week=week,
        day=day,
        time_shift=time_shift,
        start_date=start_date,
        end_date=end_date,
        plant_id=effective_plant,
        carrier=carrier,
        vehicle_type=vehicle_type,
        shipment_status=shipment_status,
        delay_risk=delay_risk,
        priority=priority,
    )
    if user.get("role") == "DISPATCH_WORKER" or "carrier_performance" not in user.get("permissions", []):
        if isinstance(res, dict) and "kpis" in res:
            res["kpis"]["freight_cost_inr"] = 0
            res["kpis"]["avg_freight_per_unit"] = 0
    return res


@app.get("/api/dispatch/dashboard")
def dispatch_dashboard(user: dict = Depends(require_permissions("dispatch_dashboard", "executive_dashboard"))):
    return get_dispatch_dashboard(plant_id=user.get("plant_id"))


@app.get("/api/logistics/dashboard")
def logistics_dashboard(user: dict = Depends(require_permissions("logistics_dashboard", "executive_dashboard"))):
    return get_logistics_dashboard(plant_id=user.get("plant_id"))


@app.get("/api/digital-twin")
def digital_twin(
    plant_id: str | None = None,
    user: dict = Depends(require_permissions("digital_twin"))
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    return get_digital_twin_snapshot(plant_id=effective_plant, role=user.get("role", "MANAGER"))


@app.get("/api/dashboard/shipment-trends")
def get_shipment_trends(
    year: int | None = None,
    month: int | None = None,
    week: int | None = None,
    day: str | None = None,
    time_shift: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    plant_id: str | None = None,
    carrier: str | None = None,
    vehicle_type: str | None = None,
    shipment_status: str | None = None,
    user: dict = Depends(require_permissions("executive_dashboard", "logistics_dashboard")),
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    d = dashboard(
        year=year,
        month=month,
        week=week,
        day=day,
        time_shift=time_shift,
        start_date=start_date,
        end_date=end_date,
        plant_id=effective_plant,
        carrier=carrier,
        vehicle_type=vehicle_type,
        shipment_status=shipment_status,
    )
    return {
        "trend": d["trend"],
        "status_distribution": d["status_distribution"],
        "plant_analysis": d["plant_analysis"]
    }


@app.get("/api/dashboard/carrier-performance")
def get_carrier_performance(user: dict = Depends(require_permissions("carrier_performance"))):
    return carrier_performance()


# ---------- Autonomous Email Trigger & Stuck Vehicle Alerts ----------
@app.post("/api/alerts/trigger-email-scan")
def trigger_email_scan(
    plant_id: str | None = None,
    user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard")),
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    res = generate_management_email_report(
        trigger_type="MANUAL_ON_DEMAND",
        plant_id=effective_plant,
        triggered_by=user.get("username", "user"),
    )
    write_audit_log(user.get("id"), "TRIGGER_EMAIL_ALERT_SCAN", f"Generated email alert #{res.get('log_id')} with {res['summary']['total_stuck_vehicles']} stuck vehicles")
    return res


@app.get("/api/alerts/status")
def get_alert_status(user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard"))):
    cfg = get_email_trigger_config()
    history = get_email_alert_history(limit=1)
    latest_alert = history[0] if history else None
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else None
    dwell = get_plant_dwell_tat_anomalies(plant_id=effective_plant, threshold_hrs=cfg["tat_excess_threshold_hrs"])
    return {
        "config": cfg,
        "latest_alert": latest_alert,
        "stuck_vehicle_count": len(dwell),
        "critical_count": sum(1 for d in dwell if d["severity"] == "CRITICAL"),
        "monitor_status": "ACTIVE_MONITORING" if cfg["auto_trigger_enabled"] else "STANDBY",
    }


@app.get("/api/alerts/history")
def alert_history(
    limit: int = Query(25, ge=1, le=100),
    user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard")),
):
    return get_email_alert_history(limit=limit)


@app.get("/api/alerts/email-preview/{log_id}")
def alert_preview(
    log_id: int,
    user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard")),
):
    res = get_email_alert_by_id(log_id)
    if not res:
        raise HTTPException(404, f"Email alert log #{log_id} not found.")
    return res


@app.get("/api/alerts/stuck-vehicles")
def get_stuck_vehicles_summary(
    plant_id: str | None = None,
    user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard")),
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    cfg = get_email_trigger_config()
    return {
        "weighbridge_sequence": get_weighbridge_inbound_prioritization(plant_id=effective_plant),
        "dwell_anomalies": get_plant_dwell_tat_anomalies(plant_id=effective_plant, threshold_hrs=cfg["tat_excess_threshold_hrs"]),
        "urgent_docks": get_urgent_dock_allocations(plant_id=effective_plant),
    }


class AlertConfigUpdate(BaseModel):
    manager_email: Optional[str] = None
    secondary_emails: Optional[str] = None
    tat_excess_threshold_hrs: Optional[float] = None
    dock_wait_threshold_hrs: Optional[float] = None
    auto_trigger_enabled: Optional[bool] = None
    check_interval_minutes: Optional[int] = None


@app.get("/api/alerts/config")
def get_alert_config(user: dict = Depends(require_permissions("executive_dashboard", "dispatch_dashboard", "logistics_dashboard"))):
    return get_email_trigger_config()


@app.post("/api/alerts/config")
def set_alert_config(
    payload: AlertConfigUpdate,
    user: dict = Depends(require_permissions("user_management")),
):
    cfg = update_email_trigger_config(
        manager_email=payload.manager_email,
        secondary_emails=payload.secondary_emails,
        tat_excess_threshold_hrs=payload.tat_excess_threshold_hrs,
        dock_wait_threshold_hrs=payload.dock_wait_threshold_hrs,
        auto_trigger_enabled=payload.auto_trigger_enabled,
        check_interval_minutes=payload.check_interval_minutes,
    )
    write_audit_log(user.get("id"), "UPDATE_EMAIL_TRIGGER_CONFIG", f"Updated email trigger thresholds for {cfg['manager_email']}")
    return cfg


@app.post("/api/alerts/inbound-trigger")
def inbound_email_trigger(plant_id: str | None = None):
    """External webhook/cron trigger to initiate automated scan and dispatch email alert."""
    res = generate_management_email_report(
        trigger_type="AUTOMATED_SCHEDULE",
        plant_id=plant_id,
        triggered_by="autonomous_dispatch_scheduler",
    )
    return res


# ---------- Operational Queries (Plant & Role Scoped) ----------
@app.get("/api/shipments")
def get_shipments(
    status: str | None = None,
    carrier: str | None = None,
    plant: str | None = None,
    search: str | None = None,
    limit: int = Query(100, ge=1, le=250),
    user: dict = Depends(require_permissions("dispatch_dashboard", "logistics_dashboard", "executive_dashboard"))
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant
    recs = shipments(status=status, carrier=carrier, plant=effective_plant, search=search, limit=limit)
    if user.get("role") == "DISPATCH_WORKER":
        for r in recs:
            r.pop("freight_cost_inr", None)
    return recs


@app.get("/api/shipments/{shipment_id}")
def get_shipment_detail(
    shipment_id: str,
    user: dict = Depends(require_permissions("dispatch_dashboard", "logistics_dashboard", "executive_dashboard"))
):
    res = shipment_detail(shipment_id)
    if not res:
        raise HTTPException(404, f"Shipment '{shipment_id}' not found.")
    user_plant = user.get("plant_id")
    if user_plant and user_plant != "ALL" and res.get("plant_id") != user_plant:
        raise HTTPException(403, f"Access denied to plant '{res.get('plant_id')}' dispatch records.")
    if user.get("role") == "DISPATCH_WORKER":
        res.pop("freight_cost_inr", None)
    return res


@app.get("/api/orders")
def get_orders(
    priority: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = Query(100, ge=1, le=250),
    user: dict = Depends(require_permissions("dispatch_dashboard", "logistics_dashboard", "executive_dashboard"))
):
    recs = orders(priority=priority, status=status, search=search, limit=limit)
    if user.get("role") == "DISPATCH_WORKER":
        for r in recs:
            r.pop("unit_price_inr", None)
    return recs


@app.get("/api/inventory")
def get_inventory(
    plant_id: str | None = None,
    warehouse_id: str | None = None,
    user: dict = Depends(require_permissions("executive_dashboard", "dock_allocation", "logistics_dashboard"))
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    return inventory(plant_id=effective_plant, warehouse_id=warehouse_id)


# ---------- 4 Core Use Cases (RBAC Protected) ----------
@app.get("/api/delay-risk")
def delay_risk(
    risk_level: str | None = None,
    checkpoint: str | None = None,
    plant_id: str | None = None,
    carrier: str | None = None,
    vehicle_type: str | None = None,
    shipment_status: str | None = None,
    search: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = Query(100, ge=1, le=250),
    user: dict = Depends(require_permissions("delay_risk"))
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    res = get_vehicle_delay_analysis(
        risk_level=risk_level, checkpoint=checkpoint, search=search,
        start_date=start_date, end_date=end_date, plant_id=effective_plant,
        carrier=carrier, vehicle_type=vehicle_type, shipment_status=shipment_status, limit=limit
    )
    if user.get("role") == "DISPATCH_WORKER":
        for v in res["vehicles"]:
            v.pop("freight_cost_inr", None)
    return res


@app.get("/api/tat")
def tat_overview(
    start_date: str | None = None,
    end_date: str | None = None,
    plant_id: str | None = None,
    carrier: str | None = None,
    vehicle_type: str | None = None,
    user: dict = Depends(require_permissions("tat_optimization"))
):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    return get_tat_optimization_analysis(
        start_date=start_date, end_date=end_date,
        plant_id=effective_plant, carrier=carrier, vehicle_type=vehicle_type
    )


@app.get("/api/tat/{shipment_id}")
@app.get("/api/journey/{shipment_id}")
@app.get("/api/vehicle/{shipment_id}")
def tat_vehicle_detail(
    shipment_id: str,
    user: dict = Depends(require_permissions("tat_optimization", "delay_risk", "dispatch_dashboard", "logistics_dashboard", "executive_dashboard"))
):
    res = get_vehicle_tat_detail(shipment_id)
    if not res:
        raise HTTPException(404, f"Vehicle/shipment '{shipment_id}' not found.")
    user_plant = user.get("plant_id")
    if user_plant and user_plant != "ALL" and res.get("plant_id") != user_plant:
        raise HTTPException(403, f"Access denied to plant '{res.get('plant_id')}' vehicle journey.")
    if user.get("role") == "DISPATCH_WORKER":
        res.pop("freight_cost_inr", None)
    return res


@app.get("/api/drilldown")
def kpi_visual_drilldown(
    metric: str = Query(..., min_length=1),
    value: str | None = None,
    plant_id: str | None = None,
    limit: int = Query(250, ge=1, le=1000),
    year: int | None = None,
    month: int | None = None,
    week: int | None = None,
    day: str | None = None,
    time_shift: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    carrier: str | None = None,
    vehicle_type: str | None = None,
    shipment_status: str | None = None,
    user: dict = Depends(require_permissions(
        "executive_dashboard", "dispatch_dashboard", "logistics_dashboard",
        "delay_risk", "tat_optimization", "dock_allocation"
    ))
):
    if user.get("role") == "DISPATCH_WORKER" and metric.lower().strip() == "carrier":
        raise HTTPException(403, "Carrier analytics drilldown is restricted for Dispatch Workers.")
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else plant_id
    return get_drilldown_details(
        metric=metric,
        value=value,
        plant_id=effective_plant,
        role=user.get("role", "MANAGER"),
        limit=limit,
        year=year,
        month=month,
        week=week,
        day=day,
        time_shift=time_shift,
        start_date=start_date,
        end_date=end_date,
        carrier=carrier,
        vehicle_type=vehicle_type,
        shipment_status=shipment_status,
    )


@app.get("/api/dock/recommendations")
def dock_recommendations(user: dict = Depends(require_permissions("dock_allocation"))):
    effective_plant = user.get("plant_id") if user.get("plant_id") and user.get("plant_id") != "ALL" else None
    return get_dock_allocation_recommendations(plant_id=effective_plant)


@app.post("/api/dock/approvals")
def dock_approve(
    body: DockApprovalIn,
    user: dict = Depends(require_permissions("dock_approval"))
):
    reviewer = f"{user['full_name']} ({user['employee_id']})"
    res = record_dock_approval(
        reference_id=body.reference_id,
        recommended_facility=body.recommended_facility,
        priority_tier=body.priority_tier,
        decision=body.decision,
        reviewed_by=reviewer,
        notes=body.notes,
    )
    write_audit_log(user["id"], f"DOCK_{body.decision}", "Smart Dock Allocation", f"{body.reference_id} -> {body.recommended_facility}")
    return res


@app.get("/api/reports")
def management_report(
    report_type: str = Query("weekly", pattern="^(daily|weekly|monthly|custom)$"),
    start_date: str | None = None,
    end_date: str | None = None,
    vehicle_type: str | None = None,
    plant_id: str | None = None,
    user: dict = Depends(require_permissions("management_reports", "logistics_reports"))
):
    perms = set(user.get("permissions", []))
    if report_type in ("monthly", "custom") and "management_reports" not in perms:
        raise HTTPException(403, "Monthly and custom management reports require Manager permission.")
    rep = generate_logistics_report(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        vehicle_type=vehicle_type,
        plant_id=plant_id,
    )
    if "management_reports" not in perms:
        rep["vehicle_movement_summary"].pop("total_freight_inr", None)
        for c in rep.get("carrier_breakdown", []):
            c.pop("freight_inr", None)
    return rep


@app.get("/api/reports/export")
def export_report(
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    report_type: str = Query("weekly", pattern="^(daily|weekly|monthly|custom)$"),
    start_date: str | None = None,
    end_date: str | None = None,
    vehicle_type: str | None = None,
    plant_id: str | None = None,
    user: dict = Depends(require_permissions("management_reports"))
):
    write_audit_log(user["id"], f"EXPORT_REPORT_{format.upper()}", "Management Reports", f"type={report_type}&vt={vehicle_type}")
    if format == "xlsx":
        content = export_logistics_report_xlsx(
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            vehicle_type=vehicle_type,
            plant_id=plant_id,
        )
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="logistics_report_{report_type}.xlsx"'},
        )
    content = export_logistics_report_pdf(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        vehicle_type=vehicle_type,
        plant_id=plant_id,
    )
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="logistics_report_{report_type}.pdf"'},
    )


# ---------- AI Assistant (Role & Plant Scoped) ----------
@app.get("/api/conversations")
def list_conversations(user: dict = Depends(require_permissions("ai_assistant"))):
    with SessionLocal() as session:
        q = session.query(Conversation)
        if user.get("role") != "MANAGER":
            q = q.filter(Conversation.user_id == user["id"])
        items = q.order_by(Conversation.created_at.desc()).limit(50).all()
        return [{"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()} for c in items]


@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, user: dict = Depends(require_permissions("ai_assistant"))):
    with SessionLocal() as session:
        conv = session.get(Conversation, conversation_id)
        if not conv:
            raise HTTPException(404, "Conversation not found.")
        if user.get("role") != "MANAGER" and conv.user_id != user["id"]:
            raise HTTPException(403, "You do not have access to another user's conversation.")
        items = session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.id).all()
        return [{"role": m.role, "content": m.content, "steps": m.steps} for m in items]


@app.post("/api/chat")
def chat(body: ChatIn, user: dict = Depends(require_permissions("ai_assistant"))):
    with SessionLocal() as session:
        conversation = session.get(Conversation, body.conversation_id) if body.conversation_id else None
        if conversation and user.get("role") != "MANAGER" and conversation.user_id != user["id"]:
            raise HTTPException(403, "Cannot post into another user's conversation.")
        if not conversation:
            conversation = Conversation(title=body.message[:64], user_id=user["id"])
            session.add(conversation)
            session.flush()
        history = [{"role": m.role, "content": m.content} for m in conversation.messages]
        session.add(Message(conversation_id=conversation.id, role="user", content=body.message))
        try:
            answer, steps = run_agent(body.message, history, user_context=user)
        except Exception as exc:
            session.rollback()
            raise HTTPException(502, f"AI agent failed: {str(exc)[:300]}")
        session.add(Message(conversation_id=conversation.id, role="assistant", content=answer, steps=steps))
        session.commit()
    write_audit_log(user["id"], "AI_CHAT_QUERY", "AI Logistics Assistant", f"role={user['role']}, tools={[s['tool'] for s in steps]}")
    return {"conversation_id": conversation.id, "answer": answer, "steps": steps}


# ---------- Manager User Management, Permission Matrix & Audit Logs ----------
@app.get("/api/admin/users")
def admin_list_users(
    search: str | None = None,
    department: str | None = None,
    role: str | None = None,
    user: dict = Depends(require_permissions("user_management"))
):
    with SessionLocal() as session:
        q = session.query(User).options(joinedload(User.role))
        if search and search.strip():
            s = f"%{search.strip()}%"
            q = q.filter(or_(User.employee_id.ilike(s), User.full_name.ilike(s), User.username.ilike(s)))
        if department and department.upper() != "ALL":
            q = q.filter(User.department == department)
        if role and role.upper() != "ALL":
            q = q.join(Role).filter(Role.role_name == role.upper())
        users = q.order_by(User.id.asc()).all()
        return [serialize_user(u, get_user_permissions(session, u.role_id)) for u in users]


@app.post("/api/admin/users")
def admin_create_user(body: CreateUserIn, user: dict = Depends(require_permissions("user_management"))):
    try:
        validate_password_strength(body.password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    with SessionLocal() as session:
        role_obj = session.get(Role, body.role_id)
        if not role_obj:
            raise HTTPException(400, "Invalid role_id.")
        dup = session.query(User).filter(
            or_(User.username == body.username.strip(), User.employee_id == body.employee_id.strip(), User.email == body.email.strip())
        ).first()
        if dup:
            raise HTTPException(409, "Employee ID, username, or email already exists.")
        new_u = User(
            employee_id=body.employee_id.strip(),
            full_name=body.full_name.strip(),
            username=body.username.strip(),
            email=body.email.strip(),
            password_hash=hash_password(body.password),
            role_id=role_obj.id,
            department=body.department.strip(),
            plant_id=body.plant_id.strip() or "ALL",
            is_active=True,
        )
        session.add(new_u)
        session.commit()
        session.refresh(new_u)
        new_u_loaded = session.query(User).options(joinedload(User.role)).filter_by(id=new_u.id).first()
        out = serialize_user(new_u_loaded, get_user_permissions(session, new_u_loaded.role_id))
    write_audit_log(user["id"], "USER_CREATED", "User Management", f"Created {out['username']} ({out['employee_id']}) role={out['role']} plant={out['plant_id']}")
    return out


@app.patch("/api/admin/users/{target_user_id}")
def admin_update_user(target_user_id: int, body: UpdateUserIn, user: dict = Depends(require_permissions("user_management"))):
    with SessionLocal() as session:
        target = session.query(User).options(joinedload(User.role)).filter_by(id=target_user_id).first()
        if not target:
            raise HTTPException(404, "User not found.")
        if target.id == user["id"] and body.is_active is False:
            raise HTTPException(400, "Manager cannot deactivate their own active account.")
        if body.role_id is not None:
            r = session.get(Role, body.role_id)
            if not r:
                raise HTTPException(400, "Invalid role_id.")
            target.role_id = r.id
        if body.department is not None:
            target.department = body.department.strip()
        if body.plant_id is not None:
            target.plant_id = body.plant_id.strip()
        if body.is_active is not None:
            target.is_active = body.is_active
            if body.is_active:
                target.failed_attempts = 0
                target.locked_until = None
        target.updated_at = datetime.now(timezone.utc)
        session.commit()
        target = session.query(User).options(joinedload(User.role)).filter_by(id=target_user_id).first()
        out = serialize_user(target, get_user_permissions(session, target.role_id))
    write_audit_log(user["id"], "USER_UPDATED", "User Management", f"Updated {out['username']} -> active={out['is_active']}, role={out['role']}, plant={out['plant_id']}")
    return out


@app.post("/api/admin/users/{target_user_id}/reset-password")
def admin_reset_password(target_user_id: int, body: ResetPasswordIn, user: dict = Depends(require_permissions("user_management"))):
    try:
        validate_password_strength(body.new_password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    with SessionLocal() as session:
        target = session.get(User, target_user_id)
        if not target:
            raise HTTPException(404, "User not found.")
        target.password_hash = hash_password(body.new_password)
        target.failed_attempts = 0
        target.locked_until = None
        target.updated_at = datetime.now(timezone.utc)
        uname = target.username
        session.commit()
    write_audit_log(user["id"], "ADMIN_PASSWORD_RESET", "User Management", f"Manager reset password for user '{uname}'")
    return {"status": "ok", "message": f"Password reset completed for '{uname}'."}


@app.get("/api/admin/roles")
def admin_get_roles(user: dict = Depends(require_permissions("user_management", "audit_logs"))):
    with SessionLocal() as session:
        roles = session.query(Role).order_by(Role.id.asc()).all()
        perms = session.query(Permission).order_by(Permission.id.asc()).all()
        return {
            "roles": [
                {
                    "id": r.id,
                    "role_name": r.role_name,
                    "description": r.description,
                    "permissions": get_user_permissions(session, r.id),
                }
                for r in roles
            ],
            "all_permissions": [
                {
                    "id": p.id,
                    "permission_key": p.permission_key,
                    "permission_name": p.permission_name,
                    "module_name": p.module_name,
                }
                for p in perms
            ],
        }


@app.put("/api/admin/roles/{role_id}/permissions")
def admin_update_role_permissions(
    role_id: int,
    body: UpdateRolePermissionsIn,
    user: dict = Depends(require_permissions("audit_logs", "user_management"))
):
    with SessionLocal() as session:
        role_obj = session.get(Role, role_id)
        if not role_obj:
            raise HTTPException(404, "Role not found.")
        if role_obj.role_name == "MANAGER" and "user_management" not in body.permission_keys:
            raise HTTPException(400, "Cannot remove 'user_management' from MANAGER role.")
        valid_perms = {p.permission_key: p.id for p in session.query(Permission).all()}
        session.query(RolePermission).filter_by(role_id=role_id).delete()
        for pk in set(body.permission_keys):
            if pk in valid_perms:
                session.add(RolePermission(role_id=role_id, permission_id=valid_perms[pk]))
        session.commit()
        updated = get_user_permissions(session, role_id)
    write_audit_log(user["id"], "ROLE_PERMISSIONS_UPDATED", "Audit & Permissions", f"Role {role_obj.role_name} permissions -> {updated}")
    return {"role_id": role_id, "role_name": role_obj.role_name, "permissions": updated}


@app.get("/api/admin/audit-logs")
def admin_audit_logs(limit: int = Query(100, ge=1, le=300), user: dict = Depends(require_permissions("audit_logs"))):
    with SessionLocal() as session:
        logs = (
            session.query(AuditLog, User.username, User.employee_id)
            .outerjoin(User, AuditLog.user_id == User.id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": uname or "System",
                "employee_id": emp_id or "—",
                "action": log.action,
                "module_name": log.module_name,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "details": log.details,
            }
            for log, uname, emp_id in logs
        ]


# ---------- Agent Architecture, Business Rules & Data Pipeline Monitoring ----------
class UpdateRuleIn(BaseModel):
    agent_key: str = Field(min_length=3, max_length=40)
    rule_key: str = Field(min_length=2, max_length=80)
    rule_value: str = Field(min_length=1, max_length=80)


class PipelineRefreshIn(BaseModel):
    mode: str = Field(default="incremental", pattern="^(incremental|full)$")


@app.get("/api/architecture/agents")
def architecture_agents_list(user: dict = Depends(require_permissions("agent_architecture"))):
    return get_architecture_overview()


@app.get("/api/architecture/agents/{agent_key}")
def architecture_agent_detail(agent_key: str, user: dict = Depends(require_permissions("agent_architecture"))):
    try:
        return get_agent_architecture_detail(agent_key, user)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@app.post("/api/architecture/agents/{agent_key}/run")
def architecture_run_agent(agent_key: str, user: dict = Depends(require_permissions("agent_architecture"))):
    try:
        res = execute_agent_processing(agent_key, triggered_by=f"{user['full_name']} ({user['employee_id']})")
        write_audit_log(user["id"], "AGENT_PROCESSING_RUN", "Agent Architecture", f"Executed {agent_key}: {res['status']} ({res['records_processed']} records)")
        return res
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@app.put("/api/architecture/rules")
def architecture_update_rule(body: UpdateRuleIn, user: dict = Depends(require_permissions("rules_configuration"))):
    try:
        res = update_business_rule(
            agent_key=body.agent_key,
            rule_key=body.rule_key,
            new_value=body.rule_value,
            updated_by=f"{user['full_name']} ({user['employee_id']})",
        )
        write_audit_log(user["id"], "BUSINESS_RULE_UPDATED", "Agent Architecture", f"{body.agent_key}.{body.rule_key} -> {res['rule_value']}")
        return res
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@app.post("/api/agents/{agent_key}/ai-insights")
def agent_ai_insights(agent_key: str, user: dict = Depends(require_permissions("ai_assistant"))):
    required_perm_map = {
        "delay_agent": "delay_risk",
        "tat_agent": "tat_optimization",
        "dock_agent": "dock_allocation",
        "report_agent": "management_reports",
    }
    needed = required_perm_map.get(agent_key)
    if not needed:
        raise HTTPException(404, f"Unknown agent '{agent_key}'")
    perms = set(user.get("permissions", []))
    if not (user.get("role") == "MANAGER" and "user_management" in perms) and needed not in perms:
        if not (agent_key == "report_agent" and "logistics_reports" in perms):
            raise HTTPException(403, f"Role '{user.get('role')}' lacks permission '{needed}' for {agent_key}.")
    res = generate_agent_ai_insights(agent_key, plant_scope=user.get("plant_id"), role=user.get("role", "MANAGER"))
    write_audit_log(user["id"], "AGENT_AI_INSIGHTS", "AI Intelligence", f"Generated insights for {agent_key} via {res['ai_engine']}")
    return res


@app.get("/api/pipeline/monitoring")
def pipeline_monitoring(user: dict = Depends(require_permissions("pipeline_monitoring"))):
    return get_pipeline_monitoring()


@app.post("/api/pipeline/refresh")
def pipeline_refresh(body: PipelineRefreshIn, user: dict = Depends(require_permissions("pipeline_monitoring"))):
    try:
        res = trigger_pipeline_refresh(mode=body.mode, triggered_by=f"{user['full_name']} ({user['employee_id']})")
        write_audit_log(user["id"], "PIPELINE_REFRESH", "Data Pipeline", f"Mode={body.mode}, records={res['records_processed']}, status={res['status']}")
        return res
    except Exception as exc:
        raise HTTPException(500, f"Pipeline refresh failed: {str(exc)[:300]}")


@app.get("/api/architecture/motherson-pipeline")
def get_motherson_pipeline(user: dict = Depends(get_current_user)):
    return get_motherson_pipeline_architecture()


@app.post("/api/architecture/motherson-pipeline/trigger")
def trigger_motherson_pipeline(user: dict = Depends(get_current_user)):
    try:
        res = trigger_motherson_pipeline_etl(triggered_by=f"{user.get('full_name', 'Operator')} ({user.get('employee_id', 'EMP-01')})")
        write_audit_log(user.get("id"), "MOTHERSON_PIPELINE_TRIGGER", "Automated Pipeline", f"Triggered 10-min ETL: {res['records_processed']} records, {res['duration_ms']}ms")
        return res
    except Exception as exc:
        raise HTTPException(500, f"Motherson ETL trigger failed: {str(exc)[:300]}")


# ---------- Manual Vehicle Entry-to-Exit Ingestion API ----------
class VehicleManualEntryIn(BaseModel):
    vehicle_id: str = Field(min_length=2, max_length=30)
    carrier: str = Field(min_length=2, max_length=100)
    plant_id: str = "IN-KA-01"
    warehouse_id: str = "FG-WH-01"
    vehicle_type: str = "32FT_TRUCK"
    customer_order_id: str | None = None
    customer_name: str = "TVS Motor Hosur"
    product_id: str = "PRD-CAM-01"
    shipment_qty: int = 450
    driver_name: str = "Ramesh Kumar"
    driver_phone: str = "+91 98450 12345"
    rfid_tag: str | None = "FASTAG-KA04-8842"
    gate_pass_no: str | None = None
    tare_weight_kg: float = 11200.0
    gross_weight_kg: float = 28450.0
    dock_bay: str = "Bay 02"
    current_stage: str = "GATE_INWARD"
    priority: str = "P1"
    freight_cost_inr: float = 48500.0
    planned_tat_hrs: float = 48.0
    load_type: str | None = "FINISHED_GOODS"
    inspection_verdict: str | None = "APPROVED_WEIGHBRIDGE"
    hazard_class: str | None = None
    security_marshal: str | None = "Marshal K. Venkatesh (SEC-884)"
    seal_no: str | None = None
    checklist_status: str | None = "ALL_PASSED"
    notes: str | None = None


@app.post("/api/vehicles/manual-entry")
def create_manual_vehicle_entry(body: VehicleManualEntryIn, user: dict = Depends(get_current_user)):
    try:
        now_dt = datetime.now(timezone.utc)
        shipment_id = f"SHP-M-{int(now_dt.timestamp()) % 100000:05d}"
        order_id = body.customer_order_id or f"CO-M-{int(now_dt.timestamp()) % 100000:05d}"
        clean_vid = body.vehicle_id.replace('-', '').replace(' ', '')
        gate_pass = body.gate_pass_no or f"GP-{now_dt.strftime('%Y%m%d')}-{clean_vid[-4:] if len(clean_vid) >= 4 else '0001'}"

        planned_eta = now_dt + timedelta(hours=body.planned_tat_hrs)
        net_weight = max(body.gross_weight_kg - body.tare_weight_kg, 0.0)
        util_pct = min(round((net_weight / 18000.0) * 100.0, 1), 100.0) if net_weight > 0 else 85.0

        status_map = {
            "GATE_INWARD": "STAGING",
            "WEIGHBRIDGE_IN": "STAGING",
            "DOCK_STAGING": "STAGING",
            "QUALITY_SEAL": "STAGING",
            "WEIGHBRIDGE_OUT": "IN_TRANSIT",
            "GATE_OUT_DISPATCH": "IN_TRANSIT",
        }
        shipment_status = status_map.get(body.current_stage, "IN_TRANSIT")

        with engine.begin() as conn:
            # 1. Upsert customer order
            conn.execute(
                text("""
                INSERT INTO fact_customer_order (
                    customer_order_id, customer_id, product_id, order_date,
                    requested_delivery_date, confirmed_delivery_date, order_qty,
                    shipped_qty, unit_price_inr, order_status, priority, channel
                ) VALUES (
                    :order_id, :customer_id, :product_id, :now_dt,
                    :planned_eta, :planned_eta, :order_qty,
                    :shipped_qty, 1250, 'PROCESSING', :priority, 'MANUAL_ENTRY'
                ) ON CONFLICT (customer_order_id) DO UPDATE SET
                    shipped_qty = EXCLUDED.shipped_qty,
                    order_status = 'PROCESSING'
                """),
                {
                    "order_id": order_id,
                    "customer_id": "CUST-001",
                    "product_id": body.product_id,
                    "now_dt": now_dt,
                    "planned_eta": planned_eta,
                    "order_qty": body.shipment_qty,
                    "shipped_qty": body.shipment_qty,
                    "priority": body.priority,
                }
            )

            # 2. Insert shipment milestone
            conn.execute(
                text("""
                INSERT INTO fact_shipment_milestone (
                    shipment_id, customer_order_id, plant_id, warehouse_id, carrier,
                    vehicle_type, dispatch_date, planned_eta, actual_delivery_ts,
                    shipment_qty, freight_cost_inr, vehicle_utilization_pct,
                    pod_status, shipment_status
                ) VALUES (
                    :shipment_id, :order_id, :plant_id, :warehouse_id, :carrier,
                    :vehicle_type, :now_dt, :planned_eta, NULL,
                    :shipment_qty, :freight_cost_inr, :util_pct,
                    'PENDING', :shipment_status
                )
                """),
                {
                    "shipment_id": shipment_id,
                    "order_id": order_id,
                    "plant_id": body.plant_id,
                    "warehouse_id": body.warehouse_id,
                    "carrier": body.carrier,
                    "vehicle_type": body.vehicle_type,
                    "now_dt": now_dt,
                    "planned_eta": planned_eta,
                    "shipment_qty": body.shipment_qty,
                    "freight_cost_inr": int(body.freight_cost_inr),
                    "util_pct": util_pct,
                    "shipment_status": shipment_status,
                }
            )

            # 3. Insert dock allocation recommendation
            conn.execute(
                text("""
                INSERT INTO dock_allocation_approvals (
                    reference_id, recommended_facility, priority_tier, decision,
                    reviewed_by, notes, updated_at
                ) VALUES (
                    :order_id, :dock_bay, :priority, 'APPROVED',
                    :reviewer, :notes, :now_dt
                ) ON CONFLICT (reference_id) DO UPDATE SET
                    recommended_facility = EXCLUDED.recommended_facility,
                    decision = 'APPROVED',
                    updated_at = EXCLUDED.updated_at
                """),
                {
                    "order_id": order_id,
                    "dock_bay": body.dock_bay,
                    "priority": body.priority,
                    "reviewer": f"{user.get('full_name', 'Operator')} (Manual Inward)",
                    "notes": f"Vehicle {body.vehicle_id} ({body.carrier}) Tare: {body.tare_weight_kg}kg, Gross: {body.gross_weight_kg}kg. {body.notes or ''}",
                    "now_dt": now_dt,
                }
            )

        write_audit_log(
            user.get("id"),
            "MANUAL_VEHICLE_ENTRY",
            "Inward Logistics",
            f"Registered vehicle {body.vehicle_id} ({body.carrier}) for order {order_id}, Bay {body.dock_bay}, Stage {body.current_stage}"
        )
        invalidate_analytics_cache()

        return {
            "status": "SUCCESS",
            "message": f"Vehicle {body.vehicle_id} registered and entered into operations database successfully!",
            "shipment_id": shipment_id,
            "customer_order_id": order_id,
            "vehicle_id": body.vehicle_id,
            "gate_pass_no": gate_pass,
            "carrier": body.carrier,
            "plant_id": body.plant_id,
            "dock_bay": body.dock_bay,
            "load_type": body.load_type or "FINISHED_GOODS",
            "inspection_verdict": body.inspection_verdict or "APPROVED_WEIGHBRIDGE",
            "hazard_class": body.hazard_class,
            "security_marshal": body.security_marshal or "Marshal K. Venkatesh (SEC-884)",
            "tare_weight_kg": body.tare_weight_kg,
            "gross_weight_kg": body.gross_weight_kg,
            "net_weight_kg": net_weight,
            "vehicle_utilization_pct": util_pct,
            "current_stage": body.current_stage,
            "shipment_status": shipment_status,
            "planned_eta": planned_eta.isoformat(),
            "dispatch_date": now_dt.isoformat(),
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to record manual vehicle entry: {str(e)[:400]}")


