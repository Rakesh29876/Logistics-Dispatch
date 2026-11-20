# INTELLIGENT LOGISTICS OPERATIONS AGENT (Agent 12 / 20)

**Intelligent Logistics Operations Agent** unifies **four enterprise logistics AI use cases** into one production-ready control tower connected to **Neon PostgreSQL** and powered by **Domo AI Services + LangChain**:

1. **Predictive Vehicle Delay Agent** — Rule-based delay risk scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) comparing dispatch durations against historical carrier/vehicle benchmarks and configurable ETA thresholds.
2. **Vehicle Turnaround Time (TAT) Optimization Agent** — End-to-end lifecycle duration analysis across Inbound PO Receipts, Production Cycles, Order Preparation, Outbound Transit, and ETA Slippage Variance.
3. **Smart Loading Bay & Dock Allocation Agent** — Warehouse staging and priority queue recommendations (`FG-WH-01` at `IN-KA-01` and `IN-TN-01`) with a Neon-persisted **Human-in-the-Loop Supervisor Approval Workflow**.
4. **Automated Logistics Report & Management Summary Agent** — Daily, Weekly, Monthly, and Custom Date-Range operational summaries with real **Excel (`.xlsx`)** and **PDF (`.pdf`)** downloads.

*(Per specification, Use Case 3 – Logistics Anomaly Detection Agent is intentionally excluded.)*

---

## 1. Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React + Vite | Montserrat typography, Light & Dark themes, 7 operational pages |
| **Backend** | Python 3.11+ / FastAPI | REST endpoints, Pydantic validation, SQLAlchemy, `openpyxl` (Excel), `fpdf2` (PDF) |
| **AI Agent** | Domo AI Services + LangChain | `POST https://gwcteq-partner.domo.com/api/ai/v1/text/generation` (`domo.domo_ai.domogpt-large-v2.2:anthropic`) |
| **Database** | Neon PostgreSQL (`psycopg`) | `manufacturing_logistics` schema + `public` inline views + persisted approvals & chat history |

---

## 2. Ingested Datasets Inventory (17 Tables · 27,731 Verified Rows)

All logistics and readiness datasets from `e:\Documents\data.zip` are atomically loaded via staging tables (`__stg_<table>`) and PostgreSQL advisory locks (`pg_advisory_lock(120012)`):

| Table (`manufacturing_logistics`) | Source CSV | Rows | Columns | Validation |
|---|---|---:|---:|:---:|
| `fact_quality_inspection` | `fact_quality_inspection.csv` | 16,000 | 19 | SUCCESS |
| `fact_inventory_daily_snapshot` | `fact_inventory_daily_snapshot.csv` | 6,624 | 14 | SUCCESS |
| `fact_customer_order` | `fact_customer_order.csv` | 1,500 | 12 | SUCCESS |
| `fact_purchase_order_receipt` | `fact_purchase_order_receipt.csv` | 1,300 | 14 | SUCCESS |
| `fact_shipment_milestone` | `fact_shipment_milestone.csv` | 1,000 | 14 | SUCCESS |
| `fact_production_order` | `fact_production_order.csv` | 450 | 12 | SUCCESS |
| `fact_ncr_capa` | `fact_ncr_capa.csv` | 400 | 10 | SUCCESS |
| `dim_shift_calendar` | `dim_shift_calendar.csv` | 276 | 7 | SUCCESS |
| `dim_product_routing` | `dim_product_routing.csv` | 63 | 8 | SUCCESS |
| `fact_bom_component` | `fact_bom_component.csv` | 48 | 8 | SUCCESS |
| `dim_station` | `dim_station.csv` | 21 | 5 | SUCCESS |
| `dim_material` | `dim_material.csv` | 18 | 10 | SUCCESS |
| `dim_defect_code` | `dim_defect_code.csv` | 12 | 5 | SUCCESS |
| `dim_supplier` | `dim_supplier.csv` | 10 | 9 | SUCCESS |
| `dim_customer` | `dim_customer.csv` | 4 | 6 | SUCCESS |
| `dim_product` | `dim_product.csv` | 3 | 11 | SUCCESS |
| `dim_plant` | `dim_plant.csv` | 2 | 7 | SUCCESS |

### Transparent Missing VMS Field Disclosures
No synthetic VMS data is ever fabricated. When gate, weighbridge, or physical dock bay data is unavailable in `data.zip`, both the UI and AI Agent explicitly identify the missing fields:
- **Gate / Weighbridge / Vehicle Plate**: `vehicle_number`, `gate_entry_ts`, `security_check_ts`, `weighbridge_in_ts`, `yard_arrival_ts`, `gate_exit_ts`.
- **Shift-Wise TAT Precision**: `dim_shift_calendar` defines Shifts A, B, and C, while `fact_shipment_milestone` logs `dispatch_date` at daily (`00:00:00`) granularity.
- **Physical Dock Master**: `dock_id`, `dock_type`, `dock_capacity`, `dock_occupied_status`.

---

## 3. Seven Control Tower Pages

1. **Executive Dashboard** — 8 unified KPIs, 21-day movement & delay trend, rule-based delay risk breakdown, lifecycle stage durations, vehicle type TAT comparison.
2. **Predictive Vehicle Delay** — Active & historical vehicle delay risk table (`CRITICAL`/`HIGH`/`MEDIUM`/`LOW`), risk reason, recommended action, date/checkpoint/risk filters, and journey detail modal.
3. **Vehicle TAT Optimization** — Stage-wise duration breakdown, carrier & plant TAT benchmarks, longest TAT journeys table with interactive timeline & peer benchmark comparison.
4. **Smart Dock Allocation** — Warehouse staging readiness (`FG-WH-01` at `IN-KA-01` & `IN-TN-01`), priority queue recommendations, and persistent supervisor **Approve / Reject** workflow (`dock_allocation_approvals`).
5. **Management Reports** — Daily, Weekly, Monthly, and Custom Date-Range reports with Sections A–F and real `.xlsx` Excel + `.pdf` export downloads.
6. **AI Logistics Assistant** — Domo AI conversational agent equipped with 12 database-backed LangChain tools, markdown tables, and collapsible tool execution traces.
7. **Data Health** — Live Neon host status, table-by-table lineage & row validation, ZIP reload trigger, and structured missing VMS fields table.

---

## 4. Twelve Unified LangChain Agent Tools

1. `get_database_schema`
2. `run_readonly_sql`
3. `get_vehicle_journey`
4. `analyze_vehicle_delay_risk`
5. `calculate_vehicle_tat`
6. `analyze_stage_waiting_times`
7. `analyze_bottlenecks`
8. `get_waiting_vehicles`
9. `get_dock_availability`
10. `recommend_dock_allocation`
11. `generate_daily_logistics_summary`
12. `generate_periodic_logistics_report`

---

## 5. REST API Endpoints

- `GET /api/health` · `GET /api/data-health` · `POST /api/data-reload`
- `GET /api/dashboard` · `GET /api/shipments` · `GET /api/orders` · `GET /api/inventory`
- `GET /api/delay-risk` (Use Case 1)
- `GET /api/tat` · `GET /api/tat/{shipment_id}` (Use Case 2)
- `GET /api/dock/recommendations` · `POST /api/dock/approvals` (Use Case 4)
- `GET /api/reports` · `GET /api/reports/export?format=xlsx|pdf` (Use Case 5)
- `GET /api/conversations` · `GET /api/conversations/{id}/messages` · `POST /api/chat`

---

## 6. Commands to Run

```powershell
# Start Backend (FastAPI + Neon PostgreSQL)
cd logistics-dispatch-agent\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Start Frontend (React + Vite)
cd logistics-dispatch-agent\ui
npm run dev

# Production Frontend Build
npm run build
```
