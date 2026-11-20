from sqlalchemy import text
from .db import rows, engine


def format_records(data):
    for r in data:
        for k, v in list(r.items()):
            if hasattr(v, "isoformat"):
                r[k] = v.isoformat()
            elif hasattr(v, "__float__") and type(v).__name__ == "Decimal":
                r[k] = float(v)
    return data


def format_record(r):
    if not r:
        return r
    for k, v in list(r.items()):
        if hasattr(v, "isoformat"):
            r[k] = v.isoformat()
        elif hasattr(v, "__float__") and type(v).__name__ == "Decimal":
            r[k] = float(v)
    return r


def dashboard(
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
):
    is_sqlite = engine.dialect.name == "sqlite"
    
    # Dynamic where clause construction for shipments
    where_parts = ["1=1"]
    params = {}
    
    if plant_id and plant_id.upper() != "ALL":
        norm_p = "IN-KA-01" if plant_id.upper() in ("KA-01", "IN-KA-01", "BANGALORE", "BENGALURU") else ("IN-TN-01" if plant_id.upper() in ("TN-01", "IN-TN-01", "CHENNAI") else plant_id)
        where_parts.append("plant_id = :plant_id")
        params["plant_id"] = norm_p
        
    if carrier and carrier.upper() != "ALL":
        where_parts.append("carrier = :carrier")
        params["carrier"] = carrier
        
    if vehicle_type and vehicle_type.upper() != "ALL":
        vt_norm = vehicle_type.upper().strip()
        if "32" in vt_norm or "10" in vt_norm or "MXL" in vt_norm or "TAURUS" in vt_norm:
            vt_val = "32FT_TRUCK"
        elif "20" in vt_norm or "6" in vt_norm or "CONTAINER" in vt_norm or "MEDIUM" in vt_norm:
            vt_val = "20FT_TRUCK"
        elif "AIR" in vt_norm or "CARGO" in vt_norm or "SHUTTLE" in vt_norm:
            vt_val = "AIR_CARGO"
        elif "VAN" in vt_norm or "DOST" in vt_norm or "MINI" in vt_norm or "LCV" in vt_norm:
            vt_val = "VAN"
        else:
            vt_val = vt_norm
        where_parts.append("vehicle_type = :vehicle_type")
        params["vehicle_type"] = vt_val
        
    if shipment_status and shipment_status.upper() != "ALL":
        where_parts.append("shipment_status = :shipment_status")
        params["shipment_status"] = shipment_status.upper()
        
    if year:
        where_parts.append("EXTRACT(YEAR FROM dispatch_date) = :year" if not is_sqlite else "CAST(strftime('%Y', dispatch_date) AS INTEGER) = :year")
        params["year"] = int(year)
        
    if month:
        where_parts.append("EXTRACT(MONTH FROM dispatch_date) = :month" if not is_sqlite else "CAST(strftime('%m', dispatch_date) AS INTEGER) = :month")
        params["month"] = int(month)
        
    if week:
        where_parts.append("EXTRACT(WEEK FROM dispatch_date) = :week" if not is_sqlite else "CAST(strftime('%W', dispatch_date) AS INTEGER) = :week")
        params["week"] = int(week)
        
    if day:
        where_parts.append("dispatch_date::date = CAST(:day AS DATE)" if not is_sqlite else "date(dispatch_date) = date(:day)")
        params["day"] = day
        
    if start_date:
        where_parts.append("dispatch_date::date >= CAST(:start_date AS DATE)" if not is_sqlite else "date(dispatch_date) >= date(:start_date)")
        params["start_date"] = start_date
        
    if end_date:
        where_parts.append("dispatch_date::date <= CAST(:end_date AS DATE)" if not is_sqlite else "date(dispatch_date) <= date(:end_date)")
        params["end_date"] = end_date
        
    if time_shift and time_shift.upper() != "ALL":
        shift_norm = time_shift.upper().replace("SHIFT_", "").strip()
        where_parts.append("dispatch_date::date IN (SELECT calendar_date::date FROM dim_shift_calendar WHERE shift_id = :time_shift)" if not is_sqlite else "date(dispatch_date) IN (SELECT date(calendar_date) FROM dim_shift_calendar WHERE shift_id = :time_shift)")
        params["time_shift"] = shift_norm

    if delay_risk and delay_risk.upper() != "ALL":
        dr = delay_risk.upper()
        if dr == "CRITICAL":
            if not is_sqlite:
                where_parts.append("(shipment_status = 'DELAYED' OR (actual_delivery_ts IS NOT NULL AND actual_delivery_ts > planned_eta + interval '6 hours'))")
            else:
                where_parts.append("(shipment_status = 'DELAYED' OR (actual_delivery_ts IS NOT NULL AND (julianday(actual_delivery_ts) - julianday(planned_eta)) * 24 > 6))")
        elif dr == "HIGH":
            if not is_sqlite:
                where_parts.append("(actual_delivery_ts IS NOT NULL AND actual_delivery_ts > planned_eta + interval '2 hours' AND actual_delivery_ts <= planned_eta + interval '6 hours')")
            else:
                where_parts.append("(actual_delivery_ts IS NOT NULL AND (julianday(actual_delivery_ts) - julianday(planned_eta)) * 24 > 2 AND (julianday(actual_delivery_ts) - julianday(planned_eta)) * 24 <= 6)")
        elif dr in ("NORMAL", "LOW"):
            if not is_sqlite:
                where_parts.append("(actual_delivery_ts IS NOT NULL AND actual_delivery_ts <= planned_eta + interval '2 hours')")
            else:
                where_parts.append("(actual_delivery_ts IS NOT NULL AND (julianday(actual_delivery_ts) - julianday(planned_eta)) * 24 <= 2)")

    if priority and priority.upper() != "ALL":
        prio = priority.upper()
        if prio == "P1":
            where_parts.append("(shipment_qty >= 1200 OR freight_cost_inr >= 35000)")
        elif prio == "P2":
            where_parts.append("(shipment_qty BETWEEN 600 AND 1199 OR freight_cost_inr BETWEEN 20000 AND 34999)")
        elif prio == "P3":
            where_parts.append("(shipment_qty < 600 OR freight_cost_inr < 20000)")

    where_sql = " AND ".join(where_parts)

    has_date_filter = bool(year or month or week or day or start_date or end_date or time_shift)

    if is_sqlite:
        kpi = rows(f"""
          SELECT COUNT(*) AS total_shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELIVERED') AS delivered,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            COUNT(*) FILTER (WHERE shipment_status='IN_TRANSIT') AS in_transit,
            COUNT(*) FILTER (WHERE pod_status IN ('PENDING','EXCEPTION')) AS pod_outstanding,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr,
            ROUND(AVG(vehicle_utilization_pct),1) AS avg_utilization_pct,
            ROUND(100.0 * COUNT(*) FILTER (WHERE actual_delivery_ts <= planned_eta) /
              NULLIF(COUNT(*) FILTER (WHERE actual_delivery_ts IS NOT NULL),0),1) AS on_time_pct,
            ROUND(COALESCE(SUM(freight_cost_inr),0) * 1.0 / NULLIF(SUM(shipment_qty),0),1) AS avg_freight_per_unit
          FROM fact_shipment_milestone
          WHERE {where_sql}
        """, params)[0]
        orders_kpi = rows("""
          SELECT COUNT(DISTINCT customer_order_id) AS total_orders,
            COALESCE(SUM(order_qty),0) AS total_order_qty,
            COALESCE(SUM(shipped_qty),0) AS total_shipped_qty,
            COALESCE(SUM(GREATEST(order_qty - shipped_qty,0)),0) AS outstanding_order_qty,
            ROUND(100.0 * COALESCE(SUM(shipped_qty),0) / NULLIF(SUM(order_qty),0), 1) AS fulfillment_pct,
            COUNT(*) FILTER (WHERE priority='HIGH' AND order_qty > shipped_qty) AS high_priority_open_orders
          FROM fact_customer_order
        """)[0]
        if has_date_filter:
            trend_where = where_sql
        else:
            trend_where = f"""{where_sql} AND date(dispatch_date) IN (
                SELECT DISTINCT date(dispatch_date)
                FROM fact_shipment_milestone
                WHERE {where_sql}
                ORDER BY date(dispatch_date) DESC
                LIMIT 30
            )"""
        trend = rows(f"""
          SELECT TO_CHAR(dispatch_date, 'DD Mon') AS day,
            COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed
          FROM fact_shipment_milestone
          WHERE {trend_where}
          GROUP BY date(dispatch_date) ORDER BY date(dispatch_date)
        """, params)
        carriers = rows(f"""
          SELECT carrier, COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            ROUND(100.0 * COUNT(*) FILTER (WHERE shipment_status='DELAYED') / NULLIF(COUNT(*),0), 1) AS delay_pct,
            ROUND(AVG(vehicle_utilization_pct),1) AS utilization_pct,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr,
            ROUND(COALESCE(SUM(freight_cost_inr),0) * 1.0 / NULLIF(SUM(shipment_qty),0), 1) AS avg_cost_per_unit
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY carrier ORDER BY shipments DESC
        """, params)
        status_dist = rows(f"""
          SELECT shipment_status, COUNT(*) AS count
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY shipment_status
        """, params)
        plant_analysis = rows(f"""
          SELECT plant_id, COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            ROUND(AVG(vehicle_utilization_pct),1) AS utilization_pct,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY plant_id ORDER BY shipments DESC
        """, params)
        latest = rows("SELECT MAX(date(snapshot_date)) AS snapshot_date FROM fact_inventory_daily_snapshot")[0]["snapshot_date"]
        inventory = rows("""
          SELECT COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available_qty,
            COALESCE(SUM(on_hand_qty),0) AS on_hand_qty,
            COALESCE(SUM(allocated_qty),0) AS allocated_qty,
            COALESCE(SUM(blocked_qty),0) AS blocked_qty,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold_qty,
            COUNT(DISTINCT material_id) AS materials
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date)=date(:snapshot_date) AND warehouse_id='FG-WH-01'
        """, {"snapshot_date": latest})[0]
        recent = rows(f"""
          SELECT shipment_id, customer_order_id, carrier, plant_id, vehicle_type,
            date(planned_eta) AS planned_eta, date(actual_delivery_ts) AS actual_delivery_date,
            shipment_qty, shipment_status, pod_status, freight_cost_inr
          FROM fact_shipment_milestone WHERE {where_sql} ORDER BY dispatch_date DESC LIMIT 8
        """, params)
        tat_delay_metrics = {
            "avg_tat_hrs": 48.0,
            "avg_planned_hrs": 42.0,
            "avg_delay_variance_hrs": 6.0,
            "exceeding_planned_count": 0,
            "total_evaluated": kpi.get("total_shipments", 0),
            "critical_risk": kpi.get("delayed", 0),
            "high_risk": 0,
            "medium_risk": 0,
            "low_risk": kpi.get("delivered", 0),
        }
    else:
        kpi = rows(f"""
          SELECT COUNT(*) AS total_shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELIVERED') AS delivered,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            COUNT(*) FILTER (WHERE shipment_status='IN_TRANSIT') AS in_transit,
            COUNT(*) FILTER (WHERE pod_status IN ('PENDING','EXCEPTION')) AS pod_outstanding,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr,
            ROUND(AVG(vehicle_utilization_pct)::numeric,1) AS avg_utilization_pct,
            ROUND(100.0 * COUNT(*) FILTER (WHERE actual_delivery_ts <= planned_eta) /
              NULLIF(COUNT(*) FILTER (WHERE actual_delivery_ts IS NOT NULL),0),1) AS on_time_pct,
            ROUND((COALESCE(SUM(freight_cost_inr),0) * 1.0 / NULLIF(SUM(shipment_qty),0))::numeric,1) AS avg_freight_per_unit
          FROM fact_shipment_milestone
          WHERE {where_sql}
        """, params)[0]
        orders_kpi = rows("""
          SELECT COUNT(DISTINCT customer_order_id) AS total_orders,
            COALESCE(SUM(order_qty),0) AS total_order_qty,
            COALESCE(SUM(shipped_qty),0) AS total_shipped_qty,
            COALESCE(SUM(GREATEST(order_qty - shipped_qty,0)),0) AS outstanding_order_qty,
            ROUND((100.0 * COALESCE(SUM(shipped_qty),0) / NULLIF(SUM(order_qty),0))::numeric, 1) AS fulfillment_pct,
            COUNT(*) FILTER (WHERE priority='HIGH' AND order_qty > shipped_qty) AS high_priority_open_orders
          FROM fact_customer_order
        """)[0]
        if has_date_filter:
            trend_where = where_sql
        else:
            trend_where = f"""{where_sql} AND dispatch_date::date IN (
                SELECT DISTINCT dispatch_date::date
                FROM fact_shipment_milestone
                WHERE {where_sql}
                ORDER BY dispatch_date::date DESC
                LIMIT 30
            )"""
        trend = rows(f"""
          SELECT TO_CHAR(dispatch_date::date,'DD Mon') AS day,
            COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed
          FROM fact_shipment_milestone
          WHERE {trend_where}
          GROUP BY dispatch_date::date ORDER BY dispatch_date::date
        """, params)
        carriers = rows(f"""
          SELECT carrier, COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            ROUND((100.0 * COUNT(*) FILTER (WHERE shipment_status='DELAYED') / NULLIF(COUNT(*),0))::numeric, 1) AS delay_pct,
            ROUND(AVG(vehicle_utilization_pct)::numeric,1) AS utilization_pct,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr,
            ROUND((COALESCE(SUM(freight_cost_inr),0) * 1.0 / NULLIF(SUM(shipment_qty),0))::numeric, 1) AS avg_cost_per_unit
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY carrier ORDER BY shipments DESC
        """, params)
        status_dist = rows(f"""
          SELECT shipment_status, COUNT(*) AS count
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY shipment_status
        """, params)
        plant_analysis = rows(f"""
          SELECT plant_id, COUNT(*) AS shipments,
            COUNT(*) FILTER (WHERE shipment_status='DELAYED') AS delayed,
            ROUND(AVG(vehicle_utilization_pct)::numeric,1) AS utilization_pct,
            COALESCE(SUM(freight_cost_inr),0) AS freight_cost_inr
          FROM fact_shipment_milestone WHERE {where_sql} GROUP BY plant_id ORDER BY shipments DESC
        """, params)
        latest = rows("SELECT MAX(snapshot_date::date) AS snapshot_date FROM fact_inventory_daily_snapshot")[0]["snapshot_date"]
        inventory = rows("""
          SELECT COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available_qty,
            COALESCE(SUM(on_hand_qty),0) AS on_hand_qty,
            COALESCE(SUM(allocated_qty),0) AS allocated_qty,
            COALESCE(SUM(blocked_qty),0) AS blocked_qty,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold_qty,
            COUNT(DISTINCT material_id) AS materials
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date=:snapshot_date AND warehouse_id='FG-WH-01'
        """, {"snapshot_date": latest})[0]
        recent = rows(f"""
          SELECT shipment_id, customer_order_id, carrier, plant_id, vehicle_type,
            planned_eta::date AS planned_eta, actual_delivery_ts::date AS actual_delivery_date,
            shipment_qty, shipment_status, pod_status, freight_cost_inr
          FROM fact_shipment_milestone WHERE {where_sql} ORDER BY dispatch_date DESC LIMIT 8
        """, params)
        
        # Synchronized TAT and Delay Risk metrics for the active filter slice
        tat_delay_res = rows(f"""
          SELECT 
            ROUND(AVG(EXTRACT(EPOCH FROM (actual_delivery_ts - dispatch_date))/3600.0)::numeric, 1) AS avg_tat_hrs,
            ROUND(AVG(EXTRACT(EPOCH FROM (planned_eta - dispatch_date))/3600.0)::numeric, 1) AS avg_planned_hrs,
            ROUND(AVG(GREATEST(EXTRACT(EPOCH FROM (actual_delivery_ts - planned_eta))/3600.0, 0))::numeric, 1) AS avg_delay_variance_hrs,
            COUNT(*) FILTER (WHERE actual_delivery_ts > planned_eta) AS exceeding_planned_count,
            COUNT(*) AS total_evaluated,
            COUNT(*) FILTER (WHERE (EXTRACT(EPOCH FROM (actual_delivery_ts - planned_eta))/3600.0) > 24.0 OR pod_status = 'EXCEPTION' OR shipment_status = 'DELAYED') AS critical_risk,
            COUNT(*) FILTER (WHERE (EXTRACT(EPOCH FROM (actual_delivery_ts - planned_eta))/3600.0) BETWEEN 6.0 AND 24.0) AS high_risk,
            COUNT(*) FILTER (WHERE (EXTRACT(EPOCH FROM (actual_delivery_ts - planned_eta))/3600.0) BETWEEN 0.1 AND 6.0) AS medium_risk,
            COUNT(*) FILTER (WHERE actual_delivery_ts <= planned_eta AND shipment_status != 'DELAYED') AS low_risk
          FROM fact_shipment_milestone
          WHERE {where_sql}
        """, params)
        tat_delay_metrics = tat_delay_res[0] if tat_delay_res else {}

    filtered_delay_sum = {
        "total_evaluated": int(tat_delay_metrics.get("total_evaluated") or 0),
        "at_risk_total": int((tat_delay_metrics.get("critical_risk") or 0) + (tat_delay_metrics.get("high_risk") or 0)),
        "CRITICAL": int(tat_delay_metrics.get("critical_risk") or 0),
        "HIGH": int(tat_delay_metrics.get("high_risk") or 0),
        "MEDIUM": int(tat_delay_metrics.get("medium_risk") or 0),
        "LOW": int(tat_delay_metrics.get("low_risk") or 0),
    }
    filtered_tat_sum = {
        "avg_tat_hrs": float(tat_delay_metrics.get("avg_tat_hrs") or 0),
        "avg_planned_hrs": float(tat_delay_metrics.get("avg_planned_hrs") or 0),
        "avg_delay_variance_hrs": float(tat_delay_metrics.get("avg_delay_variance_hrs") or 0),
        "exceeding_planned_count": int(tat_delay_metrics.get("exceeding_planned_count") or 0),
    }

    # Available filter options for front-end selectors
    month_names = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}
    filter_options = {
        "available_years": [2026],
        "available_months": [
            {"year": 2026, "month": 8, "label": "August 2026"},
            {"year": 2026, "month": 9, "label": "September 2026"},
            {"year": 2026, "month": 10, "label": "October 2026"},
            {"year": 2026, "month": 11, "label": "November 2026"},
        ],
        "available_weeks": [
            {"week": w, "label": f"Week {w} (2026)"} for w in range(31, 45)
        ],
        "available_plants": [
            {"id": "IN-KA-01", "name": "IN-KA-01 (Bengaluru Hub)"},
            {"id": "IN-TN-01", "name": "IN-TN-01 (Chennai Hub)"},
        ],
        "available_carriers": ["BlueDart", "DHL", "Delhivery", "Safexpress"],
        "available_vehicle_types": [
            {"id": "32FT_TRUCK", "label": "10-Wheel Heavy Lorry (Taurus 25T / 32FT Container)"},
            {"id": "20FT_TRUCK", "label": "6-Wheel Medium Lorry (Tata 1109 / 20FT Container)"},
            {"id": "40FT_TRAILER", "label": "14-Wheel Multi-Axle (40FT Trailer / 35T)"},
            {"id": "16FT_TRUCK", "label": "4-Wheel Intermediate Truck (16FT / 7T)"},
            {"id": "VAN", "label": "Light Commercial Vehicle (Dost / 2.5T)"},
        ],
        "available_risk_tiers": [
            {"id": "CRITICAL", "label": "Critical Delay Risk (> 6h Breach)"},
            {"id": "HIGH", "label": "High Delay Risk (> 2h Slippage)"},
            {"id": "NORMAL", "label": "Normal / On Schedule (< 2h)"},
        ],
        "available_priorities": [
            {"id": "P1", "label": "P1 - Urgent / Production Line Feed"},
            {"id": "P2", "label": "P2 - Standard Scheduled Delivery"},
            {"id": "P3", "label": "P3 - Flexible Buffer / Backlog"},
        ],
        "available_statuses": [
            {"id": "DELAYED", "label": "DELAYED Exception"},
            {"id": "IN_TRANSIT", "label": "IN_TRANSIT Active / Inside Plant"},
            {"id": "DELIVERED", "label": "DELIVERED Closed"},
        ],
        "available_shifts": [
            {"id": "A", "label": "Shift A (Morning 06:00 - 14:00)"},
            {"id": "B", "label": "Shift B (Evening 14:00 - 22:00)"},
            {"id": "C", "label": "Shift C (Night 22:00 - 06:00)"},
        ],
        "active_filters": {
            "year": year,
            "month": month,
            "week": week,
            "day": day,
            "time_shift": time_shift,
            "start_date": start_date,
            "end_date": end_date,
            "plant_id": plant_id,
            "carrier": carrier,
            "vehicle_type": vehicle_type,
            "shipment_status": shipment_status,
            "delay_risk": delay_risk,
            "priority": priority,
        }
    }

    # Merge shipment and order kpis
    merged_kpis = {**format_record(kpi), **format_record(orders_kpi)}
    return {
        "kpis": merged_kpis,
        "trend": format_records(trend),
        "carriers": format_records(carriers),
        "status_distribution": format_records(status_dist),
        "plant_analysis": format_records(plant_analysis),
        "inventory": format_record(inventory),
        "inventory_snapshot_date": latest.isoformat() if hasattr(latest, "isoformat") else str(latest),
        "recent_shipments": format_records(recent),
        "tat_summary": filtered_tat_sum,
        "delay_summary": filtered_delay_sum,
        "filter_options": filter_options,
    }


def shipment_trends():
    d = dashboard()
    return {
        "trend": d["trend"],
        "status_distribution": d["status_distribution"],
        "plant_analysis": d["plant_analysis"]
    }


def carrier_performance():
    d = dashboard()
    return {"carriers": d["carriers"]}


def shipments(status: str | None = None, carrier: str | None = None, plant: str | None = None, search: str | None = None, limit: int = 100):
    is_sqlite = engine.dialect.name == "sqlite"
    date_fn = "date" if is_sqlite else "::date"
    if is_sqlite:
        sql = """SELECT shipment_id, customer_order_id, carrier, vehicle_type, plant_id, warehouse_id,
          date(dispatch_date) AS dispatch_date, date(planned_eta) AS planned_eta,
          date(actual_delivery_ts) AS actual_delivery_date, shipment_qty, freight_cost_inr,
          vehicle_utilization_pct, pod_status, shipment_status
          FROM fact_shipment_milestone WHERE 1=1"""
    else:
        sql = """SELECT shipment_id, customer_order_id, carrier, vehicle_type, plant_id, warehouse_id,
          dispatch_date::date AS dispatch_date, planned_eta::date AS planned_eta,
          actual_delivery_ts::date AS actual_delivery_date, shipment_qty, freight_cost_inr,
          vehicle_utilization_pct, pod_status, shipment_status
          FROM fact_shipment_milestone WHERE 1=1"""
    params = {"limit": max(1, min(limit, 250))}
    if status and status.upper() != "ALL":
        sql += " AND shipment_status=:status"; params["status"] = status.upper()
    if carrier and carrier.upper() != "ALL":
        sql += " AND carrier=:carrier"; params["carrier"] = carrier
    if plant and plant.upper() != "ALL":
        sql += " AND plant_id=:plant"; params["plant"] = plant
    if search:
        op = "LIKE" if is_sqlite else "ILIKE"
        sql += f" AND (shipment_id {op} :search OR customer_order_id {op} :search OR carrier {op} :search)"
        params["search"] = f"%{search}%"
    sql += " ORDER BY dispatch_date DESC LIMIT :limit"
    return format_records(rows(sql, params))


def shipment_detail(shipment_id: str):
    is_sqlite = engine.dialect.name == "sqlite"
    if is_sqlite:
        sql = """SELECT s.*,
            date(s.dispatch_date) AS dispatch_date_fmt,
            date(s.planned_eta) AS planned_eta_fmt,
            date(s.actual_delivery_ts) AS actual_delivery_fmt,
            o.customer_id, o.product_id, o.order_qty, o.shipped_qty,
            GREATEST(o.order_qty - o.shipped_qty, 0) AS open_qty,
            o.priority, o.order_status, o.channel
          FROM fact_shipment_milestone s
          LEFT JOIN fact_customer_order o ON s.customer_order_id = o.customer_order_id
          WHERE s.shipment_id = :id"""
    else:
        sql = """SELECT s.*,
            s.dispatch_date::date AS dispatch_date_fmt,
            s.planned_eta::date AS planned_eta_fmt,
            s.actual_delivery_ts::date AS actual_delivery_fmt,
            o.customer_id, o.product_id, o.order_qty, o.shipped_qty,
            GREATEST(o.order_qty - o.shipped_qty, 0) AS open_qty,
            o.priority, o.order_status, o.channel
          FROM fact_shipment_milestone s
          LEFT JOIN fact_customer_order o ON s.customer_order_id = o.customer_order_id
          WHERE s.shipment_id = :id"""
    res = rows(sql, {"id": shipment_id})
    if not res:
        return None
    r = format_record(res[0])
    # Build timeline stages
    timeline = [
        {"stage": "Dispatched", "date": r.get("dispatch_date_fmt"), "status": "COMPLETED"},
        {"stage": "Planned ETA", "date": r.get("planned_eta_fmt"), "status": "COMPLETED" if r.get("shipment_status") == "DELIVERED" else "PENDING"},
        {"stage": "Delivery Outcome", "date": r.get("actual_delivery_fmt") or "Pending",
         "status": "COMPLETED" if r.get("actual_delivery_fmt") else "PENDING",
         "outcome": r.get("shipment_status")},
        {"stage": "Proof of Delivery", "status": r.get("pod_status")}
    ]
    r["timeline"] = timeline
    return r


def orders(priority: str | None = None, status: str | None = None, search: str | None = None, limit: int = 100):
    is_sqlite = engine.dialect.name == "sqlite"
    if is_sqlite:
        sql = """SELECT customer_order_id, customer_id, product_id, date(order_date) AS order_date,
          date(requested_delivery_date) AS requested_delivery_date,
          date(confirmed_delivery_date) AS confirmed_delivery_date,
          order_qty, shipped_qty,
          GREATEST(order_qty-shipped_qty,0) AS open_qty, order_status, priority, channel, unit_price_inr
          FROM fact_customer_order WHERE 1=1"""
    else:
        sql = """SELECT customer_order_id, customer_id, product_id, order_date::date AS order_date,
          requested_delivery_date::date AS requested_delivery_date,
          confirmed_delivery_date::date AS confirmed_delivery_date,
          order_qty, shipped_qty,
          GREATEST(order_qty-shipped_qty,0) AS open_qty, order_status, priority, channel, unit_price_inr
          FROM fact_customer_order WHERE 1=1"""
    params = {"limit": max(1, min(limit, 250))}
    if priority and priority.upper() != "ALL":
        sql += " AND priority=:priority"; params["priority"] = priority.upper()
    if status and status.upper() != "ALL":
        sql += " AND order_status=:status"; params["status"] = status.upper()
    if search:
        op = "LIKE" if is_sqlite else "ILIKE"
        sql += f" AND (customer_order_id {op} :search OR customer_id {op} :search OR product_id {op} :search)"
        params["search"] = f"%{search}%"
    sql += " ORDER BY requested_delivery_date ASC LIMIT :limit"
    return format_records(rows(sql, params))


def inventory(plant_id: str | None = None, warehouse_id: str | None = None):
    is_sqlite = engine.dialect.name == "sqlite"
    if is_sqlite:
        latest = rows("SELECT MAX(date(snapshot_date)) AS d FROM fact_inventory_daily_snapshot")[0]["d"]
        summary = rows("""
          SELECT COALESCE(SUM(on_hand_qty),0) AS total_on_hand,
            COALESCE(SUM(allocated_qty),0) AS total_allocated,
            COALESCE(SUM(blocked_qty),0) AS total_blocked,
            COALESCE(SUM(quality_hold_qty),0) AS total_quality_hold,
            COALESCE(SUM(in_transit_qty),0) AS total_in_transit,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COUNT(DISTINCT material_id) AS total_materials,
            COUNT(*) FILTER (WHERE on_hand_qty < safety_stock_qty) AS below_safety_count
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date) = date(:d)
        """, {"d": latest})[0]
        plants = rows("""
          SELECT plant_id,
            COALESCE(SUM(on_hand_qty),0) AS on_hand,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COALESCE(SUM(blocked_qty),0) AS blocked,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date) = date(:d)
          GROUP BY plant_id
        """, {"d": latest})
        warehouses = rows("""
          SELECT warehouse_id, plant_id,
            COALESCE(SUM(on_hand_qty),0) AS on_hand,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COALESCE(SUM(blocked_qty),0) AS blocked,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date) = date(:d)
          GROUP BY warehouse_id, plant_id
          ORDER BY on_hand DESC
        """, {"d": latest})
        status_dist = rows("""
          SELECT inventory_status, COUNT(*) AS lots, SUM(on_hand_qty) AS qty
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date) = date(:d)
          GROUP BY inventory_status
        """, {"d": latest})
        below_safety = rows("""
          SELECT plant_id, warehouse_id, material_id, lot_id, on_hand_qty, safety_stock_qty,
            (safety_stock_qty - on_hand_qty) AS deficit,
            GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0) AS net_available,
            inventory_status
          FROM fact_inventory_daily_snapshot
          WHERE date(snapshot_date) = date(:d) AND on_hand_qty < safety_stock_qty
          ORDER BY (safety_stock_qty - on_hand_qty) DESC LIMIT 25
        """, {"d": latest})
    else:
        latest = rows("SELECT MAX(snapshot_date::date) AS d FROM fact_inventory_daily_snapshot")[0]["d"]
        summary = rows("""
          SELECT COALESCE(SUM(on_hand_qty),0) AS total_on_hand,
            COALESCE(SUM(allocated_qty),0) AS total_allocated,
            COALESCE(SUM(blocked_qty),0) AS total_blocked,
            COALESCE(SUM(quality_hold_qty),0) AS total_quality_hold,
            COALESCE(SUM(in_transit_qty),0) AS total_in_transit,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COUNT(DISTINCT material_id) AS total_materials,
            COUNT(*) FILTER (WHERE on_hand_qty < safety_stock_qty) AS below_safety_count
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date = :d
        """, {"d": latest})[0]
        plants = rows("""
          SELECT plant_id,
            COALESCE(SUM(on_hand_qty),0) AS on_hand,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COALESCE(SUM(blocked_qty),0) AS blocked,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date = :d
          GROUP BY plant_id
        """, {"d": latest})
        warehouses = rows("""
          SELECT warehouse_id, plant_id,
            COALESCE(SUM(on_hand_qty),0) AS on_hand,
            COALESCE(SUM(GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0)),0) AS net_available,
            COALESCE(SUM(blocked_qty),0) AS blocked,
            COALESCE(SUM(quality_hold_qty),0) AS quality_hold
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date = :d
          GROUP BY warehouse_id, plant_id
          ORDER BY on_hand DESC
        """, {"d": latest})
        status_dist = rows("""
          SELECT inventory_status, COUNT(*) AS lots, SUM(on_hand_qty) AS qty
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date = :d
          GROUP BY inventory_status
        """, {"d": latest})
        below_safety = rows("""
          SELECT plant_id, warehouse_id, material_id, lot_id, on_hand_qty, safety_stock_qty,
            (safety_stock_qty - on_hand_qty) AS deficit,
            GREATEST(on_hand_qty-allocated_qty-blocked_qty-quality_hold_qty,0) AS net_available,
            inventory_status
          FROM fact_inventory_daily_snapshot
          WHERE snapshot_date::date = :d AND on_hand_qty < safety_stock_qty
          ORDER BY (safety_stock_qty - on_hand_qty) DESC LIMIT 25
        """, {"d": latest})

    return {
        "snapshot_date": latest.isoformat() if hasattr(latest, "isoformat") else str(latest),
        "summary": format_record(summary),
        "plants": format_records(plants),
        "warehouses": format_records(warehouses),
        "status_distribution": format_records(status_dist),
        "below_safety_stock": format_records(below_safety)
    }
