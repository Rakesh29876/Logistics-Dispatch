import zipfile
import io
import logging
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine, text, inspect
from .config import settings

logger = logging.getLogger("data_ingestion")

SCHEMA_NAME = "manufacturing_logistics"
ADVISORY_LOCK_ID = 120012

DATASET_CONFIG = {
    "fact_shipment_milestone": {
        "file": "data/fact_shipment_milestone.csv",
        "primary_key": "shipment_id",
        "date_cols": ["dispatch_date", "planned_eta", "actual_delivery_ts"],
        "indexes": ["customer_order_id", "carrier", "plant_id", "shipment_status", "dispatch_date"]
    },
    "fact_customer_order": {
        "file": "data/fact_customer_order.csv",
        "primary_key": "customer_order_id",
        "date_cols": ["order_date", "requested_delivery_date", "confirmed_delivery_date"],
        "indexes": ["customer_id", "product_id", "order_status", "priority", "requested_delivery_date"]
    },
    "fact_inventory_daily_snapshot": {
        "file": "data/fact_inventory_daily_snapshot.csv",
        "primary_key": None,
        "date_cols": ["snapshot_date", "expiry_date"],
        "indexes": ["snapshot_date", "plant_id", "warehouse_id", "material_id", "inventory_status"]
    },
    "dim_customer": {
        "file": "data/dim_customer.csv",
        "primary_key": "customer_id",
        "date_cols": [],
        "indexes": ["preferred_carrier", "service_level"]
    },
    "dim_plant": {
        "file": "data/dim_plant.csv",
        "primary_key": "plant_id",
        "date_cols": [],
        "indexes": ["country", "state"]
    },
    "dim_product": {
        "file": "data/dim_product.csv",
        "primary_key": "product_id",
        "date_cols": ["active_from", "active_to"],
        "indexes": ["product_family"]
    },
    "dim_material": {
        "file": "data/dim_material.csv",
        "primary_key": "material_id",
        "date_cols": [],
        "indexes": ["material_category"]
    },
    "dim_supplier": {
        "file": "data/dim_supplier.csv",
        "primary_key": "supplier_id",
        "date_cols": [],
        "indexes": ["category", "country"]
    },
    "dim_defect_code": {
        "file": "data/dim_defect_code.csv",
        "primary_key": "defect_code",
        "date_cols": [],
        "indexes": ["defect_category", "severity"]
    },
    "dim_product_routing": {
        "file": "data/dim_product_routing.csv",
        "primary_key": None,
        "date_cols": [],
        "indexes": ["routing_id", "product_id", "station_id"]
    },
    "dim_shift_calendar": {
        "file": "data/dim_shift_calendar.csv",
        "primary_key": None,
        "date_cols": ["calendar_date", "shift_start", "shift_end"],
        "indexes": ["calendar_date", "shift_id"]
    },
    "dim_station": {
        "file": "data/dim_station.csv",
        "primary_key": "station_id",
        "date_cols": [],
        "indexes": ["process_area"]
    },
    "fact_purchase_order_receipt": {
        "file": "data/fact_purchase_order_receipt.csv",
        "primary_key": None,
        "date_cols": ["po_date", "promised_date", "receipt_date"],
        "indexes": ["po_id", "supplier_id", "material_id", "plant_id"]
    },
    "fact_production_order": {
        "file": "data/fact_production_order.csv",
        "primary_key": "production_order_id",
        "date_cols": ["planned_start", "planned_finish", "due_date"],
        "indexes": ["customer_order_id", "plant_id", "product_id", "order_status"]
    },
    "fact_bom_component": {
        "file": "data/fact_bom_component.csv",
        "primary_key": None,
        "date_cols": ["effective_from", "effective_to"],
        "indexes": ["bom_id", "product_id", "material_id"]
    },
    "fact_quality_inspection": {
        "file": "data/fact_quality_inspection.csv",
        "primary_key": "inspection_id",
        "date_cols": ["inspection_ts"],
        "indexes": ["production_order_id", "plant_id", "product_id", "result", "disposition"]
    },
    "fact_ncr_capa": {
        "file": "data/fact_ncr_capa.csv",
        "primary_key": "ncr_id",
        "date_cols": ["opened_ts", "capa_due_date"],
        "indexes": ["inspection_id", "defect_code", "capa_status"]
    },
}


def find_data_source():
    zip_path = Path(settings.data_zip_path)
    if zip_path.exists():
        return ("zip", zip_path)
    for parent in [Path(".."), Path("../.."), Path("e:/Documents")]:
        cand = (parent / "data.zip").resolve()
        if cand.exists():
            return ("zip", cand)
    local_dir = Path(__file__).resolve().parent.parent.parent / "data"
    if local_dir.exists() and (local_dir / "fact_shipment_milestone.csv").exists():
        return ("dir", local_dir)
    return (None, None)


def init_metadata_table(engine):
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA_NAME}"'))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.ingestion_metadata (
                    id SERIAL PRIMARY KEY,
                    table_name VARCHAR(100) NOT NULL UNIQUE,
                    source_file VARCHAR(200) NOT NULL,
                    source_rows INT NOT NULL,
                    loaded_rows INT NOT NULL,
                    column_count INT NOT NULL,
                    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) NOT NULL
                );
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ingestion_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name VARCHAR(100) NOT NULL UNIQUE,
                    source_file VARCHAR(200) NOT NULL,
                    source_rows INT NOT NULL,
                    loaded_rows INT NOT NULL,
                    column_count INT NOT NULL,
                    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) NOT NULL
                );
            """))


def _validate_existing_data(engine) -> bool:
    """Check if all datasets exist in the target schema and match verified metadata."""
    inspector = inspect(engine)
    target_schema = SCHEMA_NAME if engine.dialect.name == "postgresql" else None
    existing_tables = set(inspector.get_table_names(schema=target_schema))
    required_tables = set(DATASET_CONFIG.keys())
    if not required_tables.issubset(existing_tables):
        return False
    try:
        with engine.connect() as conn:
            meta_rows = conn.execute(text(
                "SELECT table_name, source_rows, loaded_rows, status FROM ingestion_metadata"
            )).fetchall()
            meta = {r[0]: (r[1], r[2], r[3]) for r in meta_rows}
            for tbl in required_tables:
                if tbl not in meta or meta[tbl][2] != "SUCCESS" or meta[tbl][0] != meta[tbl][1]:
                    return False
                qualified = f'"{SCHEMA_NAME}"."{tbl}"' if engine.dialect.name == "postgresql" else f'"{tbl}"'
                actual_count = conn.execute(text(f"SELECT COUNT(*) FROM {qualified}")).scalar_one()
                if actual_count != meta[tbl][0]:
                    return False
        return True
    except Exception:
        return False


def _load_df_to_staging_pg(engine, df: pd.DataFrame, stg_tbl: str):
    """Create staging table structure cleanly and stream CSV via psycopg COPY."""
    df.head(0).to_sql(stg_tbl, engine, schema=SCHEMA_NAME, if_exists="replace", index=False)
    buf = io.StringIO()
    df.to_csv(buf, index=False, header=False, na_rep="\\N")
    buf.seek(0)
    raw_conn = engine.raw_connection()
    try:
        cur = raw_conn.cursor()
        copy_sql = f'COPY "{SCHEMA_NAME}"."{stg_tbl}" FROM STDIN WITH (FORMAT csv, NULL \'\\N\')'
        with cur.copy(copy_sql) as copy:
            while chunk := buf.read(65536):
                copy.write(chunk)
        raw_conn.commit()
    except Exception:
        raw_conn.rollback()
        raise
    finally:
        raw_conn.close()


def ingest_all(force: bool = False):
    source_type, source_path = find_data_source()
    if not source_type:
        raise FileNotFoundError(f"Could not locate data.zip or data directory at {settings.data_zip_path}")

    engine_url = settings.unpooled_sqlalchemy_url if settings.unpooled_sqlalchemy_url.startswith("postgresql") else settings.sqlalchemy_url
    engine = create_engine(engine_url, pool_pre_ping=True)
    init_metadata_table(engine)

    if not force and _validate_existing_data(engine):
        print(f"All {len(DATASET_CONFIG)} logistics tables are already loaded and verified in {engine.dialect.name}.")
        return get_ingestion_summary(engine)

    print(f"Loading {len(DATASET_CONFIG)} logistics datasets from {source_type}: {source_path} into {engine.dialect.name}...")
    zf = zipfile.ZipFile(source_path) if source_type == "zip" else None

    lock_conn = None
    if engine.dialect.name == "postgresql":
        lock_conn = engine.connect()
        lock_conn.execute(text(f"SELECT pg_advisory_lock({ADVISORY_LOCK_ID})"))

    try:
        for tbl, conf in DATASET_CONFIG.items():
            rel_file = conf["file"]
            if source_type == "zip":
                target_name = None
                for n in zf.namelist():
                    if n.lower() == rel_file.lower() or n.lower().endswith("/" + Path(rel_file).name.lower()):
                        target_name = n
                        break
                if not target_name:
                    raise FileNotFoundError(f"Required dataset missing from archive: {rel_file}")
                df = pd.read_csv(io.BytesIO(zf.read(target_name)))
            else:
                path = source_path / Path(rel_file).name
                if not path.exists():
                    raise FileNotFoundError(f"Required dataset missing on disk: {path}")
                df = pd.read_csv(path)

            if conf["primary_key"] and conf["primary_key"] in df.columns:
                df = df.drop_duplicates(subset=[conf["primary_key"]], keep="first")

            source_count = len(df)
            col_count = len(df.columns)

            for col in conf["date_cols"]:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors="coerce")

            if engine.dialect.name == "postgresql":
                stg_tbl = f"__stg_{tbl}"
                _load_df_to_staging_pg(engine, df, stg_tbl)

                with engine.begin() as conn:
                    staged_count = conn.execute(text(f'SELECT COUNT(*) FROM "{SCHEMA_NAME}"."{stg_tbl}"')).scalar_one()
                    if staged_count != source_count:
                        raise RuntimeError(f"Row count mismatch on {tbl}: source={source_count}, staged={staged_count}")

                    # Remove any legacy base table or view in public so clean view can point to schema
                    relkind = conn.execute(text("""
                        SELECT c.relkind FROM pg_class c
                        JOIN pg_namespace n ON n.oid = c.relnamespace
                        WHERE n.nspname = 'public' AND c.relname = :tbl
                    """), {"tbl": tbl}).scalar_one_or_none()
                    if relkind == "r":
                        conn.execute(text(f'DROP TABLE IF EXISTS public."{tbl}" CASCADE'))
                    elif relkind == "v":
                        conn.execute(text(f'DROP VIEW IF EXISTS public."{tbl}" CASCADE'))

                    conn.execute(text(f'DROP TABLE IF EXISTS "{SCHEMA_NAME}"."{tbl}" CASCADE'))
                    conn.execute(text(f'ALTER TABLE "{SCHEMA_NAME}"."{stg_tbl}" RENAME TO "{tbl}"'))

                    if conf["primary_key"] and conf["primary_key"] in df.columns:
                        conn.execute(text(f'ALTER TABLE "{SCHEMA_NAME}"."{tbl}" ADD PRIMARY KEY ("{conf["primary_key"]}")'))
                    for idx_col in conf["indexes"]:
                        if idx_col in df.columns:
                            conn.execute(text(f'CREATE INDEX IF NOT EXISTS "idx_{tbl}_{idx_col}" ON "{SCHEMA_NAME}"."{tbl}" ("{idx_col}")'))

                    conn.execute(text(f'CREATE OR REPLACE VIEW public."{tbl}" AS SELECT * FROM "{SCHEMA_NAME}"."{tbl}"'))
                    loaded_count = conn.execute(text(f'SELECT COUNT(*) FROM "{SCHEMA_NAME}"."{tbl}"')).scalar_one()
            else:
                df.to_sql(tbl, engine, if_exists="replace", index=False, chunksize=500)
                with engine.connect() as conn:
                    loaded_count = conn.execute(text(f'SELECT COUNT(*) FROM "{tbl}"')).scalar_one()

            now = datetime.now(timezone.utc)
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO ingestion_metadata (table_name, source_file, source_rows, loaded_rows, column_count, ingested_at, status)
                    VALUES (:tbl, :src, :s_cnt, :l_cnt, :c_cnt, :ts, 'SUCCESS')
                    ON CONFLICT (table_name) DO UPDATE SET
                        source_file = EXCLUDED.source_file,
                        source_rows = EXCLUDED.source_rows,
                        loaded_rows = EXCLUDED.loaded_rows,
                        column_count = EXCLUDED.column_count,
                        ingested_at = EXCLUDED.ingested_at,
                        status = 'SUCCESS'
                """ if engine.dialect.name == "postgresql" else """
                    INSERT INTO ingestion_metadata (table_name, source_file, source_rows, loaded_rows, column_count, ingested_at, status)
                    VALUES (:tbl, :src, :s_cnt, :l_cnt, :c_cnt, :ts, 'SUCCESS')
                    ON CONFLICT (table_name) DO UPDATE SET
                        source_file = excluded.source_file,
                        source_rows = excluded.source_rows,
                        loaded_rows = excluded.loaded_rows,
                        column_count = excluded.column_count,
                        ingested_at = excluded.ingested_at,
                        status = 'SUCCESS'
                """), {
                    "tbl": tbl, "src": rel_file, "s_cnt": source_count,
                    "l_cnt": loaded_count, "c_cnt": col_count, "ts": now
                })

            print(f"  [OK] {SCHEMA_NAME}.{tbl:30}: {loaded_count:,} / {source_count:,} rows loaded ({col_count} columns)")
    finally:
        if zf:
            zf.close()
        if lock_conn is not None:
            try:
                lock_conn.execute(text(f"SELECT pg_advisory_unlock({ADVISORY_LOCK_ID})"))
            finally:
                lock_conn.close()

    print("\nData ingestion successfully completed and verified.")
    return get_ingestion_summary(engine)


def get_ingestion_summary(engine=None):
    if not engine:
        engine = create_engine(settings.sqlalchemy_url, pool_pre_ping=True)
    with engine.connect() as conn:
        try:
            res = conn.execute(text(
                "SELECT table_name, source_file, source_rows, loaded_rows, column_count, ingested_at, status "
                "FROM ingestion_metadata ORDER BY table_name"
            )).fetchall()
            items = [dict(r._mapping) for r in res]
            for it in items:
                if hasattr(it.get("ingested_at"), "isoformat"):
                    it["ingested_at"] = it["ingested_at"].isoformat()

            latest_snap = None
            try:
                snap_q = (
                    f'SELECT MAX(snapshot_date::date) FROM "{SCHEMA_NAME}"."fact_inventory_daily_snapshot"'
                    if engine.dialect.name == "postgresql"
                    else "SELECT MAX(date(snapshot_date)) FROM fact_inventory_daily_snapshot"
                )
                latest_snap = conn.execute(text(snap_q)).scalar_one()
                if hasattr(latest_snap, "isoformat"):
                    latest_snap = latest_snap.isoformat()
            except Exception:
                pass

            total_rows = sum(int(it.get("loaded_rows") or 0) for it in items)
            latest_dispatch = None
            try:
                disp_q = (
                    f'SELECT MAX(dispatch_date::date) FROM "{SCHEMA_NAME}"."fact_shipment_milestone"'
                    if engine.dialect.name == "postgresql"
                    else "SELECT MAX(date(dispatch_date)) FROM fact_shipment_milestone"
                )
                latest_dispatch = conn.execute(text(disp_q)).scalar_one()
                if hasattr(latest_dispatch, "isoformat"):
                    latest_dispatch = latest_dispatch.isoformat()
            except Exception:
                pass

            missing_vms_fields = [
                {
                    "use_case": "Use Case 1 & 2 (Vehicle Gate / Yard Tracking)",
                    "missing_fields": "vehicle_number (registration plate), gate_entry_ts, security_check_ts, approval_ts, weighbridge_in_ts, weighbridge_out_ts, yard_arrival_ts, gate_exit_ts",
                    "impact": "Internal plant gate-to-gate turnaround and yard/weighbridge waiting times cannot be measured directly.",
                    "supported_alternative": "End-to-end outbound dispatch transit turnaround (dispatch_date -> planned_eta -> actual_delivery_ts), order preparation (order_date -> dispatch_date), inbound PO receipt lead time, and production cycle duration."
                },
                {
                    "use_case": "Use Case 2 (Shift-wise TAT Breakdown)",
                    "missing_fields": "Hour/minute timestamp precision on fact_shipment_milestone (all dispatch_date values are logged at 00:00:00)",
                    "impact": "Although dim_shift_calendar defines Shifts A, B, and C, vehicle dispatches cannot be assigned to a specific shift without sub-day timestamps.",
                    "supported_alternative": "Daily, carrier, vehicle-type, and plant-level TAT trends and stage duration comparisons."
                },
                {
                    "use_case": "Use Case 4 (Physical Loading Bay & Dock Allocation)",
                    "missing_fields": "dock_id, dock_type, dock_capacity, dock_status (available/occupied), dock_in_ts, dock_out_ts",
                    "impact": "Physical bay-level occupancy and individual loading bay compatibility checks are unavailable.",
                    "supported_alternative": "Plant & warehouse staging readiness (FG-WH-01 at IN-KA-01 / IN-TN-01), vehicle utilization %, order priority queue, and human-in-the-loop staging approval workflow."
                }
            ]

            return {
                "status": "connected",
                "database_dialect": engine.dialect.name,
                "database_host": settings.masked_database_host,
                "schema": SCHEMA_NAME if engine.dialect.name == "postgresql" else "main",
                "latest_snapshot_date": str(latest_snap) if latest_snap else None,
                "latest_dispatch_date": str(latest_dispatch) if latest_dispatch else None,
                "total_tables": len(items),
                "total_rows": total_rows,
                "tables": items,
                "missing_fields": missing_vms_fields
            }
        except Exception as e:
            return {"status": "error", "detail": str(e)[:200]}


if __name__ == "__main__":
    ingest_all(force=True)
