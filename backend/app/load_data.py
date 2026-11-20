import argparse
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine, text
from .config import settings

FILES = {
    "fact_shipment_milestone": "fact_shipment_milestone.csv",
    "fact_customer_order": "fact_customer_order.csv",
    "fact_inventory_daily_snapshot": "fact_inventory_daily_snapshot.csv",
}
DATE_COLUMNS = {
    "fact_shipment_milestone": ["dispatch_date", "planned_eta", "actual_delivery_ts"],
    "fact_customer_order": ["order_date", "requested_delivery_date", "confirmed_delivery_date"],
    "fact_inventory_daily_snapshot": ["snapshot_date", "expiry_date"],
}

def main():
    parser = argparse.ArgumentParser(description="Load the Logistics Agent CSV files into Neon PostgreSQL")
    parser.add_argument("--data-dir", default="../data")
    args = parser.parse_args()
    data_dir = Path(args.data_dir).resolve()
    engine = create_engine(settings.sqlalchemy_url, pool_pre_ping=True)
    with engine.begin() as conn:
        conn.execute(text("SELECT 1"))
    print(f"Connected to database ({engine.dialect.name}). Loading source files...")
    for table, filename in FILES.items():
        path = data_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing input file: {path}")
        df = pd.read_csv(path)
        for col in DATE_COLUMNS[table]:
            df[col] = pd.to_datetime(df[col], errors="coerce")
        method = "multi" if engine.dialect.name == "postgresql" else None
        df.to_sql(table, engine, if_exists="replace", index=False, method=method, chunksize=500)
        with engine.connect() as conn:
            count = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar_one()
        print(f"  ✓ {table}: {count:,} rows")
    print("\nData load complete. Chat-history tables are separate and are not replaced.")

if __name__ == "__main__":
    main()
