import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Check, CheckCircle2,
  Clock3, Cpu, Database, Eye, EyeOff, FileCheck2, Filter, HardDrive,
  HelpCircle, Layers, Lock, Play, Pause, RefreshCw, RotateCcw, Scale, Search, Server, ShieldAlert, ShieldCheck,
  Sparkles, Table2, Terminal, Truck, Warehouse, Wifi, X, Zap, ChevronRight, Settings
} from 'lucide-react'

// ===================== 14 ENTERPRISE CONNECTORS (EXACT CARDS FROM USER SCREENSHOT) =====================
const INITIAL_CONNECTORS = [
  {
    id: 'oracle',
    code: 'OR',
    name: 'Oracle',
    badgeColor: '#ea392a',
    category: 'Database · Plant data warehouse',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '28ms',
    uptime: '99.98%',
    protocol: 'Oracle Net / OCI over TLS 1.3',
    defaultHost: 'db-plant-prod.apexops.internal:1521/ORCLPDB1',
    description: 'Enterprise relational data warehouse storing historic plant shipments, supplier master catalogs, and finished goods inventory ledger.',
    events: [
      { id: 'ev_batch_sync', name: 'Batch Inventory Ledger Snapshot', desc: 'Hourly snapshot of factory pallet stock', selected: true },
      { id: 'ev_supplier_asn', name: 'Supplier Advanced Shipping Notice (ASN)', desc: 'Pre-advice of inbound component supplies', selected: true },
      { id: 'ev_cost_recon', name: 'Freight Cost & Tax Reconciliation', desc: 'Commercial freight audit against contract rates', selected: true },
      { id: 'ev_audit_log', name: 'Database Audit & DDL Event Stream', desc: 'Schema change detection and user query audits', selected: false },
    ],
    fields: [
      { source: 'PLANT_WH_ID', target: 'plant_warehouse_code', type: 'VARCHAR(24)', desc: 'Oracle plant storage facility identifier', sample: 'PLANT-KA-01', rule: 'Must match dim_plant' },
      { source: 'ERP_SUPPLIER_ID', target: 'vendor_code', type: 'VARCHAR(32)', desc: 'Approved supplier identifier', sample: 'SUP-IND-9041', rule: 'Active master vendor check' },
    ]
  },
  {
    id: 'mysql',
    code: 'MY',
    name: 'MySQL',
    badgeColor: '#00758f',
    category: 'Database · Line-side application database',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '14ms',
    uptime: '99.99%',
    protocol: 'MySQL Native TCP / SSL Port 3306',
    defaultHost: 'lineside-apps.plant01.apex.local:3306/lineside_prod',
    description: 'Line-side edge database capturing assembly line pack-out events, conveyor barcode scans, and operator terminal check-ins.',
    events: [
      { id: 'ev_line_pack', name: 'Finished Goods Box Pack-Out', desc: 'Triggered when carton passes end-of-line scanner', selected: true },
      { id: 'ev_pallet_tag', name: 'Pallet RFID Label Print Event', desc: 'Associates 50 cartons into one master pallet barcode', selected: true },
      { id: 'ev_operator_shift', name: 'Packing Station Operator Check-In', desc: 'Records active station packer and line velocity', selected: false },
      { id: 'ev_buffer_flow', name: 'Staging Buffer Conveyor Advance', desc: 'Monitors line-to-dock buffer conveyor status', selected: true },
    ],
    fields: [
      { source: 'carton_barcode', target: 'package_barcode', type: 'VARCHAR(64)', desc: 'High-density line-side carton 2D code', sample: 'PKG-2026-X8801', rule: 'Unique scan validation' },
      { source: 'line_speed_bpm', target: 'assembly_line_rate', type: 'INTEGER', desc: 'Cartons packed per minute', sample: '42 Boxes/min', rule: 'Normal range: 20-60' },
    ]
  },
  {
    id: 'sap',
    code: 'SAP',
    name: 'SAP',
    badgeColor: '#008fd3',
    category: 'ERP / CMMS · Work orders, notifications and costs',
    eventsCount: 4,
    status: 'CONNECTED',
    latency: '34ms',
    uptime: '99.99%',
    protocol: 'REST API / OData v4 over mTLS',
    defaultHost: 'https://s4hana.apexmanufacturing.com/sap/opu/odata/sap/API_SALES_ORDER_SRV',
    description: 'Core enterprise ERP synchronizing commercial sales orders, work orders, maintenance notifications, customer priority tiers, and billing.',
    events: [
      { id: 'ev_sales_order', name: 'Sales Order Creation & Revision', desc: 'Dispatched when new customer order is released in S/4HANA', selected: true },
      { id: 'ev_delivery_doc', name: 'Outbound Delivery Document (VL01N)', desc: 'Generates pick-pack-ship manifest for shipping bays', selected: true },
      { id: 'ev_billing_block', name: 'Credit Limit & Billing Block Status', desc: 'Holds dispatches if commercial credit hold is applied', selected: true },
      { id: 'ev_cost_center', name: 'Logistics Cost Allocation (CO-PA)', desc: 'Posts freight spend to plant profit centers', selected: true },
    ],
    fields: [
      { source: 'VBELN', target: 'order_id', type: 'VARCHAR(32)', desc: 'Unique SAP sales order identifier', sample: 'CO-001248', rule: 'NOT NULL · Primary Key' },
      { source: 'KUNNR', target: 'customer_name', type: 'VARCHAR(128)', desc: 'Enterprise customer / consignee name', sample: 'Titan Precision Tech Ltd', rule: 'Foreign Key in dim_customer' },
      { source: 'VDATU', target: 'target_delivery_date', type: 'TIMESTAMPTZ', desc: 'SLA committed delivery deadline', sample: '2026-10-28 18:00:00+05:30', rule: 'Must be >= order_date' },
      { source: 'NETWR', target: 'freight_value_inr', type: 'NUMERIC(14,2)', desc: 'Total cargo commercial value', sample: '₹2,450,000.00', rule: 'Currency: INR locked' },
    ]
  },
  {
    id: 'sap_hana',
    code: 'HA',
    name: 'SAP HANA',
    badgeColor: '#1b365d',
    category: 'Database · In-memory analytics store',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '8ms',
    uptime: '99.99%',
    protocol: 'HANA In-Memory SQL Protocol / Port 30015',
    defaultHost: 'hana-cluster.corp.apexmanufacturing.com:30015',
    description: 'Columnar in-memory database engine powering instant enterprise financial rollups, multi-plant material requirements, and executive profitability cubes.',
    events: [
      { id: 'ev_hana_calc_view', name: 'Calculation View Query Stream', desc: 'Direct streaming of supply chain MRP analytics views', selected: true },
      { id: 'ev_material_mrp', name: 'MRP Real-Time Shortage Forecast', desc: 'Material shortage alerts for packaging components', selected: true },
      { id: 'ev_column_snapshot', name: 'Columnar Inventory Valuation Rollup', desc: 'Real-time valuation of finished goods in stock', selected: false },
      { id: 'ev_hana_cdc', name: 'High-Speed Change Data Capture (CDC)', desc: 'Sub-second replication of S/4 table modifications', selected: true },
    ],
    fields: [
      { source: 'MATNR', target: 'material_sku', type: 'VARCHAR(40)', desc: 'Unique finished good SKU catalog number', sample: 'SKU-TURBO-440', rule: 'Must exist in master catalog' },
      { source: 'LABST', target: 'unrestricted_stock_qty', type: 'INTEGER', desc: 'Unrestricted finished goods available', sample: '18,400 Units', rule: 'Stock must be >= 0' },
    ]
  },
  {
    id: 'excel',
    code: 'XL',
    name: 'Excel',
    badgeColor: '#107c41',
    category: 'File · Spreadsheet export for the planner',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: 'File Sync',
    uptime: '100.0%',
    protocol: 'OneDrive / SharePoint Graph API & CSV Watcher',
    defaultHost: 'sharepoint.apexmanufacturing.com/sites/Logistics/DailyDispatchSchedule.xlsx',
    description: 'Automated bi-directional synchronization with daily dispatch manifest spreadsheets, manual driver override sheets, and shift roster workbooks.',
    events: [
      { id: 'ev_sheet_update', name: 'Dispatch Planner Schedule Upload', desc: 'Triggers when dispatch officer saves updated workbook', selected: true },
      { id: 'ev_manual_override', name: 'Manual Bay Override Entry', desc: 'Detects ad-hoc priority changes made in planner Excel', selected: true },
      { id: 'ev_csv_drop', name: 'Automated CSV SFTP Drop Watcher', desc: 'Pulls external 3PL carrier manifest CSV attachments', selected: false },
      { id: 'ev_sheet_export', name: 'End-of-Shift Workbook Export', desc: 'Auto-generates daily dispatch reconciliation sheet', selected: true },
    ],
    fields: [
      { source: 'Sheet_Row_Vehicle', target: 'manifest_vehicle_no', type: 'VARCHAR(24)', desc: 'Vehicle plate written in planner worksheet', sample: 'KA-01-AJ-8819', rule: 'Format: XX-00-XX-0000' },
      { source: 'Driver_Contact_Cell', target: 'driver_phone', type: 'VARCHAR(16)', desc: 'Driver mobile telephone number', sample: '+91 98450 12345', rule: '10-digit Indian mobile' },
    ]
  },
  {
    id: 'snowflake',
    code: 'SF',
    name: 'Snowflake',
    badgeColor: '#29b5e8',
    category: 'Warehouse · Group reporting warehouse',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '45ms',
    uptime: '99.99%',
    protocol: 'Snowpipe Streaming / REST API v2',
    defaultHost: 'apex_group.ap-south-1.snowflakecomputing.com',
    description: 'Enterprise cloud data warehouse aggregating multi-region supply chain telemetry, historic 5-year corridor TAT benchmarks, and global ESG carbon analytics.',
    events: [
      { id: 'ev_snowpipe_stream', name: 'Snowpipe Real-Time Telemetry Stream', desc: 'Micro-batch streaming of completed journey logs', selected: true },
      { id: 'ev_historic_tat', name: '5-Year Historic TAT Benchmark Query', desc: 'Provides baseline mean & standard deviations for ML model', selected: true },
      { id: 'ev_carbon_esg', name: 'Fleet CO2 Emission Reporting Sync', desc: 'Calculates diesel burn vs payload weight ratios', selected: false },
      { id: 'ev_zero_copy_clone', name: 'Data Share & Audit Partition', desc: 'Regulatory compliance partition sharing with external auditors', selected: true },
    ],
    fields: [
      { source: 'HISTORIC_AVG_TAT', target: 'benchmark_tat_hours', type: 'NUMERIC(6,2)', desc: 'Corridor historical average transit duration', sample: '4.15 hrs', rule: 'Calculated over 90 days' },
      { source: 'CO2_EST_KG', target: 'trip_carbon_emission_kg', type: 'NUMERIC(8,2)', desc: 'Estimated freight journey carbon footprint', sample: '142.50 kg CO2', rule: 'Standard DEFRA freight factor' },
    ]
  },
  {
    id: 'api',
    code: 'API',
    name: 'API',
    badgeColor: '#334155',
    category: 'REST · Generic webhook for any in-house system',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '16ms',
    uptime: '99.99%',
    protocol: 'HTTPS Webhook / OpenAPI 3.0 / Bearer Auth',
    defaultHost: 'https://api.apexlogistics.io/v1/webhooks/dispatch-events',
    description: 'Universal developer integration gateway for custom internal applications, plant conveyor PLCs, custom barcoding portals, and third-party freight portals.',
    events: [
      { id: 'ev_custom_webhook', name: 'Custom Dispatch Trigger Ingestion', desc: 'Accepts JSON payloads from proprietary legacy tools', selected: true },
      { id: 'ev_status_broadcast', name: 'Outbound Event Webhook Fan-Out', desc: 'Broadcasts milestones to customer TMS webhooks', selected: true },
      { id: 'ev_rate_limit', name: 'Rate Limiting & Token Authentication', desc: 'Enforces 10,000 req/min token bucket throttling', selected: true },
      { id: 'ev_schema_contract', name: 'OpenAPI JSON Schema Validation', desc: 'Rejects malformed incoming request bodies automatically', selected: false },
    ],
    fields: [
      { source: 'payload_event_type', target: 'webhook_event_name', type: 'VARCHAR(48)', desc: 'Header declared webhook event type', sample: 'DISPATCH_COMMENCED', rule: 'Enum: STARTED, COMPLETED, DELAYED' },
      { source: 'idempotency_key', target: 'request_uuid', type: 'UUID', desc: 'Prevents duplicate transaction processing', sample: '550e8400-e29b-41d4-a716-446655440000', rule: 'Unique in 24h window' },
    ]
  },
  {
    id: 'siemens_mes',
    code: 'OP',
    name: 'Siemens Opcenter MES',
    badgeColor: '#009999',
    category: 'MES · Production orders, downtime and line state',
    eventsCount: 4,
    status: 'DISCONNECTED',
    latency: '22ms',
    uptime: '99.95%',
    protocol: 'OPC-UA / Siemens Industrial IoT Gateway',
    defaultHost: 'opcenter-mes.plant01.apex.local:4840',
    description: 'Manufacturing Execution System tracking shop-floor assembly work centers, line downtime exceptions, production lot releases, and packaging velocity.',
    events: [
      { id: 'ev_lot_release', name: 'QA Batch Clearance & Release', desc: 'Fires when QA signs off manufacturing lot for shipping', selected: true },
      { id: 'ev_line_downtime', name: 'Packaging Line Stoppage Alert', desc: 'Warns dispatch agent if conveyor breakdown delays palletizing', selected: true },
      { id: 'ev_shift_output', name: 'Shift Production Tonnage Actuals', desc: 'Hourly finished-goods output volume by assembly line', selected: true },
      { id: 'ev_machine_oee', name: 'Plant Overall Equipment Effectiveness (OEE)', desc: 'Equipment availability and quality metrics', selected: false },
    ],
    fields: [
      { source: 'MES_BATCH_ID', target: 'qa_batch_number', type: 'VARCHAR(32)', desc: 'Shop-floor released production lot batch', sample: 'BATCH-2026-KA-44', rule: 'QA status: PASSED' },
      { source: 'LINE_STATUS', target: 'packaging_line_health', type: 'VARCHAR(24)', desc: 'Current conveyor operational state', sample: 'RUNNING_OPTIMAL', rule: 'RUNNING / STOPPED / CHANGEOVER' },
    ]
  },
  {
    id: 'teams',
    code: 'MT',
    name: 'Microsoft Teams',
    badgeColor: '#505ac9',
    category: 'Messaging · Shift handover channel',
    eventsCount: 3,
    status: 'DISCONNECTED',
    latency: 'Webhook',
    uptime: '99.99%',
    protocol: 'Microsoft Graph API / Adaptive Cards Webhook',
    defaultHost: 'https://apexmanufacturing.webhook.office.com/webhookb2/teams-logistics',
    description: 'Automated shift handover notifications, critical delay escalation broadcasts, and interactive cards for dock bay assignment approvals directly in MS Teams.',
    events: [
      { id: 'ev_urgent_alert', name: 'Critical Delay Risk Adaptive Card', desc: 'Posts interactive card with "Reroute" button into #dispatch-ops', selected: true },
      { id: 'ev_shift_handover', name: 'Automated Shift Handover Digest', desc: 'Summarizes stuck vehicles, waiting queue and pending dispatches', selected: true },
      { id: 'ev_bay_override_notify', name: 'P1 Immediate Dock Bay Allocation Alert', desc: 'Notifies yard marshal channel when Bay 04 is assigned P1', selected: true },
    ],
    fields: [
      { source: 'teams_channel_id', target: 'notification_target_channel', type: 'VARCHAR(64)', desc: 'Target MS Teams operations channel ID', sample: '19:dispatch-ops@thread.v2', rule: 'Must be verified webhook' },
      { source: 'action_response', target: 'approval_decision', type: 'VARCHAR(16)', desc: 'Dispatcher click on adaptive card', sample: 'APPROVED', rule: 'APPROVED / REJECTED' },
    ]
  },
  {
    id: 'power_bi',
    code: 'BI',
    name: 'Microsoft Power BI',
    badgeColor: '#eab308',
    category: 'Reporting · Leadership dashboards',
    eventsCount: 3,
    status: 'DISCONNECTED',
    latency: 'Push Dataset',
    uptime: '99.98%',
    protocol: 'Power BI REST API / Real-Time Streaming Dataset',
    defaultHost: 'https://api.powerbi.com/v1.0/myorg/groups/logistics-exec/datasets',
    description: 'Live push datasets updating executive leadership Power BI dashboards, plant throughput tiles, and regional carrier SLA scorecards with zero manual refresh.',
    events: [
      { id: 'ev_pbi_kpi_push', name: 'Real-Time KPI Metric Tile Push', desc: 'Updates Total Dispatches, Delivered %, and Spend every 60s', selected: true },
      { id: 'ev_carrier_scorecard', name: 'Weekly Carrier Performance Scorecard Push', desc: 'Refreshes carrier league table and on-time percentages', selected: true },
      { id: 'ev_scheduled_dataset', name: 'Executive Dataset Scheduled Refresh Trigger', desc: 'Triggers semantic model refresh when shift closes', selected: false },
    ],
    fields: [
      { source: 'dataset_id', target: 'pbi_target_dataset', type: 'VARCHAR(48)', desc: 'Power BI streaming dataset identifier', sample: 'd1982a-449b-4301-exec', rule: 'Workspace admin authorized' },
      { source: 'kpi_value_json', target: 'dashboard_metric_payload', type: 'JSONB', desc: 'Formatted scorecard values and percentage targets', sample: '{"on_time_pct": 92.4, "dispatches": 1000}', rule: 'Schema validated' },
    ]
  },
  {
    id: 'wms',
    code: 'WMS',
    name: 'Manhattan WMS',
    badgeColor: '#8b5cf6',
    category: 'Warehouse · Manhattan Associates lot & bay staging',
    eventsCount: 5,
    status: 'CONNECTED',
    latency: '18ms',
    uptime: '99.98%',
    protocol: 'RESTful API + WebSocket Event Stream',
    defaultHost: 'https://wms.apexplants.internal/api/v2/staging',
    description: 'Tracks real-time finished goods stock availability at Plant FG-WH-01 & FG-WH-02, pallet staging allocations, high-bay picking bin status, and loading dock occupancy.',
    events: [
      { id: 'ev_wms_lot', name: 'Production Lot Batch QA Inspection & Staging', desc: 'Tracks lot readiness at FG-WH-01 and FG-WH-02', selected: true },
      { id: 'ev_bay_occupancy', name: 'Dock Bay 01-06 Sensor Occupancy Event', desc: 'Sensors detect vehicle docked / undocked state', selected: true },
      { id: 'ev_forklift_marshal', name: 'Yard Marshal & Forklift Operator Allocation', desc: 'Assigns certified loading crew to urgent bays', selected: true },
      { id: 'ev_buffer_pallet', name: 'Buffer Pallet Staging Alert', desc: 'Fires when Bay 06 buffer queue reaches threshold', selected: true },
    ],
    fields: [
      { source: 'LOT_BATCH_NO', target: 'lot_id', type: 'VARCHAR(32)', desc: 'Production manufacturing lot batch', sample: 'LOT-KA-2026-B88', rule: 'QA Released status only' },
      { source: 'STK_QTY_AVAIL', target: 'units_available', type: 'INTEGER', desc: 'Pickable finished goods on hand', sample: '28,500 Units', rule: 'Audited against WMS ledger' },
      { source: 'BAY_ASSIGN_ID', target: 'assigned_bay', type: 'VARCHAR(16)', desc: 'Warehouse dock allocation (Bays 01-06)', sample: 'Bay 01 (Heavy 32FT)', rule: 'Checked against bay capacity' },
      { source: 'FORKLIFT_CREW', target: 'forklift_operator_id', type: 'VARCHAR(24)', desc: 'Assigned yard marshal & loading crew', sample: 'EMP-OPS-904', rule: 'Active shift badge check' },
    ]
  },
  {
    id: 'security_gate',
    code: 'SEC',
    name: 'Plant Security & Gate Checkpoint',
    badgeColor: '#0284c7',
    category: 'Access Control · Physical security, RFID FASTag, ANPR & E-Way Bill inspection',
    eventsCount: 5,
    status: 'CONNECTED',
    latency: '15ms',
    uptime: '100.0%',
    protocol: 'Wiegand / OSDP IP Controller + UHF RFID & Camera ANPR',
    defaultHost: 'security-gate01.plant.internal:8443/api/v1/gate-events',
    description: 'Validates known authorized vehicle entry into plant premises, inspects driver credentials, verifies commercial E-Way bill against SAP sales orders, and records exact Entry/Exit timestamps that feed the Turnaround Time (TAT) calculation engine.',
    events: [
      { id: 'ev_security_gate_in', name: 'Vehicle Security Inward Checkpoint (T_entry)', desc: 'Security verifies truck registration, driver ID & E-Way bill. Triggers In-Plant TAT calculation starting timestamp.', selected: true },
      { id: 'ev_anpr_plate_match', name: 'Automatic Number Plate Recognition (ANPR)', desc: 'Optical camera matches vehicle plate against SAP sales order manifest within 2 seconds.', selected: true },
      { id: 'ev_wb_linkage', name: 'Weighbridge WB-01 Tare Scale Handoff', desc: 'Directly routes verified known vehicle to WB-01 pit scale for tare weighment.', selected: true },
      { id: 'ev_seal_inspection', name: 'Physical Tamper & Container Seal Check', desc: 'Security logs container bolt seal condition before dock staging approval.', selected: true },
      { id: 'ev_security_gate_out', name: 'Security Gate Outward Clearance (T_exit)', desc: 'Validates outbound gross scale slip, verifies QR pass, and lifts exit boom barrier. Marks In-Plant TAT completion.', selected: true },
    ],
    fields: [
      { source: 'GATE_ENTRY_TS', target: 'gate_inward_timestamp', type: 'TIMESTAMPTZ', desc: 'Security boom barrier lift timestamp', sample: '2026-10-28 08:15:00+05:30', rule: 'T0 Baseline for TAT calculation' },
      { source: 'VEHICLE_KNOWN_STATUS', target: 'vehicle_authorization_status', type: 'VARCHAR(24)', desc: 'Security access decision', sample: 'KNOWN_AUTHORIZED', rule: 'Verified against SAP manifest' },
      { source: 'WB_TARE_LINK_ID', target: 'wb01_tare_scale_id', type: 'VARCHAR(32)', desc: 'Linked Mettler Toledo tare weighment ticket', sample: 'WB-TARE-2026-9041', rule: 'Tare weighment within 15 mins' },
      { source: 'GATE_EXIT_TS', target: 'gate_outward_timestamp', type: 'TIMESTAMPTZ', desc: 'Security outward exit timestamp', sample: '2026-10-28 11:30:00+05:30', rule: 'In-Plant TAT = T_exit - T_entry' },
      { source: 'TARGET_DATASET', target: 'stg_vehicle_entry_exit', type: 'TABLE', desc: 'Target Neon PostgreSQL operational ledger', sample: 'manufacturing_logistics.stg_vehicle_entry_exit', rule: 'Live telemetry ingestion' },
    ]
  },
  {
    id: 'vms',
    code: 'WB',
    name: 'Mettler Toledo Scale',
    badgeColor: '#10b981',
    category: 'Hardware · Certified 60T weighbridge scale & laser',
    eventsCount: 4,
    status: 'CONNECTED',
    latency: '12ms',
    uptime: '100.0%',
    protocol: 'Modbus TCP / RS-232 Serial Gateway',
    defaultHost: 'weighbridge-gw01.plant.internal:502',
    description: 'Captures certified 60-Ton pit scale weighments (Tare upon inward entry, Gross upon exit). Feeds empty tare weight (14.20T) and laden gross weight (28.15T) directly into the Vehicle TAT calculation dataset.',
    events: [
      { id: 'ev_tare_capture', name: 'Vehicle Inbound Tare Weight Weighment', desc: 'Captures unladen weight before loading at docks. Feeds T_tare into TAT model.', selected: true },
      { id: 'ev_gross_capture', name: 'Vehicle Outbound Gross Weight Weighment', desc: 'Validates payload tonnage against bill of lading. Feeds T_gross into TAT model.', selected: true },
      { id: 'ev_laser_alignment', name: 'Optical Laser Tire Alignment Interlock', desc: 'Verifies vehicle is fully on scale platform', selected: true },
      { id: 'ev_overload_gate_lock', name: 'Axle Overload Barrier Gate Auto-Lock', desc: 'Physically prevents highway dispatch if overweight', selected: true },
    ],
    fields: [
      { source: 'TARE_WT_KG', target: 'tare_weight_tons', type: 'NUMERIC(8,3)', desc: 'Unloaded vehicle unladen weight', sample: '14.200 Tons', rule: 'Must match chassis manifest' },
      { source: 'GROSS_WT_KG', target: 'gross_weight_tons', type: 'NUMERIC(8,3)', desc: 'Fully laden vehicle gross weight', sample: '28.150 Tons', rule: 'Gross > Tare mandatory' },
      { source: 'NET_PAYLOAD_KG', target: 'net_payload_tons', type: 'NUMERIC(8,3)', desc: 'Calculated cargo product weight', sample: '13.950 Tons', rule: 'Tolerance: ±2.5% vs order' },
      { source: 'TARGET_DATASET', target: 'stg_weighbridge_telemetry', type: 'TABLE', desc: 'Target Neon PostgreSQL weighbridge ledger', sample: 'public.stg_weighbridge_telemetry', rule: 'Feeds TAT lifecycle' },
    ]
  },
  {
    id: 'tms',
    code: 'OTM',
    name: 'Oracle OTM & FASTag',
    badgeColor: '#f59e0b',
    category: 'TMS & IoT · Vehicle GPS telematics & toll checkpoints',
    eventsCount: 6,
    status: 'CONNECTED',
    latency: '24ms',
    uptime: '99.95%',
    protocol: 'Kafka Event Stream + MQTT IoT Gateway',
    defaultHost: 'kafka-tms.apexcloud.net:9092/topics/gps-telematics',
    description: 'Streams real-time corridor GPS coordinates along NH-48 and NH-544, captures FASTag RFID toll plaza transactions, validates carrier contracted SLAs, and monitors in-transit speed.',
    events: [
      { id: 'ev_gps_ping', name: '60-Second GPS Telematics Ping', desc: 'In-transit latitude/longitude coordinate broadcast', selected: true },
      { id: 'ev_fastag_toll', name: 'FASTag RFID Toll Plaza Timestamp', desc: 'Electronic toll deduction verifying physical milestone', selected: true },
      { id: 'ev_geofence_arrival', name: 'Plant & Destination Geofence Event', desc: 'Auto-triggers gate entry pass upon radius entry', selected: true },
      { id: 'ev_corridor_slowdown', name: 'Highway Traffic & Bottleneck Alert', desc: 'Flags unexpected vehicle stop > 90 minutes', selected: true },
    ],
    fields: [
      { source: 'VEHICLE_REG_NO', target: 'vehicle_number', type: 'VARCHAR(24)', desc: 'Commercial vehicle registration', sample: 'KA-01-AJ-8819', rule: 'FASTag electronic RFID match' },
      { source: 'GPS_LAT_LONG', target: 'current_coordinates', type: 'VARCHAR(32)', desc: 'Live GPS geocoordinates', sample: '12.9716° N, 77.5946° E', rule: 'Valid highway corridor bounding' },
      { source: 'CARRIER_CODE', target: 'carrier_name', type: 'VARCHAR(64)', desc: 'Contracted logistics partner', sample: 'Safexpress Logistics', rule: 'Foreign Key in dim_carrier' },
      { source: 'ETA_PREDICTED', target: 'predicted_eta', type: 'TIMESTAMPTZ', desc: 'Domo AI corridor arrival forecast', sample: '2026-10-28 16:30:00+05:30', rule: 'Recalculated every 60s' },
    ]
  },
  {
    id: 'neon',
    code: 'NEON',
    name: 'Neon Lakebase Postgres',
    badgeColor: '#0d9488',
    category: 'Cloud Database · Neon Lakebase operational ledger',
    eventsCount: 8,
    status: 'CONNECTED',
    latency: '6ms',
    uptime: '100.0%',
    protocol: 'PostgreSQL Wire Protocol over SSL / Pooling',
    defaultHost: 'ep-gentle-field-bdcucink-pooler.c-8.us-east-2.aws.neon.tech/neondb',
    description: 'The central transactional and analytical cloud backbone. Ingests all normalized data, enforces row-level security (RBAC), and powers instant analytical queries for the 3D twin, Domo AI, and control tower.',
    events: [
      { id: 'ev_neon_acid_write', name: 'Immediate ACID Transaction Commit', desc: 'Guarantees zero loss of weighbridge and order entries', selected: true },
      { id: 'ev_neon_branch_sync', name: 'Instant Ephemeral Database Branching', desc: 'Enables testing AI heuristics without touching production', selected: true },
      { id: 'ev_neon_realtime_push', name: 'Real-Time SQL Query Streaming', desc: 'Sub-10ms change notification to browser UI', selected: true },
      { id: 'ev_neon_ai_gateway', name: 'Neon AI Gateway Vector & LLM Context', desc: 'Feeds live operational state to Analytics & Intelligence Engine', selected: true },
    ],
    fields: [
      { source: 'DATABASE_URL', target: 'neon_connection_pooler', type: 'CONNECTION_URI', desc: 'High-availability connection string', sample: 'ep-gentle-field-***.neon.tech', rule: 'SSL Mode: require' },
      { source: 'SCHEMA_VERSION', target: 'ddl_migration_state', type: 'VARCHAR(16)', desc: 'Verified database migration state', sample: 'v2.4_OPERATIONAL_PROD', rule: 'Zero schema drift' },
      { source: 'ROW_LEVEL_RBAC', target: 'jwt_claim_authorization', type: 'SECURITY_POLICY', desc: 'Enforces role isolation (Manager/Worker)', sample: 'RBAC_ACTIVE_ENFORCED', rule: 'Manager / Dispatch / Logistics' },
      { source: 'AUDIT_LOG_STREAM', target: 'audit_event_ledger', type: 'TABLE', desc: 'Immutable security and compliance log', sample: '7,420 events recorded', rule: 'Append-only audit trail' },
    ]
  }
]

// ===================== 6-STEP AUTONOMOUS AGENT DECISION PIPELINE (EXACT VISUAL FROM USER REQUEST) =====================
const AGENT_WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Collect Logistics & Fleet Data',
    subtitle: 'Latest ERP orders, WMS lots, weighbridge scale & GPS telematics',
    icon: Database,
    color: '#0ea5e9',
    badge: '1 · DATA INGESTION',
    sourceSystems: ['SAP S/4HANA', 'Manhattan WMS', 'Mettler Toledo Scale WB-01', 'Oracle TMS & FASTag', 'Neon Lakebase'],
    inputData: [
      { key: 'Sales Order (SAP)', value: 'CO-001248 · Titan Precision · 4,500 Units · ₹2,450,000' },
      { key: 'Finished Goods Lot (WMS)', value: 'LOT-KA-2026-B88 · 28,500 units on hand at FG-WH-01' },
      { key: 'Tare Weight (WB-01)', value: 'Scale WB-01 · Tare: 9.450 Tons · Optical laser verified' },
      { key: 'GPS Telematics (TMS)', value: 'KA-01-AJ-8819 · 12.9716°N, 77.5946°E · 52.4 km/h' },
    ],
    agentLogic: 'Validates cryptographic mTLS handshakes, normalizes heterogeneous schemas into Lakebase PostgreSQL relational tables, and audits against duplicate RFID reads.',
    outputDataTitle: 'Application Database State Updated',
    outputData: {
      table: 'fact_customer_order · fact_weighbridge_logs',
      ingested_records: 1000,
      sync_latency: '18ms',
      validation_status: 'PASSED (0 Nulls, 0 Schema Drift)',
      live_lakebase_table: 'ep-gentle-field-bdcucink-pooler.c-8.us-east-2.aws.neon.tech/neondb'
    },
    appDestination: 'Feeds live operational state to Neon Lakebase PostgreSQL',
    navTarget: 'overview',
    navText: 'View Ingested Database Records',
  },
  {
    step: 2,
    title: 'Analyse Operational Health',
    subtitle: 'Sensor checks, weight tolerances, and normal ranges per shift',
    icon: Scale,
    color: '#10b981',
    badge: '2 · HEALTH AUDIT',
    sourceSystems: ['Weighbridge Scale WB-01', 'Manhattan WMS Bay Sensors', 'FASTag Corridors'],
    inputData: [
      { key: 'Weighbridge Tolerance', value: 'Gross: 28.15T | Tare: 9.45T ➔ Net Payload: 18.70T (±2.5% legal margin)' },
      { key: 'Bay Readiness', value: 'Bays 01-06 Status: Bay 01 Active, Bay 02 Tare Verified, Bay 03 Available' },
      { key: 'Plant Scope Capacity', value: 'KA-01 (68.2% Load) · TN-01 (71.0% Load)' },
    ],
    agentLogic: 'Computes payload weight vs chassis tolerance. Checks bay physical height/tonnage constraints (32FT Heavy vs 20FT Medium vs Dost Mini). Verifies active yard marshal shift badges.',
    outputDataTitle: 'Operational Telemetry & Gauges',
    outputData: {
      on_time_pct: 92.4,
      avg_utilization: '84.6% Fleet Capacity',
      fulfillment_pct: '94.2% Completed',
      weighbridge_status: 'Certified 60T (Online · Calibrated)',
      active_dock_bays: '6 of 6 Bays Synchronized'
    },
    appDestination: 'Powers the 3 Radial Gauges & Plant Readiness Snapshot',
    navTarget: 'overview',
    navText: 'View Fleet Efficiency Gauges',
  },
  {
    step: 3,
    title: 'Detect Abnormal Conditions',
    subtitle: 'Inside-plant dwell limits (>48 hrs), bottlenecks, axle overload & route deviations',
    icon: ShieldAlert,
    color: '#ef4444',
    badge: '3 · ANOMALY DETECTION',
    sourceSystems: ['Plant Security Boom Gates', 'Yard RFID Sensors', 'GPS Geofences'],
    inputData: [
      { key: 'Plant Gate Entry Log', value: 'Vehicle INB-00959 entered plant: 12 Nov 2026 10:14 IST' },
      { key: 'Current Dwell Duration', value: '48.0 Hours elapsed inside plant (Normal threshold: < 4.0 hrs)' },
      { key: 'Gate Exit Status', value: 'NO EXIT REGISTERED · Vehicle stationary in Yard Staging Area' },
      { key: 'Demurrage Penalty', value: 'Accumulating ₹12,500/day commercial demurrage exposure' },
    ],
    agentLogic: 'Evaluates dwell timestamps: if (current_time - gate_in_time > 48h && gate_out == null) ➔ Trigger STUCK_VEHICLE_ANOMALY. Scans weighbridge load cell sensors for axle distribution imbalance.',
    outputDataTitle: 'Detected Operational Exceptions',
    outputData: {
      anomaly_detected: 'CRITICAL_DWELL_EXCEPTION',
      stuck_vehicle_count: 25,
      optimal_vehicle_id: 'INB-00959',
      avg_excess_dwell: '+48.0 hrs',
      freight_value_at_risk_inr: 1193797,
      axle_overload_status: 'CLEARED_LEGAL'
    },
    appDestination: 'Triggers the Red Alert Banner: "🚨 25 Vehicles Stuck Inside Plant"',
    navTarget: 'overview',
    navText: 'Inspect Stuck Vehicle Exceptions',
  },
  {
    step: 4,
    title: 'Calculate Delay & Exception Risk',
    subtitle: 'Risk score 0–100 from Domo AI corridor transit models and dwell history',
    icon: Sparkles,
    color: '#f59e0b',
    badge: '4 · DOMO AI PREDICTION',
    sourceSystems: ['Domo AI ML Inference', 'NH-48 Traffic Telematics', 'Historic Corridor TAT'],
    inputData: [
      { key: 'Shipment Route', value: 'Bengaluru KA-01 ➔ Chennai TN-01 Corridor (340 km)' },
      { key: 'Historic Mean TAT', value: '4.2 hrs baseline (Std Dev: 0.8 hrs)' },
      { key: 'Live Highway Friction', value: 'Heavy traffic at Krishnagiri Toll Plaza · Speed: 18 km/h' },
      { key: 'Target Customer SLA', value: '28 Oct 2026, 18:00 IST (Committed deadline)' },
    ],
    agentLogic: 'Feeds live telemetry and historical weather/traffic features into Domo AI gradient boosting regression. Computes delay variance (minutes) and calculates non-linear Risk Score (0-100).',
    outputDataTitle: 'Predictive Delay & TAT Risk Scorecard',
    outputData: {
      risk_category: 'CRITICAL',
      risk_score: 94,
      predicted_delay_variance: '+3.8 hrs',
      estimated_arrival_eta: '2026-10-28 21:48 IST (Delayed)',
      at_risk_summary: { critical: 1, high: 1, medium: 2, low: 26 },
      commercial_sla_penalty_risk: '₹85,000 SLA Penalty'
    },
    appDestination: 'Populates the Predictive Delay Table & Risk Cards in Module 4',
    navTarget: 'delay',
    navText: 'Open Predictive Delay & TAT View',
  },
  {
    step: 5,
    title: 'Generate Recommendations',
    subtitle: 'Urgent dock bay allocation, weighbridge sequence, carrier reroute, hours & cost',
    icon: Cpu,
    color: '#8b5cf6',
    badge: '5 · OPTIMIZATION ENGINE',
    sourceSystems: ['Autonomous Dispatch Heuristic', 'WMS Bay Capacity Engine'],
    inputData: [
      { key: 'High-Priority Sales Order', value: 'CO-001261 · SLA Urgency: P1 CRITICAL' },
      { key: 'Optimal Inbound Vehicle', value: 'INB-00959 (Tata 25T / 10-Wheel)' },
      { key: 'Available Loading Bay', value: 'Bay 04 equipped with hydraulic heavy ramp' },
      { key: 'Loading Crew Ready', value: 'Marshal EMP-OPS-904 on shift' },
    ],
    agentLogic: 'Executes constraint programming solver: Matches vehicle dimensions to Bay 04, optimizes forklift travel distance from FG-WH-01 picking aisle, and recommends vehicle sequencing at Scale WB-01 to eliminate yard queue.',
    outputDataTitle: 'Autonomous Actionable Plan',
    outputData: {
      recommended_action: 'STAGE_P1_BAY_04',
      assigned_bay: 'Bay 04',
      assigned_vehicle: 'TRK-KA-8819',
      assigned_carrier: 'TCI Express',
      scheduled_loading_window: '14:30 – 15:45 IST (75 mins)',
      projected_tat_saving: '1.4 hours saved',
      demurrage_avoidance: '₹25,000 saved'
    },
    appDestination: 'Lights up Bay 04 as "P1 IMMEDIATE" on Live Dock Bays Board',
    navTarget: 'overview',
    navText: 'Inspect Live Bay 04 Allocation',
  },
  {
    step: 6,
    title: 'Dispatcher Approval & Work Order',
    subtitle: 'A person approves, monitors or rejects · Gate pass released & email alert sent',
    icon: CheckCircle2,
    color: '#16a34a',
    badge: '6 · HUMAN-IN-THE-LOOP',
    sourceSystems: ['Dispatcher Command Terminal', 'SMTP Email Trigger Agent', 'Gate Boom Barrier'],
    inputData: [
      { key: 'Human Approver', value: 'mgr_admin (Operations Manager) · KA-01 Hub' },
      { key: 'Approval Action', value: 'Clicked [ Approve Dock Allocation ] & [ Trigger Email Scan ]' },
      { key: 'Notification Recipient', value: 'logistics.manager@apexmanufacturing.com' },
    ],
    agentLogic: 'Upon dispatcher sign-off, agent executes: (1) Locks Bay 04 in WMS; (2) Releases barcode gate pass to driver mobile; (3) Dispatches full multi-vehicle critical alert email with demurrage breakdown.',
    outputDataTitle: 'Application Output Dispatched',
    outputData: {
      email_dispatched: true,
      subject: '[CRITICAL DISPATCH ALERT] 25 Stuck Vehicles Inside Plant',
      recipient: 'logistics.manager@apexmanufacturing.com',
      gate_pass_barcode: 'GP-2026-KA-00959-RELEASED',
      barrier_gate_state: 'OPEN_PERMITTED',
      audit_log_id: 'LOG-AUDIT-2026-99042',
      neon_transaction_id: 'tx_88a91c2b_committed'
    },
    appDestination: 'Dispatches Email Preview Modal & Updates 3D Digital Twin status',
    navTarget: 'overview',
    navText: 'View Autonomous Email Alert Preview',
  }
]

export default function DataSourceIntegrationsView({ onNavigate }) {
  const [connectors, setConnectors] = useState(INITIAL_CONNECTORS)
  const [selectedConnector, setSelectedConnector] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewSection, setViewSection] = useState('connectors') // 'connectors' | 'agent_workflow' | 'pipeline' | 'dictionary'
  const [toastMsg, setToastMsg] = useState('')

  // 6-Step Workflow State
  const [activeStepIndex, setActiveStepIndex] = useState(1) // 1 to 6
  const [autoPlaying, setAutoPlaying] = useState(false)
  const autoPlayRef = useRef(null)

  // Modal connection form state
  const [modalHost, setModalHost] = useState('')
  const [modalAuthKey, setModalAuthKey] = useState('••••••••••••••••')
  const [modalSyncMode, setModalSyncMode] = useState('realtime')
  const [modalShowPassword, setModalShowPassword] = useState(false)
  const [modalEvents, setModalEvents] = useState([])
  const [testState, setTestState] = useState('IDLE')

  // Auto-play timer effect
  useEffect(() => {
    if (autoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setActiveStepIndex(prev => (prev >= 6 ? 1 : prev + 1))
      }, 2600)
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [autoPlaying])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Open modal for connecting or configuring
  const handleOpenConnect = (connector) => {
    setSelectedConnector(connector)
    setModalHost(connector.defaultHost)
    setModalAuthKey(connector.status === 'CONNECTED' ? 'apex-prod-key-authenticated' : 'env.SECRET_TOKEN_AUTH')
    setModalSyncMode(connector.status === 'CONNECTED' ? 'realtime' : 'webhook')
    setModalEvents(connector.events ? [...connector.events] : [])
    setTestState('IDLE')
  }

  // Handle Handshake Test inside modal
  const handleTestHandshake = () => {
    setTestState('TESTING')
    setTimeout(() => {
      setTestState('SUCCESS')
    }, 1100)
  }

  // Handle Save / Connect inside modal
  const handleConfirmConnect = () => {
    if (!selectedConnector) return
    const isNowConnected = selectedConnector.status !== 'CONNECTED'

    setConnectors(prev => prev.map(c => {
      if (c.id === selectedConnector.id) {
        return {
          ...c,
          status: isNowConnected ? 'CONNECTED' : 'DISCONNECTED',
          defaultHost: modalHost,
          events: modalEvents,
        }
      }
      return c
    }))

    showToast(
      isNowConnected
        ? `✓ Successfully connected to ${selectedConnector.name}! Live event streaming enabled.`
        : `Disconnected from ${selectedConnector.name}.`
    )
    setSelectedConnector(null)
  }

  // Counts
  const connectedCount = connectors.filter(c => c.status === 'CONNECTED').length
  const disconnectedCount = connectors.filter(c => c.status === 'DISCONNECTED').length
  const totalEventsCount = connectors.reduce((acc, c) => acc + (c.eventsCount || 0), 0)

  // Filtered Connectors list
  const filteredConnectors = useMemo(() => {
    return connectors.filter(c => {
      if (categoryFilter === 'CONNECTED' && c.status !== 'CONNECTED') return false
      if (categoryFilter === 'DISCONNECTED' && c.status !== 'DISCONNECTED') return false
      if (categoryFilter === 'DATABASE' && !c.category.toLowerCase().includes('database') && !c.category.toLowerCase().includes('warehouse')) return false
      if (categoryFilter === 'ERP' && !c.category.toLowerCase().includes('erp') && !c.category.toLowerCase().includes('mes')) return false
      if (categoryFilter === 'BI' && !c.category.toLowerCase().includes('reporting') && !c.category.toLowerCase().includes('messaging')) return false
      if (categoryFilter === 'LOGISTICS' && !c.category.toLowerCase().includes('hardware') && !c.category.toLowerCase().includes('tms') && !c.category.toLowerCase().includes('lakebase')) return false

      if (searchTerm) {
        const query = searchTerm.toLowerCase()
        const matchName = c.name.toLowerCase().includes(query)
        const matchCat = c.category.toLowerCase().includes(query)
        const matchDesc = c.description.toLowerCase().includes(query)
        const matchCode = c.code.toLowerCase().includes(query)
        return matchName || matchCat || matchDesc || matchCode
      }
      return true
    })
  }, [connectors, categoryFilter, searchTerm])

  // Field mappings list for data dictionary
  const allFieldMappings = useMemo(() => {
    return connectors.flatMap(c => (c.fields || []).map(f => ({
      ...f,
      systemId: c.id,
      systemCode: c.code,
      systemName: c.name,
      badgeColor: c.badgeColor,
      status: c.status,
    }))).filter(f => {
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        f.source.toLowerCase().includes(q) ||
        f.target.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.systemName.toLowerCase().includes(q)
      )
    })
  }, [connectors, searchTerm])

  const currentStep = AGENT_WORKFLOW_STEPS.find(s => s.step === activeStepIndex) || AGENT_WORKFLOW_STEPS[0]

  return (
    <div
      className="content data-integrations-view"
      style={{
        padding: '16px 20px 48px',
        background: 'var(--bg-main, #f8fafc)',
        minHeight: '100vh',
        color: 'var(--text-primary, #0f172a)',
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            animation: 'slideIn 0.2s ease',
          }}
        >
          <Sparkles size={14} color="#38bdf8" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================== TOP HEADER & INTEGRATION TELEMETRY ===================== */}
      <div
        className="panel"
        style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '14px',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
              flexShrink: 0,
            }}
          >
            <Database size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Data Source Integrations &amp; Agent Output Pipeline
              </h1>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ● {connectedCount} ACTIVE / {connectors.length} TOTAL CONNECTORS
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                }}
              >
                {totalEventsCount} EVENTS AVAILABLE
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Connect your enterprise systems &amp; watch how the Autonomous Agent turns raw input data into actionable application outputs.
            </p>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-subtle, #f1f5f9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <button
              type="button"
              onClick={() => setViewSection('connectors')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 0,
                fontSize: '11px',
                fontWeight: viewSection === 'connectors' ? 700 : 500,
                background: viewSection === 'connectors' ? '#ffffff' : 'transparent',
                color: viewSection === 'connectors' ? '#6366f1' : 'var(--text-secondary)',
                boxShadow: viewSection === 'connectors' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              Connectors Grid ({connectors.length})
            </button>
            <button
              type="button"
              onClick={() => setViewSection('agent_workflow')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 0,
                fontSize: '11px',
                fontWeight: viewSection === 'agent_workflow' ? 700 : 500,
                background: viewSection === 'agent_workflow' ? '#ffffff' : 'transparent',
                color: viewSection === 'agent_workflow' ? '#f59e0b' : 'var(--text-secondary)',
                boxShadow: viewSection === 'agent_workflow' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} color="#f59e0b" />
              <span>Agent Output Flow (1–6)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewSection('pipeline')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 0,
                fontSize: '11px',
                fontWeight: viewSection === 'pipeline' ? 700 : 500,
                background: viewSection === 'pipeline' ? '#ffffff' : 'transparent',
                color: viewSection === 'pipeline' ? '#0ea5e9' : 'var(--text-secondary)',
                boxShadow: viewSection === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              Pipeline Architecture
            </button>
            <button
              type="button"
              onClick={() => setViewSection('dictionary')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 0,
                fontSize: '11px',
                fontWeight: viewSection === 'dictionary' ? 700 : 500,
                background: viewSection === 'dictionary' ? '#ffffff' : 'transparent',
                color: viewSection === 'dictionary' ? '#10b981' : 'var(--text-secondary)',
                boxShadow: viewSection === 'dictionary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
              }}
            >
              Data Dictionary ({allFieldMappings.length})
            </button>
          </div>

          <button
            onClick={() => onNavigate?.('overview')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span>Operations Dashboard</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ===================== VIEW A: 6-STEP AUTONOMOUS AGENT DECISION PIPELINE (EXACT VISUAL FROM USER IMAGE) ===================== */}
      {(viewSection === 'agent_workflow' || viewSection === 'connectors') && (
        <div
          className="panel"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            marginBottom: '18px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Header of 6-Step Stepper */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Autonomous Agent Workflow: How Input Data Becomes Application Outputs
                </h2>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#d97706',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  6-STAGE LIFECYCLE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                Follows the exact 6-step reasoning cycle: Collect ➔ Analyse ➔ Detect ➔ Calculate ➔ Generate ➔ Planner Approval &amp; Action
              </p>
            </div>

            {/* Auto-Play Simulation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setAutoPlaying(!autoPlaying)}
                className={autoPlaying ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '7px',
                }}
              >
                {autoPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{autoPlaying ? 'Pause Simulation' : 'Auto-Play Workflow'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveStepIndex(1); setAutoPlaying(false); }}
                className="btn-secondary"
                style={{ padding: '5px 8px', fontSize: '11px' }}
                title="Reset to Step 1"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* 2-Column Layout: Left (Exact Stepper from Image) & Right (Interactive Output Terminal) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 360px) minmax(0, 1fr)',
              gap: '18px',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN: EXACT VERTICAL 6-STEPPER (MIRRORS USER IMAGE) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '10px 10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
              }}
            >
              {AGENT_WORKFLOW_STEPS.map((st, idx) => {
                const isSelected = activeStepIndex === st.step
                const isPast = activeStepIndex > st.step
                const isLast = idx === AGENT_WORKFLOW_STEPS.length - 1

                return (
                  <div
                    key={st.step}
                    onClick={() => { setActiveStepIndex(st.step); setAutoPlaying(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                      transition: 'all 0.18s ease',
                      marginBottom: isLast ? 0 : '5px',
                    }}
                  >
                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '22px',
                          top: '30px',
                          bottom: '-12px',
                          width: '2px',
                          background: isPast ? '#0ea5e9' : '#e2e8f0',
                          zIndex: 1,
                          transition: 'background 0.3s ease',
                        }}
                      />
                    )}

                    {/* Circular Step Badge (Exact 1, 2, 3... circle) */}
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isSelected
                          ? st.color
                          : isPast
                          ? '#e0f2fe'
                          : '#f1f5f9',
                        color: isSelected
                          ? '#ffffff'
                          : isPast
                          ? '#0284c7'
                          : '#64748b',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: isSelected
                          ? `2px solid #ffffff`
                          : isPast
                          ? `1px solid #bae6fd`
                          : '1px solid #e2e8f0',
                        boxShadow: isSelected ? `0 0 8px ${st.color}55` : 'none',
                        zIndex: 2,
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {st.step}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: isSelected ? st.color : '#0f172a',
                            lineHeight: '1.3',
                          }}
                        >
                          {st.title}
                        </b>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: `${st.color}20`,
                              color: st.color,
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          fontSize: '10.5px',
                          color: '#64748b',
                          lineHeight: '1.35',
                        }}
                      >
                        {st.subtitle}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* RIGHT COLUMN: INTERACTIVE AGENT OUTPUT DATA TERMINAL */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: `1px solid ${currentStep.color}40`,
                boxShadow: `0 4px 18px ${currentStep.color}15`,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Terminal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '5px',
                      background: `${currentStep.color}15`,
                      color: currentStep.color,
                      border: `1px solid ${currentStep.color}35`,
                    }}
                  >
                    {currentStep.badge}
                  </span>
                  <b style={{ fontSize: '12.5px', color: '#0f172a' }}>
                    {currentStep.title}
                  </b>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {currentStep.sourceSystems.map((sys, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sub-Section 1: Live Input Data Received from Connected Sources */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Database size={11} color="#0ea5e9" /> 1. Input Data Ingested from Connected Sources:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '5px' }}>
                  {currentStep.inputData.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '10px',
                      }}
                    >
                      <span style={{ color: '#0ea5e9', fontWeight: 700, display: 'block', marginBottom: '1px' }}>
                        {d.key}:
                      </span>
                      <span style={{ color: '#1e293b', fontWeight: 500 }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Section 2: Agent Heuristics & Decision Logic */}
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '10.5px',
                }}
              >
                <b style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Cpu size={11} /> 2. Agent Decision Heuristics &amp; Evaluation Logic:
                </b>
                <span style={{ color: '#334155', lineHeight: '1.35' }}>
                  {currentStep.agentLogic}
                </span>
              </div>

              {/* Sub-Section 3: Application Output Data Generated */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} color="#10b981" /> 3. Output Data Generated for the Application:
                  </span>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>
                    Destination: <b style={{ color: '#0f172a' }}>{currentStep.appDestination}</b>
                  </span>
                </div>

                {/* Formatted JSON Output Console */}
                <div
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '10.5px',
                    lineHeight: '1.45',
                    overflowX: 'auto',
                    border: '1px solid #1e293b',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '9px', marginBottom: '3px', borderBottom: '1px solid #334155', paddingBottom: '2px' }}>
                    // OUTPUT DATA PAYLOAD · EMITTED TO APPLICATION DASHBOARD STATE:
                  </div>
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(currentStep.outputData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Button to inspect output in app */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Step {currentStep.step} of 6 active
                </span>

                <button
                  type="button"
                  onClick={() => onNavigate?.(currentStep.navTarget)}
                  className="btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{currentStep.navText}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW B: THE INTEGRATIONS CONNECTORS GRID (MATCHES USER IMAGE) ===================== */}
      {viewSection === 'connectors' && (
        <div>
          {/* Filter Pills & Search Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {/* Category Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All (${connectors.length})` },
                { id: 'CONNECTED', label: `Connected (${connectedCount})` },
                { id: 'DISCONNECTED', label: `Not Connected (${disconnectedCount})` },
                { id: 'DATABASE', label: 'Databases & Warehouses' },
                { id: 'ERP', label: 'ERP & MES' },
                { id: 'BI', label: 'BI & Messaging' },
                { id: 'LOGISTICS', label: 'Weighbridge & TMS' },
              ].map(p => {
                const active = categoryFilter === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCategoryFilter(p.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: active ? 700 : 500,
                      background: active ? '#6366f1' : 'var(--bg-card, #ffffff)',
                      color: active ? '#ffffff' : 'var(--text-secondary, #475569)',
                      border: `1px solid ${active ? '#6366f1' : 'var(--border-color, #e2e8f0)'}`,
                      boxShadow: active ? '0 2px 6px rgba(99, 102, 241, 0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search connectors or events..."
                style={{
                  width: '100%',
                  height: '30px',
                  paddingLeft: '28px',
                  paddingRight: '10px',
                  fontSize: '11px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            {filteredConnectors.map((c) => {
              const isConnected = c.status === 'CONNECTED'
              return (
                <div
                  key={c.id}
                  className="connector-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px 16px 14px',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '168px',
                    position: 'relative',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Top Header: Badge + Name */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                      {/* Stylized Logo Badge */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '7px',
                          background: c.badgeColor,
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: c.code.length > 2 ? '10px' : '12px',
                          letterSpacing: '-0.3px',
                          boxShadow: `0 2px 6px ${c.badgeColor}40`,
                          flexShrink: 0,
                          userSelect: 'none',
                        }}
                      >
                        {c.code}
                      </div>

                      {/* Connector Name */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#0f172a',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={c.name}
                        >
                          {c.name}
                        </b>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div style={{ marginBottom: '8px' }}>
                      {isConnected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#16a34a',
                              boxShadow: '0 0 6px #16a34a',
                            }}
                          />
                          Connected
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#94a3b8',
                            }}
                          />
                          Not connected
                        </span>
                      )}
                    </div>

                    {/* Subtitle Category Description */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        lineHeight: '1.35',
                        minHeight: '28px',
                        marginBottom: '6px',
                      }}
                    >
                      {c.category}
                    </div>

                    {/* Events Available */}
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: '#94a3b8',
                        fontWeight: 500,
                        marginBottom: '12px',
                      }}
                    >
                      {c.eventsCount} events available
                    </div>
                  </div>

                  {/* Connect / Action Button */}
                  <div>
                    {isConnected ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenConnect(c)}
                          style={{
                            flex: 1,
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '20px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Check size={12} /> Connected
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenConnect(c)}
                          title="Configure connection settings"
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '20px',
                            padding: '5px 8px',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Settings size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenConnect(c)}
                        style={{
                          background: '#6366f1',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '5px 18px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
                          transition: 'all 0.15s ease',
                          width: 'fit-content',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#4f46e5'
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(99, 102, 241, 0.45)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#6366f1'
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW C: 4-STAGE INGESTION PIPELINE ARCHITECTURE ===================== */}
      {(viewSection === 'pipeline') && (
        <div
          className="panel"
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '16px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} color="#0ea5e9" />
                <b style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Autonomous Logistics Data Flow &amp; Ingestion Architecture
                </b>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                How connected enterprise data flows through secure protocols into Neon Lakebase PostgreSQL &amp; the Autonomous Agent
              </span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              ZERO SENSOR FABRICATION
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {[
              {
                num: '1',
                title: 'Enterprise Sources',
                badge: '14 CONNECTORS',
                color: '#6366f1',
                icon: Database,
                desc: 'SAP, Oracle, MySQL, HANA, Siemens MES, Weighbridge WB-01, Manhattan WMS & TMS GPS',
                detail: 'Transmits master records, lots & weights'
              },
              {
                num: '2',
                title: 'Ingestion Layer',
                badge: 'TLS 1.3 / mTLS',
                color: '#8b5cf6',
                icon: Cpu,
                desc: 'RESTful Webhooks, Kafka Event Stream, Modbus TCP / RS-232 & MQTT IoT Gateways',
                detail: 'Average handshake latency < 24ms'
              },
              {
                num: '3',
                title: 'Neon Lakebase Postgres',
                badge: 'ACID RELATIONAL',
                color: '#0d9488',
                icon: HardDrive,
                desc: 'Normalized transactional storage, row-level RBAC security, zero schema drift & instant branching',
                detail: 'Live database sync with pooling'
              },
              {
                num: '4',
                title: 'Autonomous Dispatch AI',
                badge: 'ACTION ENGINE',
                color: '#f59e0b',
                icon: Sparkles,
                desc: 'Domo AI predictive delay score, 6-bay dock staging, weighbridge gate interlock & stuck-vehicle email alerts',
                detail: 'Automated executive dispatch scan'
              },
            ].map((st, i) => {
              const Icon = st.icon
              return (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '5px', background: `${st.color}15`, color: st.color }}>
                      STAGE {st.num} · {st.badge}
                    </span>
                    <Icon size={14} color={st.color} />
                  </div>
                  <b style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>{st.title}</b>
                  <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: '1.35' }}>
                    {st.desc}
                  </p>
                  <div style={{ fontSize: '9.5px', color: 'var(--teal)', fontWeight: 600, marginTop: '4px' }}>
                    ● {st.detail}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW D: FIELD-LEVEL DATA DICTIONARY ===================== */}
      {(viewSection === 'dictionary') && (
        <div
          className="panel"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Table2 size={15} color="#0ea5e9" />
                <b style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Data Dictionary: Field-Level Mapping &amp; Integrity Validation
                </b>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Shows how raw source system keys map to Neon PostgreSQL columns with strict data type integrity
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Showing {allFieldMappings.length} mapped attributes
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Connector</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Source System Field</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Data Type</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Target Neon Column</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Sample Real Data</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Integrity Rule &amp; Business Value</th>
                </tr>
              </thead>
              <tbody>
                {allFieldMappings.map((f, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      background: i % 2 === 0 ? 'var(--bg-card, #ffffff)' : 'var(--bg-subtle, #f8fafc)',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 700,
                          color: f.badgeColor,
                          background: `${f.badgeColor}12`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                        }}
                      >
                        {f.systemName}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {f.source}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: '10.5px' }}>
                      <code>{f.type}</code>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'var(--teal)', fontWeight: 600 }}>
                      {f.target}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <span style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                        {f.sample}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500 }}>{f.desc}</div>
                      <div style={{ fontSize: '9.5px', color: '#16a34a', fontWeight: 700, marginTop: '1px' }}>
                        ✓ {f.rule}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== SECURITY & ENTERPRISE COMPLIANCE SUMMARY ===================== */}
      <div
        style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="#16a34a" />
          <div>
            <b style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              Enterprise Integration Security, Zero Sensor Fabrication &amp; Audit Integrity
            </b>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              All connectors operate over TLS 1.3 / mTLS encryption, AES-256 rest encryption on Neon Lakebase, and strict JWT role separation.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: '#ffffff', border: '1px solid var(--border-color)', color: '#16a34a' }}>
            ✓ TLS 1.3 In-Transit
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: '#ffffff', border: '1px solid var(--border-color)', color: '#0ea5e9' }}>
            ✓ Neon Lakebase Branching
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: '#ffffff', border: '1px solid var(--border-color)', color: '#8b5cf6' }}>
            ✓ Row-Level RBAC
          </span>
        </div>
      </div>

      {/* ===================== INTERACTIVE CONNECTION MODAL ===================== */}
      {selectedConnector && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedConnector(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'modalFadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: selectedConnector.badgeColor,
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: selectedConnector.code.length > 2 ? '11px' : '13px',
                  }}
                >
                  {selectedConnector.code}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Connect to {selectedConnector.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedConnector.category}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedConnector(null)}
                style={{
                  background: 'transparent',
                  border: 0,
                  fontSize: '18px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 16px', fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                {selectedConnector.description}
              </p>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Protocol Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b' }}>Communication Protocol:</span>
                  <b style={{ color: '#0f172a' }}>{selectedConnector.protocol}</b>
                </div>

                {/* Host / Endpoint */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Host / Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={modalHost}
                    onChange={(e) => setModalHost(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      borderRadius: '7px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* API Key / Token */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      Access Token / Secret Credential
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalShowPassword(!modalShowPassword)}
                      style={{ background: 'transparent', border: 0, fontSize: '10.5px', color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      {modalShowPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                      {modalShowPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={modalShowPassword ? 'text' : 'password'}
                    value={modalAuthKey}
                    onChange={(e) => setModalAuthKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      borderRadius: '7px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Sync Mode */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Data Synchronization Mode
                  </label>
                  <select
                    value={modalSyncMode}
                    onChange={(e) => setModalSyncMode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      borderRadius: '7px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  >
                    <option value="realtime">Real-Time Event Stream &amp; CDC (Sub-second)</option>
                    <option value="webhook">Automated Webhook Push on State Change</option>
                    <option value="polling_15s">High-Frequency Polling (Every 15 Seconds)</option>
                    <option value="hourly">Hourly Batch Synchronization</option>
                  </select>
                </div>

                {/* Subscribed Events Checklist */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Subscribed Events ({modalEvents.length} Available)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                    {modalEvents.map((ev, idx) => (
                      <label key={ev.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={ev.selected}
                          onChange={(e) => {
                            const updated = [...modalEvents]
                            updated[idx].selected = e.target.checked
                            setModalEvents(updated)
                          }}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <b style={{ color: '#0f172a' }}>{ev.name}</b>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{ev.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Handshake Test Feedback */}
                {testState === 'TESTING' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={12} className="spin" />
                    <span>Performing cryptographic TLS handshake and checking socket port...</span>
                  </div>
                )}
                {testState === 'SUCCESS' && (
                  <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} />
                    <span>Handshake 200 OK! Connected to host. Latency: {selectedConnector.latency || '18ms'}.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={handleTestHandshake}
                disabled={testState === 'TESTING'}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  padding: '7px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Zap size={12} /> Test Handshake
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedConnector(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    padding: '7px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmConnect}
                  style={{
                    background: selectedConnector.status === 'CONNECTED' ? '#dc2626' : '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '7px 16px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: selectedConnector.status === 'CONNECTED' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {selectedConnector.status === 'CONNECTED' ? 'Disconnect System' : 'Connect System'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
