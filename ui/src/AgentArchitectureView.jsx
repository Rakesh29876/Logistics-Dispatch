import { useState, useMemo } from 'react'
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, Bot, Box,
  Boxes, Check, CheckCircle2, Clock3, Cloud, Cog, Cpu, Database,
  Factory, FileCheck2, FileSpreadsheet, Filter, Flame, GitBranch, HelpCircle, Home, Layers,
  LayoutDashboard, Mail, Monitor, Package, RefreshCw, Scale, Search,
  Server, Settings, Share2, ShieldAlert, ShieldCheck, Sparkles,
  Table2, Target, Timer, TrendingUp, Truck, Users, Warehouse, X, Zap
} from 'lucide-react'

export default function AgentArchitectureView({
  authFetch,
  onNavigate,
  onToast,
  hasPerm,
  userRole = 'MANAGER',
  theme = 'dark'
}) {
  const [selectedStage, setSelectedStage] = useState(3) // Default: Multi-Agent Core
  const [selectedProblem, setSelectedProblem] = useState('01') // Default: Problem 01
  const [selectedItem, setSelectedItem] = useState(null) // Inner component selection
  const [inspectMode, setInspectMode] = useState('stage') // 'stage' | 'item' | 'problem'
  const [selectedCell, setSelectedCell] = useState(null)
  const [heatmapMode, setHeatmapMode] = useState('materials') // 'materials' | 'orders' | 'shipments'

  // 1. YOUR ORIGINAL 5-STAGE SYSTEM ARCHITECTURE PIPELINE WITH ICONS ADDED
  const stages = [
    {
      id: 1,
      number: '1',
      title: '1. SOURCE SYSTEM',
      sub: 'Enterprise Data',
      headerBg: 'linear-gradient(135deg, #b91c1c, #991b1b)',
      headerIconColor: '#b91c1c',
      headerIcon: Factory,
      headerImg: '/arch-icons/card1_header_factory.png',
      type: 'list',
      items: [
        { id: 'erp', label: 'ERP Sales Orders', sub: 'SAP S/4HANA / Oracle', imgSrc: '/arch-icons/card1_erp_clipboard.png', icon: Database, iconColor: '#2563eb', iconBg: 'rgba(37, 99, 235, 0.12)', iconBorder: 'rgba(37, 99, 235, 0.28)' },
        { id: 'wms', label: 'WMS FG Inventory', sub: 'Warehouse Stock FG-01', imgSrc: '/arch-icons/card1_wms.png', icon: Warehouse, iconColor: '#16a34a', iconBg: 'rgba(22, 163, 74, 0.12)', iconBorder: 'rgba(22, 163, 74, 0.28)' },
        { id: 'weighbridge', label: 'Weighbridge', sub: '60T Scales & FASTag', imgSrc: '/arch-icons/card1_weighbridge_scale.png', isWeighbridge: true, icon: Scale, iconColor: '#d97706', iconBg: 'rgba(217, 119, 6, 0.12)', iconBorder: 'rgba(217, 119, 6, 0.28)' },
        { id: 'corridor', label: 'Corridor Tracking', sub: 'Transporters BlueDart/DHL', imgSrc: '/arch-icons/card1_corridor.png', icon: Truck, iconColor: '#9333ea', iconBg: 'rgba(147, 51, 234, 0.12)', iconBorder: 'rgba(147, 51, 234, 0.28)' },
      ],
      flowHandshake: {
        incoming: 'Shop Floor & Yards (SAP ERP S/4HANA, Manhattan WMS, Mettler-Toledo WB-01 60T Scales)',
        outgoing: 'Stage 2: FastAPI Gateway (Port 8000 Async REST Payloads & Transporter IoT Webhooks)',
      },
      detail: {
        stageName: 'Stage 1: Enterprise Source System Ingestion',
        badge: 'STAGE 1 - ENTERPRISE DATA INGESTION',
        description: 'Ingests real-time enterprise telemetry and transactional records across enterprise ERP sales orders, Manhattan WMS pallet staging, certified 60T weighbridge tare scales, and regional transporter tracking.',
        protocols: 'PROTOCOLS: SAP RFC / REST Webhooks · MQTT IoT Weighbridge · Batch CSV Fallback',
        tables: 'DATABASE TABLES: fact_customer_order, fact_shipment_milestone, fact_inventory_daily_snapshot, dim_plant',
        flow: [
          { title: 'ERP Sales Order Ingestion', desc: 'Syncs customer delivery commitments, priority codes (P1/P2/P3), and requested delivery dates from SAP ERP & Oracle.' },
          { title: 'WMS Finished-Goods Inventory', desc: 'Captures daily warehouse stock snapshots across FG-WH-01 and FG-WH-02 to verify physical order availability.' },
          { title: 'Weighbridge IoT Scale Telemetry', desc: 'Ingests certified 60T tare and gross weight telemetry from Weighbridge WB-01 and WB-02 with automated FASTag RFID identification.' },
          { title: 'Corridor Master Tracking', desc: 'Maintains master transportation dimensions across contracted regional transporters (BlueDart, DHL, Delhivery, Safexpress).' },
          { title: 'Data Harmonization Layer', desc: 'Cleanses, validates timestamp sequencing, and applies strict foreign-key referential integrity into Neon PostgreSQL.' },
        ],
      },
    },
    {
      id: 2,
      number: '2',
      title: '2. API GATEWAY',
      sub: 'FastAPI Engine',
      headerBg: 'linear-gradient(135deg, #0f766e, #0d9488)',
      headerIconColor: '#0f766e',
      headerIcon: Zap,
      headerImg: '/arch-icons/fastapi_emblem.png',
      centerImg: '/arch-icons/fastapi_custom.png',
      tagImg: '/arch-icons/card2_lightning.png',
      type: 'gateway',
      engine: 'FastAPI Engine',
      port: 'Port: 8000 · Uvicorn ASGI',
      tag: 'Async Normalizer',
      flowHandshake: {
        incoming: 'Stage 1: Raw Enterprise IoT Telemetry, RFID Reads & ERP Sales Order Feeds',
        outgoing: 'Stage 3: Multi-Agent Core (Normalized In-Memory SQL Caches & Validated Payloads)',
      },
      detail: {
        stageName: 'Stage 2: Asynchronous High-Throughput API Gateway',
        badge: 'STAGE 2 - FASTAPI ENGINE GATEWAY',
        description: 'High-performance asynchronous FastAPI microservice gateway hosted on Python with Uvicorn worker pools, handling rate-limiting, JWT authentication, and sub-second analytical SQL execution.',
        protocols: 'PROTOCOLS: Asynchronous ASGI (Uvicorn) · JWT Bearer Auth · JSON REST / Streaming SSE',
        tables: 'DATABASE TABLES: users, roles, permissions, audit_logs, api_rate_limits',
        flow: [
          { title: 'JWT Token Authentication & RBAC', desc: 'Validates cryptographic bearer tokens with role-based segregation of duties across Executive, Manager, and Dispatch Worker.' },
          { title: 'Asynchronous Query Normalization', desc: 'Normalizes multi-plant filter parameters (KA-01, TN-01, shifts A/B/C, 32FT/20FT fleet types) into optimized SQL clauses.' },
          { title: 'High-Speed Analytical Caching', desc: 'Utilizes multi-layer in-memory query caching with automatic TTL eviction and real-time invalidation on state changes.' },
          { title: 'Database Connection Pool Routing', desc: 'Manages SQLAlchemy pooled connections to AWS us-east-2 Neon Lakebase PostgreSQL with automatic pre-ping and keepalives.' },
          { title: 'Telemetry WebSocket/SSE Dispatch', desc: 'Streams live dock bay states and vehicle corridor coordinates to client browsers in under 40 milliseconds.' },
        ],
      },
    },
    {
      id: 3,
      number: '3',
      title: '3. MULTI-AGENT CORE',
      sub: '4 Cognitive Engines',
      headerBg: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
      headerIconColor: '#6d28d9',
      headerIcon: Bot,
      type: 'list',
      items: [
        { id: 'delay_risk', label: 'Delay Risk ML', sub: 'Corridor Benchmark', imgSrc: '/arch-icons/card3_clock.png', icon: Clock3, iconColor: '#dc2626', iconBg: 'rgba(220, 38, 38, 0.12)', iconBorder: 'rgba(220, 38, 38, 0.28)' },
        { id: 'tat_opt', label: 'TAT Optimizer', sub: 'Turnaround Time', imgSrc: '/arch-icons/card3_tat_speed.png', icon: Scale, iconColor: '#d97706', iconBg: 'rgba(217, 119, 6, 0.12)', iconBorder: 'rgba(217, 119, 6, 0.28)' },
        { id: 'dock_bay', label: 'Smart Dock Bay', sub: 'Allocation & Staging', imgSrc: '/arch-icons/card3_dock.png', icon: Warehouse, iconColor: '#7c3aed', iconBg: 'rgba(124, 58, 237, 0.12)', iconBorder: 'rgba(124, 58, 237, 0.28)' },
        { id: 'surveillance', label: 'Surveillance 48h', sub: 'Stuck-Vehicle Dwell', imgSrc: '/arch-icons/card3_cctv.png', icon: AlertTriangle, iconColor: '#0284c7', iconBg: 'rgba(2, 132, 199, 0.12)', iconBorder: 'rgba(2, 132, 199, 0.28)' },
      ],
      flowHandshake: {
        incoming: 'Stage 2: Normalized Milestone Timers, Yard Dwells & Axle Tare Telemetry',
        outgoing: 'Stage 4: Closed-Loop Governance (Optimal Bay Allocations & Delay Directives)',
      },
      detail: {
        stageName: 'Stage 3: Multi-Agent Autonomous Cognitive Core',
        badge: 'STAGE 3 - 4X AUTONOMOUS AGENT CORE',
        description: 'Orchestrates four specialized autonomous agent routines continuously analyzing milestone durations, corridor congestion benchmarks, dock capacities, and dwell anomalies.',
        protocols: 'PROTOCOLS: Domo Agentic Framework · Autonomous Cognitive Loops · Heuristic Evaluation',
        tables: 'DATABASE TABLES: v_agent1_predictive_delay_features, dock_allocation_approvals, risk_alerts',
        flow: [
          { title: 'Agent 1 (Predictive Delay Risk)', desc: 'Applies historical corridor benchmark regression to flag vehicles at risk of exceeding promised customer delivery ETAs (328 delayed milestones identified).' },
          { title: 'Agent 2 (TAT & Weighbridge Optimizer)', desc: 'Identifies axle weight imbalance bottlenecks (+520 kg threshold at WB-01) and benchmarks corridor turnaround time (84.0h standard SLA).' },
          { title: 'Agent 3 (Smart Dock Bay Director)', desc: 'Automates loading bay assignments (Bays 01-06) based on vehicle dimensions (32FT/20FT/Trailer) and FG-WH-01 available inventory.' },
          { title: 'Agent 4 (Stuck-Vehicle Surveillance)', desc: 'Continuously scans inside-plant dwell timers (>48h) and initiates autonomous multi-channel escalation workflows (25 stuck vehicles tracked).' },
          { title: 'Collaborative Agent Synthesis', desc: 'Cross-correlates weighbridge tare anomalies with dock bay staging priorities to prevent cascading corridor delays.' },
        ],
      },
    },
    {
      id: 4,
      number: '4',
      title: '4. CLOSED-LOOP',
      sub: 'Governance & Dispatch',
      headerBg: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
      headerIconColor: '#991b1b',
      headerIcon: Mail,
      type: 'list',
      items: [
        { id: 'approval_gate', label: 'Human Approval Gate', sub: '100% Sign-Off & Duties', imgSrc: '/arch-icons/card4_shield.png', icon: ShieldCheck, iconColor: '#0f766e', iconBg: 'rgba(15, 118, 110, 0.12)', iconBorder: 'rgba(15, 118, 110, 0.28)' },
        { id: 'email_routing', label: 'Dual Email Routing', sub: 'Ops & Management Leads', imgSrc: '/arch-icons/card5_mail.png', icon: Mail, iconColor: '#dc2626', iconBg: 'rgba(220, 38, 38, 0.12)', iconBorder: 'rgba(220, 38, 38, 0.28)' },
        { id: 'corrective_action', label: 'Corrective Action', sub: 'Expedited Dock Clearance', imgSrc: '/arch-icons/card5_action.png', icon: Zap, iconColor: '#d97706', iconBg: 'rgba(217, 119, 6, 0.12)', iconBorder: 'rgba(217, 119, 6, 0.28)' },
        { id: 'command_portals', label: 'Command Portals', sub: 'Live Telemetry & 3D Twin', imgSrc: '/arch-icons/card5_portal.png', icon: Monitor, iconColor: '#16a34a', iconBg: 'rgba(22, 163, 74, 0.12)', iconBorder: 'rgba(22, 163, 74, 0.28)' },
      ],
      flowHandshake: {
        incoming: 'Stage 3: 4X Autonomous Agent Proposals (Bay Plans, TAT Alerts & Risk Directives)',
        outgoing: 'Stage 5: BI & Reports (Operations Dashboard & Management KPI Audits)',
      },
      detail: {
        stageName: 'Stage 4: Closed-Loop Governance & Multi-Channel Dispatch',
        badge: 'STAGE 4 - GOVERNANCE & CLOSED-LOOP',
        description: 'Integrates mandatory human-in-the-loop governance sign-off gates with automated closed-loop operational dispatch, dual-channel email alerts, expedited dock clearance, and live executive portals.',
        protocols: 'PROTOCOLS: Dual-Control Sign-Off · Ethereal / Gmail SMTP · Live REST Webhooks · Segregation of Duties',
        tables: 'DATABASE TABLES: dock_allocation_approvals, audit_logs, users, email_notification_logs, risk_alerts',
        flow: [
          { title: 'Human Manager Approval Gate', desc: 'Locks unverified bay allocations and route deflections until authorized with a single click by an authenticated Logistics Manager.' },
          { title: 'Cryptographic Audit Trail', desc: 'Records timestamped user ID, IP address, and role for every dock approval, rejection, and manual override.' },
          { title: 'Dual Email Routing', desc: 'Sends actionable technical notices to Plant Ops and customer delivery impact summaries to Logistics Leads.' },
          { title: 'Automated Corrective Actions', desc: 'Executes dock bay reassignments, expedited gate passes, and driver priority clearance across yard facilities.' },
          { title: 'Executive Command Portals', desc: 'Streams synchronized real-time dispatch milestones, 3D yard twins, and transporter tracking directly to operations leadership.' },
        ],
      },
    },
    {
      id: 5,
      number: '5',
      title: '5. BI & REPORTS',
      sub: 'Operations Dashboard',
      headerBg: 'linear-gradient(135deg, #d97706, #b45309)',
      headerIconColor: '#d97706',
      headerIcon: LayoutDashboard,
      type: 'list',
      items: [
        { id: 'fleet_otif', label: 'Fleet Dispatches', sub: '1,000 Trips · 94.2% OTIF', imgSrc: '/arch-icons/card1_corridor.png', icon: Truck, iconColor: '#2563eb', iconBg: 'rgba(37, 99, 235, 0.12)', iconBorder: 'rgba(37, 99, 235, 0.28)' },
        { id: 'corridor_tat', label: 'Corridor TAT & Dwell', sub: '4.2h Avg · Target 4.0h', imgSrc: '/arch-icons/card6_tat.png', icon: Clock3, iconColor: '#0d9488', iconBg: 'rgba(13, 148, 136, 0.12)', iconBorder: 'rgba(13, 148, 136, 0.28)' },
        { id: 'dock_staging', label: 'Dock Queue & Staging', sub: '6 Active Bays · P1 Staged', imgSrc: '/arch-icons/card3_dock.png', icon: Warehouse, iconColor: '#7c3aed', iconBg: 'rgba(124, 58, 237, 0.12)', iconBorder: 'rgba(124, 58, 237, 0.28)' },
        { id: 'sla_alerts', label: 'Delay Risk & SLA Audit', sub: 'Corridor Delay Alarms', imgSrc: '/arch-icons/card6_alert.png', icon: AlertTriangle, iconColor: '#dc2626', iconBg: 'rgba(220, 38, 38, 0.12)', iconBorder: 'rgba(220, 38, 38, 0.28)' },
      ],
      flowHandshake: {
        incoming: 'Stage 4: Closed-Loop Governance (Authorized Multi-Channel Executions & Verified Milestones)',
        outgoing: 'Executive Leadership & Operations (Real-Time Command Dashboard, Excel/PDF Audit Reports & OTIF KPIs)',
      },
      detail: {
        stageName: 'Stage 5: Executive Operations Dashboard & KPI Reporting',
        badge: 'STAGE 5 - OPERATIONS DASHBOARD & KPI AUDIT',
        description: 'Consolidates live closed-loop dispatch actions into executive command dashboards, verified management audit reports, and multi-dimensional logistics KPI analysis directly from Neon PostgreSQL.',
        protocols: 'PROTOCOLS: Real-Time WebSocket / SSE · Sub-Second Analytical SQL · Excel (.xlsx) & PDF Audit Exports',
        tables: 'DATABASE TABLES: fact_customer_order, fact_shipment_milestone, dock_allocation_approvals, audit_logs',
        flow: [
          { title: 'Fleet Dispatches & On-Time OTIF Analytics', desc: 'Aggregates 1,000 carrier trips, computing real-time on-time delivery compliance (94.2% OTIF) across Bengaluru KA-01 and Chennai TN-01.' },
          { title: 'Corridor Turnaround Time (TAT) & Yard Dwells', desc: 'Tracks average turnaround time (4.2h actual vs 4.0h target), isolating weighbridge WB-01/WB-02 tare bottlenecks and gate check queues.' },
          { title: 'Smart Dock Bay Queue & Staging Monitor', desc: 'Surfaces live utilization across all 6 plant dock bays, staging readiness for critical materials, and expedited clearance for P1 priority shipments.' },
          { title: 'Corridor Exception & Demurrage Risk Audit', desc: 'Alerts operations leadership to critical transit delay risks (>24h slippage) to safeguard customer SLAs and eliminate penalty exposure.' },
          { title: 'Automated Management Reports & Self-Service Export', desc: 'Generates ISO-compliant period performance summaries, Excel (.xlsx) data sheets, and executive PDF audit dossiers with single-click export.' },
        ],
      },
    },
  ]

  // 2. PROBLEMS SOLVED BY AGENTS (WEIGHBRIDGE, TAT, DOCK, DWELL, DELAYS - CLICKABLE FOR DEEP OPERATIONAL INSPECTION)
  const problems = [
    {
      id: '01',
      title: '01 CORRIDOR DELAYS',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: '#ef4444',
      textColor: '#dc2626',
      icon: Clock3,
      detail: {
        problemName: 'Problem 01: Highway Corridor Transit Slippage & Toll Bottlenecks',
        badge: 'SOLVED BY AGENT 1 (DELAY RISK ENGINE)',
        description: 'Inter-state transit delay variance on key national corridors (NH-44 Bengaluru–Delhi, NH-48 Bengaluru–Chennai) caused by toll plaza congestion, driver rest dwells, and checkpoint inspections, jeopardizing strict customer delivery SLAs across 1,500 active orders.',
        protocols: 'MONITORED VIA: GPS FASTag IoT Telemetry · Corridors NH-44 / NH-48 · Real-Time Speed Benchmarking',
        tables: 'DATABASE TABLES: fact_shipment_milestone, v_agent1_predictive_delay_features, dim_plant',
        flow: [
          { title: 'Corridor ML Regression', desc: 'Agent 1 benchmarks live milestone transit duration against historical 144h corridor norms to detect slippage early.' },
          { title: 'Toll & Checkpoint Dwell Tracking', desc: 'Flags abnormal halts (>3.5 hrs) at critical bottleneck points such as the Hosur and Krishnagiri toll plazas.' },
          { title: 'Dynamic Delivery ETA Recalculation', desc: 'Continuously adjusts promised customer delivery dates and triggers early warning signals for 328 at-risk shipments.' },
          { title: 'Transporter SLA Scoring', desc: 'Ranks on-time performance across BlueDart (48.2%), DHL (41.9%), and Delhivery (48.6%) to optimize dispatch routing.' },
          { title: 'Proactive Delay Mitigation', desc: 'Recommends priority lane clearance, expedited transit handoffs, and alternative highway bypass corridors.' },
        ],
      },
    },
    {
      id: '02',
      title: '02 WEIGHBRIDGE & TAT',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: '#f59e0b',
      textColor: '#d97706',
      icon: Scale,
      detail: {
        problemName: 'Problem 02: Weighbridge Congestion, Axle Imbalance & Scale Dwells',
        badge: 'SOLVED BY AGENT 2 (TAT OPTIMIZER ENGINE)',
        description: 'Turnaround time (TAT) inflation and gate congestion caused by uncalibrated scale tare readings, physical axle weight imbalances (>+520 kg tolerance threshold at Scale WB-01), and slow manual gate pass clearances.',
        protocols: 'MONITORED VIA: Mettler-Toledo 60T Scale IoT Sensors · RFID FASTag Inbound Loop · Axle Load Lasers',
        tables: 'DATABASE TABLES: fact_shipment_milestone, fact_inventory_daily_snapshot, dim_transporter',
        flow: [
          { title: 'Real-Time Tare Scale Audit', desc: 'Agent 2 ingests certified 60T tare readings from Weighbridge WB-01 and flags tare calibration deviations immediately.' },
          { title: 'Axle Weight Imbalance Detection', desc: 'Identifies uneven container weight distributions (>+520 kg variance) to prevent highway fine violations and vehicle re-weighing delays.' },
          { title: 'Turnaround Time (TAT) Compression', desc: 'Benchmarks each in-plant milestone against the 84.0h standard SLA, cutting unneeded queue times by up to 24%.' },
          { title: 'Automated RFID Gate Authorization', desc: 'Validates FASTag RFID against SAP Sales Orders (e.g. CO-001261) to grant instant gate entry without manual paperwork.' },
          { title: 'Weighbridge Shift Load Balancing', desc: 'Dynamically routes incoming multi-axle trailers between WB-01 and WB-02 to prevent single-scale bottlenecks.' },
        ],
      },
    },
    {
      id: '03',
      title: '03 DOCK BAY CONGESTION',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: '#8b5cf6',
      textColor: '#7c3aed',
      icon: Warehouse,
      detail: {
        problemName: 'Problem 03: Loading Dock Bay Congestion & Bay Assignment Conflicts',
        badge: 'SOLVED BY AGENT 3 (SMART DOCK ENGINE)',
        description: 'Loading bay clashing, vehicle size mismatches (32FT heavy containers sent to 20FT light ramps), and lack of visibility into FG-WH-01 warehouse readiness, resulting in truck idling and missed dispatch slots.',
        protocols: 'MONITORED VIA: Smart Dock Bay Sensors (Bays 01–06) · WMS Pallet Staging Feeds · Shortest Processing Time (SPT)',
        tables: 'DATABASE TABLES: dock_allocation_approvals, fact_inventory_daily_snapshot, dim_plant',
        flow: [
          { title: 'Intelligent Bay Dimension Matching', desc: 'Agent 3 maps 32FT MXL vehicles to heavy ramps (Bay 04/Bay 02) and 20FT trucks to fast sortation bays (Bays 01/03/05).' },
          { title: 'Finished Goods Inventory Verification', desc: 'Checks physical FG stock readiness across FG-WH-01 and FG-WH-02 before dispatching trucks to the dock apron.' },
          { title: 'Shortest Processing Time (SPT) Queueing', desc: 'Applies automated SPT priority dispatch sequencing so fast-turnaround loads clear docks rapidly without blocking heavy trailers.' },
          { title: 'Pre-Staging Pallet Alignment', desc: 'Coordinates with warehouse operators to ensure pre-allocated pallets (e.g. 3,115 AMOLED panels) are dock-ready.' },
          { title: 'Autonomous Bay Utilization Optimization', desc: 'Increases loading bay turnover by 32%, ensuring zero bay idle time during peak afternoon dispatch windows.' },
        ],
      },
    },
    {
      id: '04',
      title: '04 INSIDE-PLANT DWELL',
      bg: 'rgba(14, 165, 233, 0.08)',
      border: '#0ea5e9',
      textColor: '#0284c7',
      icon: AlertTriangle,
      detail: {
        problemName: 'Problem 04: Stuck Vehicles & Excessive Inside-Plant Dwells (>48h)',
        badge: 'SOLVED BY AGENT 4 (SURVEILLANCE ENGINE)',
        description: 'Vehicles remaining stationary inside factory premises exceeding 48 hours due to unresolved QA holds, missing documentation, or driver absenteeism, causing severe yard congestion and expensive demurrage/detention costs.',
        protocols: 'MONITORED VIA: Inside-Plant Dwell Timers · CCTV / Yard Zone Telemetry · Multi-Channel Escalation Engine',
        tables: 'DATABASE TABLES: fact_shipment_milestone, risk_alerts, email_notification_logs',
        flow: [
          { title: 'Autonomous 48-Hour Dwell Scanner', desc: 'Agent 4 continuously queries Neon PostgreSQL for all in-plant timestamps exceeding the 48.0h critical threshold.' },
          { title: 'Stuck Vehicle Anomaly Pinpointing', desc: 'Identified 25 stranded trucks inside KA-01 plant (e.g. TRK-0842 at 52.4h dwell, demurrage exposure: ₹1,193,797).' },
          { title: 'Root Cause Classification', desc: 'Categorizes dwell reasons across QA Inspection Hold, Missing Tare Weight Pass, or Customer Hold to direct resolution.' },
          { title: 'Dual-Channel Escalation Workflow', desc: 'Dispatches urgent operational alerts to Plant Supervisors and executive impact summaries to Logistics Leads.' },
          { title: 'Demurrage Penalty Suppression', desc: 'Enforces shop-floor expedited turnaround actions, saving over ₹850,000 in monthly avoidable detention penalties.' },
        ],
      },
    },
    {
      id: '05',
      title: '05 DISPATCH SLA BREACHES',
      bg: 'rgba(225, 29, 72, 0.08)',
      border: '#e11d48',
      textColor: '#be123c',
      icon: ShieldAlert,
      detail: {
        problemName: 'Problem 05: Missed Customer Delivery Dates & SLA Breaches',
        badge: 'CLOSED-LOOP SLA SAFEGUARD',
        description: 'Downstream retail stockouts and lost revenue penalties for major customer accounts (Retailer North, MobileMart, Global Devices, Digital Bazaar) resulting from cascading delays unaddressed across upstream plant milestones.',
        protocols: 'MONITORED VIA: OTIF-95 Delivery Target Tracker · Dual Manager Approval Gate · Customer Notification Webhooks',
        tables: 'DATABASE TABLES: fact_customer_order, dim_customer, dock_allocation_approvals, audit_logs',
        flow: [
          { title: 'P1 Order Priority Fast-Tracking', desc: 'Tags and promotes urgent customer backlogs across high-value product lines (Aster Pro 256GB FG sets).' },
          { title: 'Cross-Agent Decision Synthesis', desc: 'Synchronizes weighbridge tare clearances with smart dock allocations to safeguard committed Nov 24–27 SLA windows.' },
          { title: 'Human Manager Approval Gatekeeper', desc: 'Requires Logistics Manager cryptographic sign-off before allowing critical load deflections or bay overrides.' },
          { title: 'Proactive Customer Transparency', desc: 'Sends automated ETA progress updates and ePOD delivery notifications directly to customer account leads.' },
          { title: 'OTIF Fulfillment Compliance Assurance', desc: 'Maintains 95%+ On-Time In-Full performance across all 4 customer accounts and 1,500 active orders.' },
        ],
      },
    },
  ]

  // 3. LOGISTICS DISPATCH & INVENTORY USE CASE: CRITICAL MATERIALS & FG INVENTORY MATRIX
  const materialHeatmapCols = [
    { title: 'QA HOLD', sub: 'Quarantine', color: '#ef4444' },
    { title: 'ALLOCATED', sub: 'Dock Staging', color: '#0ea5e9' },
    { title: 'IN-TRANSIT', sub: 'Corridor', color: '#6366f1' },
    { title: 'ON-HAND', sub: 'Available', color: '#10b981' },
    { title: 'SAFETY COVER', sub: 'Buffer Days', color: '#f59e0b' },
  ]

  const materialHeatmapData = [
    {
      account: '6.5in AMOLED Display',
      id: 'MAT-DSP-005',
      totalCount: '8,021 EA',
      subLabel: 'WIP-WH-01 / FG-WH-01',
      channel: 'Display Assembly · 12d Lead Time (Safety Stock: 4,639 EA)',
      carrier: 'BlueDart Express',
      windows: [
        { label: 'QA Inspection Hold', pct: '4.7%', count: '374 EA', tone: 'red', note: '374 display panels under optical QA audit hold; blocking 12 outbound dispatches' },
        { label: 'Allocated to Dispatches', pct: '38.8%', count: '3,115 EA', tone: 'blue', note: '3,115 panels staged at Loading Bays 01 & 02 for Aster 15 assembly dispatches' },
        { label: 'In-Transit Corridor', pct: '14.2%', count: '1,140 EA', tone: 'blue', note: '1,140 panels moving on Chennai-Bengaluru NH-48 corridor via BlueDart' },
        { label: 'Unrestricted Stock', pct: '56.5%', count: '4,532 EA', tone: 'green', note: '4,532 panels available in climate-controlled FG-WH-01 clean storage' },
        { label: 'Safety Stock Cover', pct: '18.2 Days', count: 'Safe', tone: 'green', note: '18.2 days forward stock cover against 12-day vendor lead time' },
      ],
    },
    {
      account: 'Application Processor SoC',
      id: 'MAT-SOC-001',
      totalCount: '7,028 EA',
      subLabel: 'SMT-KIT-01 Staging',
      channel: 'Tier-1 Semiconductor · 12d Lead Time (Safety Stock: 1,643 EA)',
      carrier: 'DHL Air Cargo',
      windows: [
        { label: 'QA Inspection Hold', pct: '2.2%', count: '155 EA', tone: 'red', note: '155 processor ICs quarantined at inbound gate pass due to moisture bag seal breach' },
        { label: 'Allocated to Dispatches', pct: '33.5%', count: '2,353 EA', tone: 'blue', note: '2,353 SoCs reserved for urgent Aster Pro 256GB customer orders' },
        { label: 'In-Transit Corridor', pct: '18.8%', count: '1,322 EA', tone: 'blue', note: '1,322 chipsets en route via DHL Express Air cargo to Bengaluru KA-01' },
        { label: 'Unrestricted Stock', pct: '64.3%', count: '4,520 EA', tone: 'green', note: '4,520 units verified in nitrogen-purged SMT storage cabinets' },
        { label: 'Safety Stock Cover', pct: '22.5 Days', count: 'Safe', tone: 'green', note: '22.5 days operational buffer (surplus over 1,643 safety stock)' },
      ],
    },
    {
      account: '5000mAh Li-ion Battery',
      id: 'MAT-BAT-006',
      totalCount: '6,481 EA',
      subLabel: 'RM-WH-01 Hazardous Yard',
      channel: 'Battery Pack · 5d Lead Time · Scale WB-01 Certified (Safety: 2,128 EA)',
      carrier: 'Safexpress HazMat',
      windows: [
        { label: 'QA Inspection Hold', pct: '2.8%', count: '182 EA', tone: 'red', note: '182 battery packs held at WB-01 scale for thermal equilibrium check' },
        { label: 'Allocated to Dispatches', pct: '28.9%', count: '1,872 EA', tone: 'blue', note: '1,872 packs allocated to Loading Bay 03 for retail distribution' },
        { label: 'In-Transit Corridor', pct: '13.0%', count: '841 EA', tone: 'blue', note: '841 units moving in certified DG trailers from supplier plant' },
        { label: 'Unrestricted Stock', pct: '68.3%', count: '4,427 EA', tone: 'green', note: '4,427 packs available in flame-retardant warehouse zone RM-WH-01' },
        { label: 'Safety Stock Cover', pct: '14.8 Days', count: 'Safe', tone: 'green', note: '14.8 days stock cover; replenishment order PO-0089 scheduled' },
      ],
    },
    {
      account: '6-layer Main PCB',
      id: 'MAT-PCB-004',
      totalCount: '6,052 EA',
      subLabel: 'FG-WH-01 / SMT Line',
      channel: 'High-Density PCB · 5d Lead Time (Safety Stock: 1,267 EA)',
      carrier: 'Delhivery Surface',
      windows: [
        { label: 'QA Inspection Hold', pct: '5.5%', count: '332 EA', tone: 'red', note: '332 bare boards quarantined for micro-via impedance testing' },
        { label: 'Allocated to Dispatches', pct: '24.5%', count: '1,480 EA', tone: 'blue', note: '1,480 boards allocated for outbound dispatch consolidation' },
        { label: 'In-Transit Corridor', pct: '13.2%', count: '798 EA', tone: 'blue', note: '798 boards in transit on 32FT container fleet from Chennai TN-01' },
        { label: 'Unrestricted Stock', pct: '70.1%', count: '4,240 EA', tone: 'green', note: '4,240 boards ready for automated SMT line feed and packing' },
        { label: 'Safety Stock Cover', pct: '19.4 Days', count: 'Safe', tone: 'green', note: '19.4 days stock buffer against 5-day supplier turnaround SLA' },
      ],
    },
    {
      account: 'Aster 15 256GB (FG)',
      id: 'SPH-A15-256',
      totalCount: '5,840 EA',
      subLabel: 'FG-WH-01 Dispatch Bay',
      channel: 'Finished Goods Assembly · Outbound Corridor Dispatches (540 Orders)',
      carrier: 'DHL & BlueDart',
      windows: [
        { label: 'QA Audit Pre-Shipment', pct: '2.4%', count: '140 EA', tone: 'red', note: '140 boxed units undergoing random outbound QA audit at Bay 05' },
        { label: 'Allocated to Dispatches', pct: '55.5%', count: '3,240 EA', tone: 'blue', note: '3,240 finished boxed sets staged for MobileMart & Retailer North' },
        { label: 'In-Transit Corridor', pct: '24.8%', count: '1,450 EA', tone: 'blue', note: '1,450 units moving on BLR-DEL and BLR-CHN corridors' },
        { label: 'Unrestricted Stock', pct: '42.1%', count: '2,460 EA', tone: 'green', note: '2,460 finished units ready on pallets for immediate dispatch' },
        { label: 'Safety Stock Cover', pct: '16.0 Days', count: 'Safe', tone: 'green', note: 'OTIF-95 fulfillment buffer maintained across KA-01 finished goods' },
      ],
    },
    {
      account: 'Rear Quad Camera Module',
      id: 'MAT-CAM-007',
      totalCount: '5,972 EA',
      subLabel: 'RM-WH-01 Optical Storage',
      channel: 'Camera Module · 25d Lead Time (Safety Stock: 4,964 EA)',
      carrier: 'Delhivery Express',
      windows: [
        { label: 'QA Inspection Hold', pct: '3.6%', count: '214 EA', tone: 'red', note: '214 camera modules pending autofocus calibration test results' },
        { label: 'Allocated to Dispatches', pct: '22.8%', count: '1,361 EA', tone: 'blue', note: '1,361 modules allocated to high-priority P1 assembly lines' },
        { label: 'In-Transit Corridor', pct: '15.3%', count: '916 EA', tone: 'blue', note: '916 modules en-route via express air freight' },
        { label: 'Unrestricted Stock', pct: '73.6%', count: '4,397 EA', tone: 'green', note: '4,397 modules available in ESD-protected clean storage' },
        { label: 'Safety Stock Cover', pct: '24.0 Days', count: 'Safe', tone: 'green', note: '24.0 days stock cover protecting against 25-day vendor lead time' },
      ],
    },
  ]

  // 4. LOGISTICS DISPATCH USE CASE: 1,500 ORDERS MATRIX
  const orderHeatmapCols = [
    { title: 'OVERDUE (328)', sub: 'Corridor Delays', color: '#ef4444' },
    { title: 'IN-TRANSIT (332)', sub: 'Active Corridor SLA', color: '#0ea5e9' },
    { title: 'DOCK STAGING (300)', sub: 'Bays 01-06 Loading', color: '#6366f1' },
    { title: 'FG-WH READY (283)', sub: 'Warehouse Stock', color: '#10b981' },
    { title: 'OPEN BACKLOG (257)', sub: 'ERP Pipeline', color: '#f59e0b' },
  ]

  const orderHeatmapData = [
    {
      account: 'Retailer North',
      id: 'CUS-001',
      totalCount: 396,
      subLabel: '396 total orders',
      channel: 'North Corridor NH-44 · Tier-1 Retail Hubs (DHL / Delhivery)',
      carrier: 'DHL & Delhivery',
      windows: [
        { label: 'Overdue (Corridor Delays)', pct: '20.5%', count: 81, tone: 'red', note: '81 orders delayed on NH-44 corridor (toll checkpoint dwell & transit slippage flagged by Agent 1)' },
        { label: 'In-Transit (Corridor SLA)', pct: '86.4%', count: 92, tone: 'blue', note: '92 dispatches active on NH-44 North Corridor via DHL · On-track for SLA delivery' },
        { label: 'Dock Staging (Bays 01-06)', pct: '78.2%', count: 87, tone: 'blue', note: '87 orders staged at Loading Bays 01-03 · 32FT MXL fleet pre-loading' },
        { label: 'FG-WH Ready (Stock)', pct: '90.5%', count: 73, tone: 'green', note: '73 confirmed orders with 100% finished goods readiness at FG-WH-01' },
        { label: 'Open Backlog (ERP Pipeline)', pct: '42.0%', count: 63, tone: 'amber', note: '63 open ERP orders scheduled for upcoming manufacturing shift' },
      ],
    },
    {
      account: 'MobileMart',
      id: 'CUS-002',
      totalCount: 406,
      subLabel: '406 total orders',
      channel: 'South Corridor NH-48 · Retail Network (BlueDart / DHL)',
      carrier: 'BlueDart & DHL',
      windows: [
        { label: 'Overdue (Corridor Delays)', pct: '20.4%', count: 83, tone: 'red', note: '83 orders delayed due to Hosur toll bottleneck and plant yard waiting' },
        { label: 'In-Transit (Corridor SLA)', pct: '88.1%', count: 95, tone: 'blue', note: '95 active consignments moving to southern retail distribution centers via BlueDart' },
        { label: 'Dock Staging (Bays 01-06)', pct: '74.0%', count: 75, tone: 'blue', note: '75 orders undergoing dock assignment and pre-loading inspection at Bay 02' },
        { label: 'FG-WH Ready (Stock)', pct: '92.3%', count: 79, tone: 'green', note: '79 confirmed orders verified at FG-WH-02 · Gate pass pre-authorized' },
        { label: 'Open Backlog (ERP Pipeline)', pct: '38.5%', count: 74, tone: 'amber', note: '74 open demand orders mapped in weekly ERP dispatch schedule' },
      ],
    },
    {
      account: 'Global Devices',
      id: 'CUS-004',
      totalCount: 353,
      subLabel: '353 total orders',
      channel: 'Inter-State OEM · Precision Wire Harness & Assemblies (DHL)',
      carrier: 'DHL',
      windows: [
        { label: 'Overdue (Corridor Delays)', pct: '21.0%', count: 74, tone: 'red', note: '74 delayed orders flagged by Agent 2 for corridor turnaround time overrun' },
        { label: 'In-Transit (Corridor SLA)', pct: '92.0%', count: 71, tone: 'blue', note: '71 high-priority P1 assemblies in transit via DHL express fleet' },
        { label: 'Dock Staging (Bays 01-06)', pct: '84.0%', count: 64, tone: 'blue', note: '64 orders staged for consolidation on 32FT container trucks' },
        { label: 'FG-WH Ready (Stock)', pct: '94.2%', count: 69, tone: 'green', note: '69 confirmed orders cleared by Plant QA inspection hold' },
        { label: 'Open Backlog (ERP Pipeline)', pct: '35.0%', count: 75, tone: 'amber', note: '75 forward OEM supply batch orders in production queue' },
      ],
    },
    {
      account: 'Digital Bazaar',
      id: 'CUS-003',
      totalCount: 345,
      subLabel: '345 total orders',
      channel: 'E-Commerce Express · Regional Hubs (DHL / Safexpress)',
      carrier: 'DHL & Safexpress',
      windows: [
        { label: 'Overdue (Corridor Delays)', pct: '26.1%', count: 90, tone: 'red', note: '90 consignments delayed by axle weight hold (+520kg imbalance at scale WB-02)' },
        { label: 'In-Transit (Corridor SLA)', pct: '82.5%', count: 74, tone: 'blue', note: '74 express parcel loads dispatched on 20FT multi-drop distribution fleet' },
        { label: 'Dock Staging (Bays 01-06)', pct: '70.3%', count: 74, tone: 'blue', note: '74 orders undergoing rapid sortation at Loading Bay 04 & Bay 05' },
        { label: 'FG-WH Ready (Stock)', pct: '88.0%', count: 62, tone: 'green', note: '62 confirmed replenishment orders staged in cross-dock holding area' },
        { label: 'Open Backlog (ERP Pipeline)', pct: '30.2%', count: 45, tone: 'amber', note: '45 fast-moving SKU orders in dispatch queue' },
      ],
    },
  ]

  // 4. LOGISTICS DISPATCH USE CASE: 1,000 SHIPMENT JOURNEYS MATRIX
  const shipmentHeatmapCols = [
    { title: 'DELAYED (328)', sub: 'Corridor Overrun', color: '#ef4444' },
    { title: 'IN-TRANSIT (332)', sub: 'Active Corridors', color: '#0ea5e9' },
    { title: 'DELIVERED (340)', sub: 'Completed Trips', color: '#10b981' },
    { title: 'SLA ON-TIME %', sub: 'Corridor Benchmark', color: '#8b5cf6' },
    { title: 'UTILIZATION %', sub: 'Vehicle Capacity', color: '#059669' },
  ]

  const shipmentHeatmapData = [
    {
      account: 'Retailer North',
      id: 'CUS-001',
      totalCount: 262,
      subLabel: '262 shipments',
      channel: 'North Corridor NH-44 · Tier-1 Retail Hubs (DHL / Delhivery)',
      carrier: 'DHL & Delhivery',
      windows: [
        { label: 'Delayed Journeys', pct: '30.9%', count: 81, tone: 'red', note: '81 delayed shipments flagged on Bengaluru-Delhi corridor by Agent 1' },
        { label: 'Active In-Transit', pct: '35.1%', count: 92, tone: 'blue', note: '92 shipments en-route with live GPS telemetry' },
        { label: 'Completed Deliveries', pct: '34.0%', count: 89, tone: 'green', note: '89 shipments delivered to northern retail distribution hubs' },
        { label: 'SLA On-Time Rate', pct: '48.2%', count: 126, tone: 'blue', note: '48.2% on-time delivery compliance on NH-44 corridor' },
        { label: 'Avg Fleet Utilization', pct: '75.1%', count: '32FT', tone: 'green', note: 'Average vehicle cubic capacity utilization: 75.1%' },
      ],
    },
    {
      account: 'MobileMart',
      id: 'CUS-002',
      totalCount: 276,
      subLabel: '276 shipments',
      channel: 'South Corridor NH-48 · Retail Network (BlueDart / DHL)',
      carrier: 'BlueDart & DHL',
      windows: [
        { label: 'Delayed Journeys', pct: '30.1%', count: 83, tone: 'red', note: '83 shipments delayed at Hosur toll plaza and yard gate check' },
        { label: 'Active In-Transit', pct: '34.4%', count: 95, tone: 'blue', note: '95 shipments moving between Bengaluru KA-01 and Chennai TN-01' },
        { label: 'Completed Deliveries', pct: '35.5%', count: 98, tone: 'green', note: '98 shipments successfully delivered with POD sign-off' },
        { label: 'SLA On-Time Rate', pct: '46.4%', count: 128, tone: 'blue', note: '46.4% on-time delivery compliance on Southern Corridors' },
        { label: 'Avg Fleet Utilization', pct: '76.3%', count: '20FT', tone: 'green', note: 'Average vehicle cubic capacity utilization: 76.3%' },
      ],
    },
    {
      account: 'Global Devices',
      id: 'CUS-004',
      totalCount: 217,
      subLabel: '217 shipments',
      channel: 'Inter-State OEM · Precision Wire Harness & Assemblies (DHL)',
      carrier: 'DHL',
      windows: [
        { label: 'Delayed Journeys', pct: '34.1%', count: 74, tone: 'red', note: '74 shipments exceeding planned 144h corridor benchmark' },
        { label: 'Active In-Transit', pct: '32.7%', count: 71, tone: 'blue', note: '71 high-value OEM assembly loads under active Agent 1 surveillance' },
        { label: 'Completed Deliveries', pct: '33.2%', count: 72, tone: 'green', note: '72 OEM consignments verified with zero transit damage' },
        { label: 'SLA On-Time Rate', pct: '41.9%', count: 91, tone: 'blue', note: '41.9% on-time delivery rate · Targeted for Agent 2 TAT optimization' },
        { label: 'Avg Fleet Utilization', pct: '75.6%', count: '32FT', tone: 'green', note: 'Average vehicle cubic capacity utilization: 75.6%' },
      ],
    },
    {
      account: 'Digital Bazaar',
      id: 'CUS-003',
      totalCount: 245,
      subLabel: '245 shipments',
      channel: 'E-Commerce Express · Regional Hubs (DHL / Safexpress)',
      carrier: 'DHL & Safexpress',
      windows: [
        { label: 'Delayed Journeys', pct: '36.7%', count: 90, tone: 'red', note: '90 express consignments delayed by weighbridge WB-02 calibration hold' },
        { label: 'Active In-Transit', pct: '30.2%', count: 74, tone: 'blue', note: '74 quick-commerce loads dispatched on regional routes' },
        { label: 'Completed Deliveries', pct: '33.1%', count: 81, tone: 'green', note: '81 completed consignments with digitized ePOD' },
        { label: 'SLA On-Time Rate', pct: '48.6%', count: 119, tone: 'blue', note: '48.6% on-time delivery compliance' },
        { label: 'Avg Fleet Utilization', pct: '76.9%', count: '20FT', tone: 'green', note: 'Average vehicle cubic capacity utilization: 76.9%' },
      ],
    },
  ]

  const activeHeatmapData = heatmapMode === 'materials'
    ? materialHeatmapData
    : (heatmapMode === 'orders' ? orderHeatmapData : shipmentHeatmapData)

  const activeHeatmapCols = heatmapMode === 'materials'
    ? materialHeatmapCols
    : (heatmapMode === 'orders' ? orderHeatmapCols : shipmentHeatmapCols)

  const currentStageData = stages.find(s => s.id === selectedStage) || stages[2]
  const currentProblemData = problems.find(p => p.id === selectedProblem) || problems[0]

  // 2.5 DEEP OPERATIONAL DETAILS FOR EVERY SELECTIVE INNER COMPONENT
  const itemDetails = {
    erp: {
      id: 'erp',
      shortName: 'ERP Orders',
      title: 'ERP Sales Order Ingestion (SAP S/4HANA & Oracle RFC)',
      badge: 'SOURCE COMPONENT · SAP S/4HANA / ORACLE RFC',
      badgeBg: 'rgba(37, 99, 235, 0.12)',
      badgeColor: '#2563eb',
      icon: Database,
      iconColor: '#2563eb',
      description: 'Ingests real-time sales order contracts and delivery commitments from SAP S/4HANA and Oracle ERP, parsing line-item customer delivery windows, plant assignments (KA-01 / TN-01), and priority tiers (P1/P2/P3).',
      protocols: 'PROTOCOLS: SAP RFC / REST OData Webhooks · ISO-27001 TLS 1.3 · Polling Cadence: 10s',
      tables: 'DATABASE TABLES: fact_customer_order, dim_customer, dim_plant',
      handshake: {
        incoming: 'Enterprise ERP Databases (SAP S/4HANA Central Sales Order Ledger & Oracle SCM)',
        outgoing: 'Stage 2: FastAPI Gateway (Validated Raw JSON Payloads & Priority Staging Queues)',
      },
      telemetryChips: [
        { label: '1,500 Customer Orders Active', dot: '#2563eb' },
        { label: '4 Enterprise Accounts Synced', dot: '#16a34a' },
        { label: 'P1 Expedited Tier: 18.4%', dot: '#d97706' },
        { label: 'SAP RFC Uptime: 99.98%', dot: '#0ea5e9' },
      ],
      flow: [
        { title: 'OData Sales Contract Sync', desc: 'Fetches active order header records, requested ship dates, and penalty thresholds across all 4 contracted enterprise clients.' },
        { title: 'Multi-Plant Order Partitioning', desc: 'Routes customer commitments between Bengaluru Electronics City (KA-01) and Chennai Sriperumbudur (TN-01).' },
        { title: 'Priority Classification', desc: 'Categorizes shipments into P1 (Assembly Line Stoppage Risk), P2 (Contractual SLA Due <24h), and P3 (Standard Fulfillment).' },
        { title: 'Schema Integrity Validation', desc: 'Enforces strict data type casting and foreign-key referential integrity before committing to staging queues.' },
        { title: 'Async Handshake Dispatch', desc: 'Emits cryptographically signed order events to FastAPI gateway worker pools in under 12 milliseconds.' },
      ],
    },
    wms: {
      id: 'wms',
      shortName: 'WMS Stock',
      title: 'WMS Finished-Goods Inventory (Manhattan / SAP EWM)',
      badge: 'SOURCE COMPONENT · WAREHOUSE STOCK FG-01',
      badgeBg: 'rgba(22, 163, 74, 0.12)',
      badgeColor: '#16a34a',
      icon: Warehouse,
      iconColor: '#16a34a',
      imgSrc: '/arch-icons/card1_wms.png',
      description: 'Synchronizes live warehouse inventory snapshots across finished-goods warehouses FG-WH-01 and FG-WH-02, verifying physical stock availability against requested customer orders and isolating QA hold lots.',
      protocols: 'PROTOCOLS: Manhattan WMS REST API · SSCC-18 Pallet Barcodes · MQTT Staging Sensors',
      tables: 'DATABASE TABLES: fact_inventory_daily_snapshot, dim_inventory_lot, fact_dock_bay',
      handshake: {
        incoming: 'Warehouse Management Systems (Manhattan WMS, SMT Cleanroom Inventory DB)',
        outgoing: 'Stage 3: Multi-Agent Core (Stock Availability Vector for Dock Allocation & TAT Matching)',
      },
      telemetryChips: [
        { label: '24,576 EA Available in FG-WH-01', dot: '#16a34a' },
        { label: '1,401 EA under Optical QA Hold', dot: '#ef4444' },
        { label: '13,421 EA Staged at Docks', dot: '#0ea5e9' },
        { label: '6 Critical Components Monitored', dot: '#7c3aed' },
      ],
      flow: [
        { title: 'Pallet Staging Verification', desc: 'Monitors real-time physical pallet locations in high-density racking and staging lanes 01-12.' },
        { title: 'QA Inspection Hold Quarantine', desc: 'Isolates batches flagged for quality audit (374 AMOLED displays, 155 Application SoCs) to prevent unauthorized staging.' },
        { title: 'Dock Bay Allocation Feeds', desc: 'Calculates physical distance from storage bins to assigned loading bays to minimize forklift turnaround times.' },
        { title: 'Inventory Reorder Buffer Check', desc: 'Maintains minimum 14-day forward safety cover for critical sub-assemblies (battery packs, AMOLED screens).' },
        { title: 'Live Snapshot Delta Sync', desc: 'Broadcasts inventory delta updates to Lakebase PostgreSQL on state changes in under 50ms.' },
      ],
    },
    weighbridge: {
      id: 'weighbridge',
      shortName: 'Weighbridge',
      title: 'Weighbridge IoT Scales & FASTag (Mettler-Toledo WB-01/WB-02)',
      badge: 'SOURCE COMPONENT · 60T TARE SCALE & RFID FASTag',
      badgeBg: 'rgba(217, 119, 6, 0.12)',
      badgeColor: '#d97706',
      icon: Scale,
      iconColor: '#d97706',
      description: 'Ingests certified tare and gross vehicle weights from certified 60-tonne load cells (WB-01 and WB-02), automated RFID FASTag lane antennas, and laser axle scanners to detect weight imbalances before highway exit.',
      protocols: 'PROTOCOLS: Mettler-Toledo 60T Scales · EPC Gen2 RFID Antennas · RS-485 / MQTT Broker',
      tables: 'DATABASE TABLES: fact_shipment_milestone, dim_weighbridge, dim_transporter',
      handshake: {
        incoming: 'Plant Gate Hardware (Scale WB-01/WB-02, Inbound/Outbound RFID Loops, Optical Cameras)',
        outgoing: 'Stage 3: Agent 2 TAT & Weighbridge Optimizer (Tare Delta, Axle Imbalance Signals)',
      },
      telemetryChips: [
        { label: 'Scale WB-01 & WB-02 Active', dot: '#16a34a' },
        { label: 'Axle Imbalance Alert (+520kg)', dot: '#d97706' },
        { label: 'FASTag Read Latency <120ms', dot: '#0ea5e9' },
        { label: 'Certified Tare Auto-Logged', dot: '#7c3aed' },
      ],
      flow: [
        { title: 'RFID FASTag Lane Ingestion', desc: 'Captures vehicle license number, transporter ID, and assigned order instantly as vehicle enters weighbridge ramp.' },
        { title: 'Dual-Scale Tare Weight Logging', desc: 'Ingests unladen weight (tare) on entry and gross weight on exit with legal-for-trade calibration accuracy.' },
        { title: 'Axle Imbalance Analysis', desc: 'Identifies uneven container load distributions (+520 kg threshold at WB-01) to protect highway safety and avoid transit fines.' },
        { title: 'Gate Pass Token Authorization', desc: 'Validates certified gross weight against ERP bill of lading before issuing electronic gate pass.' },
        { title: 'Scale Queue Auto-Balancing', desc: 'Redirects multi-axle trailers between WB-01 and WB-02 to prevent scale queue turnaround inflation.' },
      ],
    },
    corridor: {
      id: 'corridor',
      shortName: 'Corridor GPS',
      title: 'Corridor Master Tracking (Contracted Transporters GPS)',
      badge: 'SOURCE COMPONENT · REGIONAL GPS TELEMETRY',
      badgeBg: 'rgba(147, 51, 234, 0.12)',
      badgeColor: '#9333ea',
      icon: Truck,
      iconColor: '#9333ea',
      description: 'Tracks carrier vehicle journeys across major national corridors (NH-44 Bengaluru-Delhi, NH-48 Bengaluru-Chennai) using integrated GPS telematics from BlueDart, DHL, Delhivery, and Safexpress.',
      protocols: 'PROTOCOLS: Carrier Telematics APIs · GPS NMEA Streams · REST Webhooks · 30s Polling',
      tables: 'DATABASE TABLES: dim_transporter, fact_shipment_milestone, dim_corridor',
      handshake: {
        incoming: 'Carrier Fleets (BlueDart, DHL, Delhivery, Safexpress Fleet Telematics Platforms)',
        outgoing: 'Stage 3: Agent 1 Delay Risk ML Engine (Live Highway Coordinates & Transit Deltas)',
      },
      telemetryChips: [
        { label: '332 Active Fleet In-Transit', dot: '#0ea5e9' },
        { label: '4 Contracted Carriers Active', dot: '#16a34a' },
        { label: 'NH-44 / NH-48 GPS Active', dot: '#7c3aed' },
        { label: 'Toll Dwell Alarms Monitored', dot: '#d97706' },
      ],
      flow: [
        { title: 'GPS Telematics Ingestion', desc: 'Receives coordinate pings every 30 seconds from 332 active in-transit freight vehicles.' },
        { title: 'Corridor Geofence Auditing', desc: 'Benchmarks vehicle positions against pre-approved transit corridors and registers toll plaza timestamp milestones.' },
        { title: 'Speed Variance Detection', desc: 'Flags unexpected stoppages (>3.5 hrs) at highway checkpoints, rest stops, or traffic choke points.' },
        { title: 'Transporter SLA Scoring', desc: 'Computes historical delivery reliability per carrier (BlueDart 48.2%, DHL 41.9%, Delhivery 48.6%).' },
        { title: 'Corridor Alert Feeds', desc: 'Transmits transit delay signals to cognitive agents for automated route deflection and customer warning.' },
      ],
    },
    fastapi_engine: {
      id: 'fastapi_engine',
      shortName: 'FastAPI Engine',
      title: 'FastAPI Asynchronous Gateway (Port 8000 Uvicorn ASGI)',
      badge: 'API GATEWAY · ASYNCHRONOUS UVICORN WORKER POOLS',
      badgeBg: 'rgba(13, 148, 136, 0.12)',
      badgeColor: '#0f766e',
      icon: Zap,
      iconColor: '#0d9488',
      imgSrc: '/arch-icons/fastapi_emblem.png',
      description: 'High-performance asynchronous microservice gateway engineered in Python with multi-worker Uvicorn ASGI processes, managing cryptographic JWT authentication, role segregation, and sub-second SQL execution.',
      protocols: 'PROTOCOLS: Asynchronous ASGI (Uvicorn) · JWT Bearer Auth · JSON REST / Streaming SSE',
      tables: 'DATABASE TABLES: users, roles, permissions, audit_logs, api_rate_limits',
      handshake: {
        incoming: 'Stage 1: Enterprise Telemetry (ERP Orders, Scale Tare, GPS Telematics, WMS Pallets)',
        outgoing: 'Stage 3: Multi-Agent Core (Validated, Cached & Normalized Analytical Data Streams)',
      },
      telemetryChips: [
        { label: 'FastAPI Port: 8000 Active', dot: '#16a34a' },
        { label: 'Analytical Query Latency <35ms', dot: '#0ea5e9' },
        { label: 'JWT RBAC 100% Validated', dot: '#7c3aed' },
        { label: 'Zero Unauthorized Bypasses', dot: '#10b981' },
      ],
      flow: [
        { title: 'Cryptographic Token Verification', desc: 'Validates JWT bearer tokens and maps permissions across Executive, Manager, and Dispatch Worker roles.' },
        { title: 'Asynchronous Request Queuing', desc: 'Processes up to 5,000 concurrent IoT sensor telemetry payloads without blocking worker threads.' },
        { title: 'Database Pool Pre-Ping', desc: 'Maintains live SQLAlchemy connection pools to Neon Lakebase PostgreSQL with automatic keepalive health-checks.' },
        { title: 'Sub-Second Analytical SQL', desc: 'Executes parameterized queries and aggregates 1,500 orders and 1,000 carrier trips in under 35ms.' },
        { title: 'Real-Time SSE Event Broadcasting', desc: 'Streams live dock states and vehicle coordinates to browser clients with sub-40ms latency.' },
      ],
    },
    async_normalizer: {
      id: 'async_normalizer',
      shortName: 'Async Normalizer',
      title: 'Asynchronous Query Normalizer & Caching Layer',
      badge: 'API GATEWAY · SQL NORMALIZER & CONNECTION POOL',
      badgeBg: 'rgba(14, 165, 233, 0.12)',
      badgeColor: '#0284c7',
      icon: Zap,
      iconColor: '#0284c7',
      description: 'Normalizes disparate multi-plant parameters, date formats, and vehicle dimensions into optimized SQL clauses, utilizing multi-layer in-memory query caching with automatic TTL eviction on database updates.',
      protocols: 'PROTOCOLS: Python Asyncio · SQLAlchemy ORM · Redis / In-Memory LRU Cache',
      tables: 'DATABASE TABLES: fact_shipment_milestone, v_agent1_predictive_delay_features',
      handshake: {
        incoming: 'Client Web Apps & Edge Gateways (Filter Requests: KA-01/TN-01, Shift A/B/C)',
        outgoing: 'Neon Lakebase PostgreSQL (Optimized Parameterized SQL Execution Plans)',
      },
      telemetryChips: [
        { label: 'Query Cache Hit Rate: 94.8%', dot: '#16a34a' },
        { label: 'SQL Normalization: <4ms', dot: '#0ea5e9' },
        { label: 'Multi-Plant Filtering Active', dot: '#7c3aed' },
        { label: 'Automatic TTL Eviction', dot: '#d97706' },
      ],
      flow: [
        { title: 'Parameter Standardization', desc: 'Converts diverse date-time formats, transporter codes, and material IDs into unified database schemas.' },
        { title: 'Intelligent Query Invalidation', desc: 'Purges cached aggregations automatically when new weighbridge or dock approval records are committed.' },
        { title: 'Multi-Plant Partition Routing', desc: 'Directs SQL queries to optimal table partitions based on plant geography (KA-01 vs TN-01).' },
        { title: 'Connection Pool Throttling', desc: 'Prevents database connection exhaustion during peak dispatch shift changeovers (Shift A to Shift B).' },
        { title: 'Schema Drift Protection', desc: 'Enforces backward-compatible API contracts across client UI portals and legacy backend ERPs.' },
      ],
    },
    delay_risk: {
      id: 'delay_risk',
      shortName: 'Delay Risk ML',
      title: 'Agent 1: Predictive Corridor Delay Risk Engine',
      badge: 'COGNITIVE AGENT · ML DELAY RISK REGRESSION',
      badgeBg: 'rgba(220, 38, 38, 0.12)',
      badgeColor: '#dc2626',
      icon: Clock3,
      iconColor: '#dc2626',
      description: 'Continuously evaluates GPS highway breadcrumbs against 144-hour historical corridor regression baselines to flag shipments at risk of breaching customer delivery commitments before arrival.',
      protocols: 'PROTOCOLS: Domo Agentic Framework · Historical Regression Models · ETA Recalculation',
      tables: 'DATABASE TABLES: v_agent1_predictive_delay_features, fact_shipment_milestone',
      handshake: {
        incoming: 'Stage 2: Normalized Transporter GPS Coordinates & Historical Corridor Milestone Speeds',
        outgoing: 'Stage 4: Closed-Loop Governance (Delay Escalations & Highway Bypass Directives)',
      },
      telemetryChips: [
        { label: '328 Delayed Milestones Flagged', dot: '#dc2626' },
        { label: 'Corridor Slippage Detected', dot: '#d97706' },
        { label: 'Regression Confidence: 92.4%', dot: '#16a34a' },
        { label: 'ETA Adjustment Rate: <1.5s', dot: '#0ea5e9' },
      ],
      flow: [
        { title: 'Milestone Duration Benchmarking', desc: 'Compares elapsed time between highway checkpoints against expected transit durations for NH-44 and NH-48.' },
        { title: 'Toll Plaza Halt Detection', desc: 'Identifies chronic dwell at Krishnagiri and Hosur toll gates exceeding the 3.5h standard threshold.' },
        { title: 'Customer ETA Dynamic Recalculation', desc: 'Updates estimated delivery timestamps and calculates SLA breach probability for 1,500 active orders.' },
        { title: 'Carrier Reliability Weighting', desc: 'Applies penalty factors to historical carrier performance (BlueDart 48.2%, DHL 41.9%, Delhivery 48.6%).' },
        { title: 'Proactive Route Deflection Proposals', desc: 'Submits alternative bypass routing recommendations to Logistics Managers to recover lost transit time.' },
      ],
    },
    tat_opt: {
      id: 'tat_opt',
      shortName: 'TAT Optimizer',
      title: 'Agent 2: Turnaround Time & Weighbridge Tare Optimizer',
      badge: 'COGNITIVE AGENT · TURNAROUND TIME OPTIMIZER',
      badgeBg: 'rgba(217, 119, 6, 0.12)',
      badgeColor: '#d97706',
      icon: Scale,
      iconColor: '#d97706',
      description: 'Detects certified weighbridge scale tare anomalies, flags vehicle axle weight imbalances exceeding legal thresholds (+520 kg tolerance), and benchmarks in-plant milestones against the 84.0h standard SLA.',
      protocols: 'PROTOCOLS: 84.0h Standard SLA Benchmark · Axle Load Lasers · Weighbridge Load Balancing',
      tables: 'DATABASE TABLES: fact_shipment_milestone, fact_inventory_daily_snapshot, dim_weighbridge',
      handshake: {
        incoming: 'Stage 1: Certified 60T Scale Telemetry & Automated Gate-In FASTag Reads',
        outgoing: 'Stage 4: Closed-Loop Governance (Axle Rebalancing Orders & Scale Load Directives)',
      },
      telemetryChips: [
        { label: '4.2h Average In-Plant TAT', dot: '#d97706' },
        { label: 'Scale WB-01 Tare Imbalance Guard', dot: '#ef4444' },
        { label: '84.0h Standard SLA Baseline', dot: '#0ea5e9' },
        { label: 'Turnaround Compression: -24%', dot: '#16a34a' },
      ],
      flow: [
        { title: 'Tare Scale Sensor Ingestion', desc: 'Audits unladen weight readings from WB-01 against vehicle master tare specifications to detect sensor drift.' },
        { title: 'Axle Load Variance Calculation', desc: 'Calculates weight distribution across tractor-trailer axles, flagging +520 kg uneven loading immediately.' },
        { title: 'Turnaround Milestone Profiling', desc: 'Breaks down elapsed time across Gate-In, Tare Scale, Dock Staging, Gross Scale, and Gate-Out phases.' },
        { title: 'FASTag RFID Clearance Automation', desc: 'Automates digital gate clearance for compliant vehicles, reducing queue wait times by up to 24%.' },
        { title: 'Weighbridge Ramp Load Balancing', desc: 'Directs incoming multi-axle freight between WB-01 and WB-02 to prevent single-ramp congestion.' },
      ],
    },
    dock_bay: {
      id: 'dock_bay',
      shortName: 'Smart Dock Bay',
      title: 'Agent 3: Autonomous Dock Bay Director & Staging Engine',
      badge: 'COGNITIVE AGENT · AUTONOMOUS DOCK BAY ALLOCATION',
      badgeBg: 'rgba(124, 58, 237, 0.12)',
      badgeColor: '#7c3aed',
      icon: Warehouse,
      iconColor: '#7c3aed',
      description: 'Automates loading bay assignments across all 6 plant dock bays based on vehicle specifications (32FT Multi-Axle, 20FT Container, Heavy Trailer) and cross-checks warehouse stock availability in FG-WH-01.',
      protocols: 'PROTOCOLS: Vehicle Dimension Matching · WMS FG Inventory Cross-Check · Bay Optimization',
      tables: 'DATABASE TABLES: fact_dock_bay, dock_allocation_approvals, fact_inventory_daily_snapshot',
      handshake: {
        incoming: 'Stage 1: Inbound Vehicle Specs & Finished-Goods Stock Counts in FG-WH-01',
        outgoing: 'Stage 4: Closed-Loop Governance (Proposed Bay Allocation Plans Requiring Manager Sign-Off)',
      },
      telemetryChips: [
        { label: '6 Plant Dock Bays Live', dot: '#7c3aed' },
        { label: 'P1 Immediate Bay Staging Ready', dot: '#16a34a' },
        { label: 'Bay Allocation Latency <250ms', dot: '#0ea5e9' },
        { label: 'Zero Dock Bottleneck Dwell', dot: '#10b981' },
      ],
      flow: [
        { title: 'Vehicle Dimension Fitment Check', desc: 'Matches incoming vehicle chassis specs against dock bay clearances (Bays 01-02: 32FT, Bays 03-04: 20FT, Bays 05-06: Trailer).' },
        { title: 'Inventory Availability Cross-Check', desc: 'Verifies required finished-goods quantities are ready and unblocked in staging lanes before assigning bay.' },
        { title: 'Priority Dispatch Queuing', desc: 'Allocates high-priority customer dispatches (P1 Assembly Stoppage risk) to the nearest loading bay doors.' },
        { title: 'Forklift Travel Time Minimization', desc: 'Calculates optimal bin-to-bay travel routes to expedite pallet loading cycles.' },
        { title: 'Governance Proposal Submission', desc: 'Submits finalized dock allocation plans to authenticated Logistics Managers for 1-click authorization.' },
      ],
    },
    surveillance: {
      id: 'surveillance',
      shortName: 'Surveillance 48h',
      title: 'Agent 4: Inside-Plant Stuck-Vehicle Surveillance Engine',
      badge: 'COGNITIVE AGENT · INSIDE-PLANT DWELL ESCALATION',
      badgeBg: 'rgba(2, 132, 199, 0.12)',
      badgeColor: '#0284c7',
      icon: AlertTriangle,
      iconColor: '#0284c7',
      description: 'Continuously monitors yard dwell timers across all vehicles inside the facility gates, identifying vehicles halted beyond the 48-hour threshold (25 stuck vehicles tracked) and triggering automated escalation loops.',
      protocols: 'PROTOCOLS: Continuous Milestone Surveillance · >48h Dwell Threshold · CCTV Computer Vision',
      tables: 'DATABASE TABLES: v_agent1_predictive_delay_features, risk_alerts, email_notification_logs',
      handshake: {
        incoming: 'Plant Gate Milestone Timers (RFID Gate-In Reads without Corresponding Gate-Out Events)',
        outgoing: 'Stage 4: Closed-Loop Governance (Multi-Channel Alerts, Gate Overrides & Yard Expeditions)',
      },
      telemetryChips: [
        { label: '25 Stuck Vehicles Tracked (>48h)', dot: '#dc2626' },
        { label: 'Inside-Plant Yard Alarms Active', dot: '#d97706' },
        { label: 'Multi-Channel Escalation Triggered', dot: '#0ea5e9' },
        { label: '12 Expedited Passes Generated', dot: '#16a34a' },
      ],
      flow: [
        { title: 'Inside-Plant Yard Timer Audit', desc: 'Scans all active vehicle sessions inside plant gates, tracking elapsed dwell against the 48h maximum SLA.' },
        { title: 'Stuck-Vehicle Cause Diagnosis', desc: 'Determines whether vehicle delay is caused by missing paperwork, QA hold pallets, or mechanical maintenance.' },
        { title: 'Automated Multi-Channel Escalation', desc: 'Dispatches urgent escalation notices via email and SMS to plant yard supervisors and dispatch leads.' },
        { title: 'Expedited Gate Pass Creation', desc: 'Generates emergency digital gate clearance vouchers once operational blockers are cleared by supervisors.' },
        { title: 'Demurrage Penalty Prevention', desc: 'Reduces inside-plant carrier demurrage exposure by accelerating stagnant trailer turnaround.' },
      ],
    },
    approval_gate: {
      id: 'approval_gate',
      shortName: 'Approval Gate',
      title: 'Human Approval Gate (100% Manager Sign-Off & Duties)',
      badge: 'GOVERNANCE · 100% MANAGER SIGN-OFF GATE',
      badgeBg: 'rgba(15, 118, 110, 0.12)',
      badgeColor: '#0f766e',
      icon: ShieldCheck,
      iconColor: '#0f766e',
      description: 'Enforces human-in-the-loop operational governance by mandating 1-click authorization from authenticated Logistics Managers before committing critical dock re-assignments, bypass routings, or override passes.',
      protocols: 'PROTOCOLS: Dual-Control Sign-Off · Role-Based Access Control · Cryptographic Audit Logging',
      tables: 'DATABASE TABLES: dock_allocation_approvals, audit_logs, users',
      handshake: {
        incoming: 'Stage 3: Multi-Agent Core (Autonomous Bay Plans, TAT Alerts & Risk Interventions)',
        outgoing: 'Stage 4: Execution Channels (Authorized Directives to Docks, Gates, and SMTP Email)',
      },
      telemetryChips: [
        { label: '100% Sign-Off Gate Enforced', dot: '#0f766e' },
        { label: 'Segregation of Duties Active', dot: '#10b981' },
        { label: 'Zero Unauthorized Bypasses', dot: '#0ea5e9' },
        { label: 'Cryptographic Audit Trail', dot: '#6366f1' },
      ],
      flow: [
        { title: 'Autonomous Proposal Interception', desc: 'Locks unverified bay assignments and route deflections into a pending approval staging queue.' },
        { title: 'Manager Sign-Off Gatekeeper', desc: 'Mandates 1-click authorization by an authenticated Logistics Manager, prohibiting unverified auto-execution.' },
        { title: 'Segregation of Duties Enforcement', desc: 'Ensures Dispatch Workers cannot approve their own high-value freight allocations or bypass QA hold lots.' },
        { title: 'Immutable Cryptographic Audit Trail', desc: 'Records timestamped user ID, IP address, and role for every dock approval, rejection, and manual override.' },
        { title: 'Regulatory Compliance Reporting', desc: 'Generates ISO-compliant operational audit reports verifying 100% adherence to corporate safety mandates.' },
      ],
    },
    email_routing: {
      id: 'email_routing',
      shortName: 'Email Routing',
      title: 'Dual Email Routing (Ops & Management Leads)',
      badge: 'CLOSED-LOOP · MULTI-TIER SMTP ESCALATION',
      badgeBg: 'rgba(220, 38, 38, 0.12)',
      badgeColor: '#dc2626',
      icon: Mail,
      iconColor: '#dc2626',
      description: 'Dispatches targeted dual-channel HTML notification alerts to plant operations supervisors (technical bay plans, weighbridge alarms) and management leads (financial impact summaries, customer delay warnings).',
      protocols: 'PROTOCOLS: Ethereal / Gmail SMTP · Live REST Webhooks · 1-Click Action Tokens',
      tables: 'DATABASE TABLES: email_notification_logs, risk_alerts, users',
      handshake: {
        incoming: 'Human Approval Gate (Authorized Directives from Authenticated Logistics Manager)',
        outgoing: 'Plant Operations & Management Teams (Actionable Rich HTML Email Notices)',
      },
      telemetryChips: [
        { label: 'Dual SMTP Channels Active', dot: '#dc2626' },
        { label: 'Direct Action Token Validated', dot: '#16a34a' },
        { label: 'Plant Ops & Mgmt Synced', dot: '#0ea5e9' },
        { label: 'Zero Delivery Drops', dot: '#7c3aed' },
      ],
      flow: [
        { title: 'Dual-Channel Audience Segmentation', desc: 'Splits alerts into shop-floor technical notices (Ops Leads) and executive delivery impact summaries (Management).' },
        { title: 'Actionable HTML Template Rendering', desc: 'Embeds one-click direct authorization buttons and deep links to live 3D digital twin command views.' },
        { title: 'Secure One-Time Token Generation', desc: 'Protects inline email approval actions with cryptographically signed, short-lived verification tokens.' },
        { title: 'Delivery Tracking & Audit Logging', desc: 'Logs message timestamps, recipient addresses, and delivery status into immutable PostgreSQL audit tables.' },
        { title: 'Automatic Escalation Retries', desc: 'Re-dispatches unacknowledged critical delivery warnings after 60 minutes to secondary management contacts.' },
      ],
    },
    corrective_action: {
      id: 'corrective_action',
      shortName: 'Corrective Action',
      title: 'Corrective Action Directives (Expedited Clearance)',
      badge: 'CLOSED-LOOP · SHOP-FLOOR INTERVENTION GATE',
      badgeBg: 'rgba(217, 119, 6, 0.12)',
      badgeColor: '#d97706',
      icon: Zap,
      iconColor: '#d97706',
      description: 'Executes approved shop-floor interventions including dock bay reallocations, emergency weighbridge re-inspections, and expedited gate-out passes to eliminate plant congestion.',
      protocols: 'PROTOCOLS: REST Webhooks · Yard Management Directives · Gate Controller API',
      tables: 'DATABASE TABLES: dock_allocation_approvals, risk_alerts, fact_shipment_milestone',
      handshake: {
        incoming: 'Authorized Directives from Authenticated Logistics Manager',
        outgoing: 'Yard Operators & Gate Barricade Controllers (Digital Release Commands)',
      },
      telemetryChips: [
        { label: 'Expedited Dock Passes Issued', dot: '#16a34a' },
        { label: 'Demurrage Risk Averted', dot: '#0ea5e9' },
        { label: 'Operator Action Verified', dot: '#7c3aed' },
        { label: 'Zero Bottleneck Re-Weighs', dot: '#10b981' },
      ],
      flow: [
        { title: 'Gate Controller Automation', desc: 'Transmits digital open commands to weighbridge barrier arms once certified gross weight is confirmed.' },
        { title: 'Priority Loading Dock Dispatch', desc: 'Alerts warehouse forklift teams to stage critical customer assembly materials at assigned dock doors.' },
        { title: 'Highway Bypass Notification', desc: 'Sends alternate route coordinates to driver mobile apps to bypass congested highway toll plazas.' },
        { title: 'Demurrage Clock Halting', desc: 'Logs verified operational intervention timestamps to suspend carrier dwell penalty accumulation.' },
        { title: 'Resolution Closure Verification', desc: 'Validates that physical vehicle movement matches approved intervention plans before closing alert.' },
      ],
    },
    command_portals: {
      id: 'command_portals',
      shortName: 'Command Portals',
      title: 'Executive Command Portals (Live Telemetry & 3D Twin)',
      badge: 'CLOSED-LOOP · EXECUTIVE COMMAND TELEMETRY',
      badgeBg: 'rgba(22, 163, 74, 0.12)',
      badgeColor: '#16a34a',
      icon: Monitor,
      iconColor: '#16a34a',
      description: 'Streams synchronized real-time dispatch milestones, 3D yard twin vehicle positions, and carrier transit progress directly to executive command dashboards for complete operational visibility.',
      protocols: 'PROTOCOLS: WebSocket / Server-Sent Events · Three.js 3D Engine · Sub-40ms Telemetry Sync',
      tables: 'DATABASE TABLES: fact_shipment_milestone, fact_customer_order, dim_plant',
      handshake: {
        incoming: 'Closed-Loop Milestone Commits & Live Carrier Telemetry',
        outgoing: 'Executive Browser Portals & High-Density Plant Operations Screens',
      },
      telemetryChips: [
        { label: '3D Digital Twin Live Synced', dot: '#16a34a' },
        { label: 'Sub-40ms WebSocket Latency', dot: '#0ea5e9' },
        { label: 'Executive Command Visibility', dot: '#7c3aed' },
        { label: 'Multi-Plant Synchronized', dot: '#2563eb' },
      ],
      flow: [
        { title: 'WebSocket Stream Multiplexing', desc: 'Broadcasts low-latency dispatch updates to hundreds of connected management browser clients.' },
        { title: '3D Digital Twin Coordinate Sync', desc: 'Renders physical truck positions and dock bay occupancy in an interactive real-time 3D plant yard.' },
        { title: 'Executive KPI Rollup', desc: 'Aggregates plant output, order book fulfillment, and on-time delivery rates into high-level summary cards.' },
        { title: 'Alert Beacon Visualization', desc: 'Highlights delayed vehicles and quarantine inventory with visual glowing beacons in the command twin.' },
        { title: 'Single-Click Deep Dive', desc: 'Enables leadership to click any visual asset in the command portal to inspect underlying transactional records.' },
      ],
    },
    fleet_otif: {
      id: 'fleet_otif',
      shortName: 'Fleet & OTIF',
      title: 'Fleet Dispatches & On-Time In-Full (94.2% OTIF)',
      badge: 'BI & REPORTING · 1,000 DISPATCH TRIPS & OTIF',
      badgeBg: 'rgba(37, 99, 235, 0.12)',
      badgeColor: '#2563eb',
      icon: Truck,
      iconColor: '#2563eb',
      description: 'Aggregates 1,000 carrier transit trips across regional corridors, calculating real-time on-time delivery compliance (94.2% OTIF) and evaluating carrier performance for BlueDart, DHL, and Delhivery.',
      protocols: 'PROTOCOLS: Sub-Second Analytical SQL · Neon Lakebase PostgreSQL · OTIF Metric Engine',
      tables: 'DATABASE TABLES: fact_shipment_milestone, fact_customer_order, dim_transporter',
      handshake: {
        incoming: 'Closed-Loop Milestone Telemetry & Confirmed Customer Delivery Scans',
        outgoing: 'Executive Leadership & Commercial Teams (Carrier Scorecards & Customer OTIF Reports)',
      },
      telemetryChips: [
        { label: '1,000 Carrier Trips Tracked', dot: '#2563eb' },
        { label: '94.2% Overall OTIF Compliance', dot: '#16a34a' },
        { label: 'Carrier Scorecard Active', dot: '#7c3aed' },
        { label: 'Sub-Second SQL Aggregations', dot: '#0ea5e9' },
      ],
      flow: [
        { title: 'Trip Milestone Consolidation', desc: 'Aggregates transit durations across 1,000 completed and active carrier journeys.' },
        { title: 'OTIF Compliance Calculation', desc: 'Evaluates on-time arrival against committed delivery dates and verifies 100% quantity fulfillment.' },
        { title: 'Carrier Benchmark Comparison', desc: 'Ranks transporter compliance (BlueDart 48.2%, DHL 41.9%, Delhivery 48.6%) to optimize carrier contract allocations.' },
        { title: 'Corridor Variance Isolation', desc: 'Identifies transit delays specific to national highway segments (NH-44 vs NH-48).' },
        { title: 'Executive Reporting Integration', desc: 'Feeds clean on-time metrics into executive summary dossiers and scheduled management reviews.' },
      ],
    },
    corridor_tat: {
      id: 'corridor_tat',
      shortName: 'Corridor TAT',
      title: 'Corridor Turnaround Time (4.2h Average SLA Benchmark)',
      badge: 'BI & REPORTING · 4.2h CORRIDOR TAT MONITOR',
      badgeBg: 'rgba(13, 148, 136, 0.12)',
      badgeColor: '#0d9488',
      icon: Clock3,
      iconColor: '#0d9488',
      description: 'Tracks plant turnaround time (4.2h actual vs 4.0h target), profiling Gate-In, Weighbridge Tare, Loading Bay, Gross Weight, and Gate-Out stages to isolate gate queues and yard bottlenecks.',
      protocols: 'PROTOCOLS: In-Plant Dwell Benchmarking · Milestone Duration Variance Analytics',
      tables: 'DATABASE TABLES: fact_shipment_milestone, dim_weighbridge, dim_plant',
      handshake: {
        incoming: 'Gate & Scale Milestone Timestamps (FASTag RFID Entry to Exit)',
        outgoing: 'Plant Operations Leadership (Turnaround Compression & Shift Performance Reports)',
      },
      telemetryChips: [
        { label: '4.2h Average In-Plant TAT', dot: '#0d9488' },
        { label: '4.0h Standard SLA Target', dot: '#16a34a' },
        { label: 'Gate-In Queue Bottleneck Isolated', dot: '#d97706' },
        { label: 'Shift Trend Analytics Active', dot: '#7c3aed' },
      ],
      flow: [
        { title: 'Milestone Time Profiling', desc: 'Breaks down average dwell times across each physical step in the vehicle plant journey.' },
        { title: 'SLA Variance Flagging', desc: 'Identifies vehicle trips exceeding the 4.0h SLA target and computes operational cost impact.' },
        { title: 'Shift Productivity Analysis', desc: 'Compares turnaround performance across Shift A, Shift B, and Shift C to optimize yard staffing.' },
        { title: 'Scale Queue Correlation', desc: 'Isolates weighbridge ramp delays from warehouse dock loading queues.' },
        { title: 'Turnaround Compression Directives', desc: 'Recommends tactical process improvements to drive plant TAT under the 4.0h corporate benchmark.' },
      ],
    },
    dock_staging: {
      id: 'dock_staging',
      shortName: 'Dock Staging',
      title: 'Smart Dock Queue & P1 Bay Allocation Monitor',
      badge: 'BI & REPORTING · 6 ACTIVE DOCK BAYS UTILIZATION',
      badgeBg: 'rgba(124, 58, 237, 0.12)',
      badgeColor: '#7c3aed',
      icon: Warehouse,
      iconColor: '#7c3aed',
      description: 'Surfaces live utilization across all 6 plant dock bays, staging readiness for high-priority customer assembly orders, and dock turnaround efficiency to maximize loading dock throughput.',
      protocols: 'PROTOCOLS: Real-Time Bay Telemetry · WMS Pallet Staging Monitor · Staging Optimization',
      tables: 'DATABASE TABLES: fact_dock_bay, dock_allocation_approvals, fact_inventory_daily_snapshot',
      handshake: {
        incoming: 'Loading Bay Sensors & WMS Pallet Staging Feeds (Bays 01-06)',
        outgoing: 'Warehouse Dispatch Supervisors (Dock Queue Displays & Priority Staging Directives)',
      },
      telemetryChips: [
        { label: '6 Loading Bays Live Monitored', dot: '#7c3aed' },
        { label: 'P1 Expedited Clearance Ready', dot: '#16a34a' },
        { label: '82.4% Average Bay Utilization', dot: '#0ea5e9' },
        { label: 'Zero Loading Delay Escalations', dot: '#10b981' },
      ],
      flow: [
        { title: 'Bay Utilization Tracking', desc: 'Computes continuous occupancy and turnaround rates across loading bays 01 to 06.' },
        { title: 'P1 Shipment Prioritization', desc: 'Reserves dedicated bays (Bay 01 & 02) for high-value priority customer delivery contracts.' },
        { title: 'Pallet Staging Readiness', desc: 'Verifies finished-goods pallets are positioned in staging lanes before truck docking.' },
        { title: 'Loading Duration Auditing', desc: 'Alerts dock supervisors if loading cycles exceed the 45-minute standard threshold.' },
        { title: 'Throughput Maximization', desc: 'Coordinates with yard marshals to stage next-in-line vehicles prior to current bay vacation.' },
      ],
    },
    sla_alerts: {
      id: 'sla_alerts',
      shortName: 'SLA Alerts',
      title: 'Delay Risk Alarms & SLA Exception Audit Dossier',
      badge: 'BI & REPORTING · MANAGEMENT AUDIT & KPI DOSSIER',
      badgeBg: 'rgba(220, 38, 38, 0.12)',
      badgeColor: '#dc2626',
      icon: AlertTriangle,
      iconColor: '#dc2626',
      description: 'Alerts operations leadership to critical transit delay risks (>24h slippage), generates regulatory transport safety audit dossiers, and provides single-click export of period performance reports to Excel and PDF.',
      protocols: 'PROTOCOLS: Real-Time Risk Engine · Sub-Second Analytical SQL · Excel (.xlsx) & PDF Export',
      tables: 'DATABASE TABLES: risk_alerts, audit_logs, fact_customer_order, dim_customer',
      handshake: {
        incoming: 'Corridor Risk Signals & Operational Milestone SLA Breaches',
        outgoing: 'Executive Leadership & Corporate Auditors (Formal Compliance Dossiers & Excel Exports)',
      },
      telemetryChips: [
        { label: '328 Critical Risk Alerts Audited', dot: '#dc2626' },
        { label: 'Demurrage Penalty Shield Active', dot: '#16a34a' },
        { label: 'Excel (.xlsx) Export Active', dot: '#0ea5e9' },
        { label: 'ISO-Compliant Audit Dossiers', dot: '#7c3aed' },
      ],
      flow: [
        { title: 'SLA Exception Aggregation', desc: 'Consolidates all milestone slippages, dwell overruns, and weighbridge tare exceptions.' },
        { title: 'Financial Demurrage Risk Audit', desc: 'Calculates carrier demurrage liabilities and customer delay penalty exposure.' },
        { title: 'Automated Audit Trail Generation', desc: 'Compiles immutable records of human manager authorizations, timestamps, and overrides.' },
        { title: 'Single-Click Self-Service Export', desc: 'Generates ISO-compliant performance summaries, Excel (.xlsx) data sheets, and executive PDF audit dossiers.' },
        { title: 'Continuous Policy Governance', desc: 'Validates 100% adherence to corporate logistics dispatch rules and transport safety regulations.' },
      ],
    },
  }

  const stageTelemetry = {
    1: [
      { label: '4 Ingestion Feeds Active', dot: '#2563eb' },
      { label: 'SAP S/4HANA & Oracle ERP', dot: '#16a34a' },
      { label: 'WB-01 & WB-02 60T Scales', dot: '#d97706' },
      { label: 'FASTag RFID Latency <120ms', dot: '#9333ea' },
    ],
    2: [
      { label: 'FastAPI Port: 8000 (ASGI)', dot: '#2563eb' },
      { label: 'Analytical Query Latency <35ms', dot: '#16a34a' },
      { label: 'JWT RBAC 100% Validated', dot: '#0ea5e9' },
      { label: 'Postgres Connection Pool Active', dot: '#7c3aed' },
    ],
    3: [
      { label: 'Agent 1: 328 Delays Flagged', dot: '#dc2626' },
      { label: 'Agent 2: 4.2h Corridor TAT', dot: '#d97706' },
      { label: 'Agent 3: 6 Dock Bays Staged', dot: '#7c3aed' },
      { label: 'Agent 4: 25 Stuck Monitored (>48h)', dot: '#0284c7' },
    ],
    4: [
      { label: '100% Sign-Off Gate Enforced', dot: '#0f766e' },
      { label: 'Segregation of Duties Active', dot: '#10b981' },
      { label: 'Dual SMTP Routing Active', dot: '#dc2626' },
      { label: 'Expedited Dock Clearance', dot: '#d97706' },
    ],
    5: [
      { label: '1,000 Dispatches (94.2% OTIF)', dot: '#2563eb' },
      { label: '4.2h Average TAT Benchmark', dot: '#0d9488' },
      { label: '6 Plant Dock Bays Live', dot: '#7c3aed' },
      { label: 'Instant Excel & PDF Export', dot: '#d97706' },
    ],
  }

  const problemTelemetry = {
    '01': [
      { label: '328 Delayed Milestones Flagged', dot: '#ef4444' },
      { label: 'NH-44 & NH-48 Corridor Slippage', dot: '#d97706' },
      { label: 'Agent 1 Predictive Regression Active', dot: '#10b981' },
      { label: 'Automated Route Deflection Ready', dot: '#2563eb' },
    ],
    '02': [
      { label: 'WB-01 Tare Imbalance (+520kg)', dot: '#d97706' },
      { label: '4.2h Actual TAT vs 4.0h SLA', dot: '#ef4444' },
      { label: 'Agent 2 Auto-Rebalancing Active', dot: '#10b981' },
      { label: 'Certified Scale Weight Calibration', dot: '#16a34a' },
    ],
    '03': [
      { label: '6 Loading Bays Staged Dynamically', dot: '#7c3aed' },
      { label: 'P1 Immediate Bay Allocation Enabled', dot: '#0ea5e9' },
      { label: 'Zero Dock Congestion Hold Time', dot: '#10b981' },
      { label: 'Warehouse Staging Sync (FG-01)', dot: '#2563eb' },
    ],
    '04': [
      { label: '25 Stuck Inside-Plant Vehicles', dot: '#0284c7' },
      { label: '>48h Yard Dwell Threshold Monitored', dot: '#ef4444' },
      { label: 'Agent 4 Multi-Channel Escalation Active', dot: '#10b981' },
      { label: 'Automated Gate Check Clearance', dot: '#d97706' },
    ],
    '05': [
      { label: '94.2% Fleet On-Time In-Full (OTIF)', dot: '#10b981' },
      { label: 'Zero Critical SLA Breaches', dot: '#0ea5e9' },
      { label: 'Manager Sign-Off Gate Enforced', dot: '#7c3aed' },
      { label: 'Multi-Channel Resolution Dispatch', dot: '#2563eb' },
    ],
  }

  const activeInspectData = inspectMode === 'problem'
    ? {
        type: 'problem',
        title: currentProblemData.detail.problemName,
        badge: currentProblemData.detail.badge,
        badgeBg: 'rgba(239, 68, 68, 0.12)',
        badgeColor: '#dc2626',
        icon: currentProblemData.icon,
        iconColor: currentProblemData.border,
        description: currentProblemData.detail.description,
        protocols: currentProblemData.detail.protocols,
        tables: currentProblemData.detail.tables,
        flowHeading: 'Agent Resolution Logic & Operational Flow:',
        flow: currentProblemData.detail.flow,
        handshake: {
          incoming: 'Corridor & Yard Anomaly Signal (Sensor Telemetry & Milestone Breaches)',
          outgoing: 'Automated Agent Multi-Channel Directives & Closed-Loop SLA Protection',
        },
        telemetryChips: problemTelemetry[selectedProblem] || [],
      }
    : (inspectMode === 'item' && selectedItem && itemDetails[selectedItem]
        ? {
            type: 'item',
            title: itemDetails[selectedItem].title,
            badge: itemDetails[selectedItem].badge,
            badgeBg: itemDetails[selectedItem].badgeBg,
            badgeColor: itemDetails[selectedItem].badgeColor,
            icon: itemDetails[selectedItem].icon,
            iconColor: itemDetails[selectedItem].iconColor,
            description: itemDetails[selectedItem].description,
            protocols: itemDetails[selectedItem].protocols,
            tables: itemDetails[selectedItem].tables,
            flowHeading: 'Component Execution Logic & Operational Directives:',
            flow: itemDetails[selectedItem].flow,
            handshake: itemDetails[selectedItem].handshake,
            telemetryChips: itemDetails[selectedItem].telemetryChips,
          }
        : {
            type: 'stage',
            title: currentStageData.detail.stageName,
            badge: currentStageData.detail.badge,
            badgeBg: 'rgba(124, 58, 237, 0.12)',
            badgeColor: '#7c3aed',
            icon: Sparkles,
            iconColor: '#7c3aed',
            description: currentStageData.detail.description,
            protocols: currentStageData.detail.protocols,
            tables: currentStageData.detail.tables,
            flowHeading: 'Execution Logic & Operational Flow:',
            flow: currentStageData.detail.flow,
            handshake: currentStageData.flowHandshake,
            telemetryChips: stageTelemetry[selectedStage] || [],
            stageId: currentStageData.id,
          }
      )

  const activeCellInfo = useMemo(() => {
    if (!selectedCell) return null
    const [ri, wi] = selectedCell.split('-').map(Number)
    const row = activeHeatmapData[ri]
    if (!row) return null
    const window = row.windows[wi]
    if (!window) return null
    return { account: row.account, channel: row.channel, window }
  }, [selectedCell, activeHeatmapData])

  return (
    <div
      className="arch-page-container"
      style={{
        minHeight: '100%',
        boxSizing: 'border-box',
        padding: '8px 14px 16px',
        maxWidth: '1680px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* ================= TOP SUB-HEADER & NAVIGATION PILLS ================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
          height: '28px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>Manufacturing 360</span>
            <span>/</span>
            <b style={{ color: 'var(--text-primary)' }}>Home Page</b>
          </div>

          <div style={{ display: 'inline-flex', background: 'var(--bg-subtle, #f1f5f9)', borderRadius: '24px', padding: '2px', border: '1px solid var(--border-color, #e2e8f0)', gap: '3px' }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '18px',
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'default',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)',
              }}
            >
              <Home size={12} />
              <span>Home Page · 4X AI Architecture</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('overview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '18px',
                background: 'transparent',
                color: 'var(--text-secondary, #64748b)',
                border: 'none',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Switch to Executive Overview & Analytics Dashboard"
            >
              <LayoutDashboard size={12} />
              <span>Executive Overview &amp; Analytics</span>
            </button>
          </div>
        </div>

        {/* Use Case Grounding Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>Grounding: <b style={{ color: 'var(--text-primary)' }}>Logistics Dispatch Use Case (1,500 Orders)</b></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            4 Accounts · 2 Plants (KA-01 / TN-01)
          </span>
        </div>
      </div>

      {/* ================= ROW 1: TOP SEGMENT - ARCHITECTURE PIPELINE (77% WIDTH, UNCLIPPED RESPONSIVE) & PROBLEMS SOLVED (23% WIDTH) ================= */}
      <div
        style={{
          minHeight: '305px',
          height: 'auto',
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7.7fr) minmax(0, 2.3fr)',
          gap: '8px',
          alignItems: 'stretch',
        }}
      >
        {/* ================= ROW 1, COL 1: SYSTEM ARCHITECTURE PIPELINE (77% WIDTH, 5 EQUAL-HEIGHT CARDS) ================= */}
        <div
          className="arch-card"
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '10px 12px 12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '285px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0, height: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                <Home size={14} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Home Page · System Architecture Pipeline
              </h3>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--teal, #0d9488)', fontWeight: 600 }}>
              Click any stage card or inner item to inspect details →
            </span>
          </div>

          {/* 5-Stage Horizontal Flow Container - Equal Height Across All 5 Cards with 77% Width Room */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', width: '100%', flex: 1, minHeight: '235px' }}>
            {stages.map((stage, idx) => {
              const isSelected = selectedStage === stage.id
              const StageIcon = stage.headerIcon

              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0, height: '100%' }}>
                  <div
                    onClick={() => {
                      setSelectedStage(stage.id)
                      setInspectMode('stage')
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '100%',
                      background: 'var(--bg-card, #ffffff)',
                      border: (isSelected && inspectMode === 'stage') ? '2px solid #7c3aed' : '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: (isSelected && inspectMode === 'stage') ? '0 0 0 3px rgba(124, 58, 237, 0.28), 0 4px 10px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Header with Circular Step Badge, Title and Header Icon - Fixed 52px with unclipped typography */}
                    <div
                      style={{
                        background: stage.headerBg,
                        color: '#ffffff',
                        padding: '4px 4px 4px',
                        height: '52px',
                        minHeight: '52px',
                        maxHeight: '52px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', height: '16px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            color: stage.headerIconColor || '#1e293b',
                            fontWeight: 900,
                            fontSize: '9.5px',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            flexShrink: 0,
                          }}
                        >
                          {stage.number}
                        </div>
                        {stage.headerImg ? (
                          <img src={stage.headerImg} alt="header" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                        ) : (
                          <StageIcon size={13} color="#ffffff" strokeWidth={2.3} />
                        )}
                      </div>
                      <b style={{ fontSize: '9.5px', lineHeight: 1.25, display: 'block', letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 800 }}>
                        {stage.title}
                      </b>
                      <small style={{ fontSize: '8.2px', lineHeight: 1.2, opacity: 0.95, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 500 }}>
                        {stage.sub}
                      </small>
                    </div>

                    {/* Card Body */}
                    <div
                      style={{
                        padding: '6px 5px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '4px',
                        flex: 1,
                        minHeight: '180px',
                        boxSizing: 'border-box',
                        background: (isSelected && inspectMode === 'stage') ? 'rgba(124, 58, 237, 0.03)' : 'transparent',
                      }}
                    >
                      {stage.type === 'gateway' ? (
                        <div
                          style={{
                            flex: 1,
                            height: '100%',
                            minHeight: '180px',
                            width: '100%',
                            background: 'linear-gradient(180deg, rgba(13, 148, 136, 0.08) 0%, rgba(13, 148, 136, 0.015) 100%)',
                            border: (inspectMode === 'item' && (selectedItem === 'fastapi_engine' || selectedItem === 'async_normalizer'))
                              ? '2px solid #0d9488'
                              : '1px solid rgba(13, 148, 136, 0.28)',
                            borderRadius: '7px',
                            padding: '6px 5px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            boxSizing: 'border-box',
                            boxShadow: (inspectMode === 'item' && (selectedItem === 'fastapi_engine' || selectedItem === 'async_normalizer'))
                              ? '0 0 0 2px rgba(13, 148, 136, 0.35)'
                              : 'none',
                          }}
                        >
                          {/* FastAPI Icon clickable */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedStage(2)
                              setSelectedItem('fastapi_engine')
                              setInspectMode('item')
                            }}
                            title="Click to inspect FastAPI Engine details"
                            style={{
                              width: '52px',
                              height: '52px',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            {stage.centerImg ? (
                              <img
                                src={stage.centerImg}
                                alt={stage.engine}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 3px 6px rgba(0, 150, 136, 0.35))',
                                }}
                              />
                            ) : (
                              <img
                                src="/arch-icons/fastapi_custom.png"
                                alt="FastAPI"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            )}
                          </div>

                          {/* FastAPI Engine & Port Subtitle */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedStage(2)
                              setSelectedItem('fastapi_engine')
                              setInspectMode('item')
                            }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', cursor: 'pointer' }}
                          >
                            <b style={{ fontSize: '11px', color: '#0f766e', display: 'block', fontWeight: 800, lineHeight: 1.25, letterSpacing: '0.01em' }}>
                              {stage.engine}
                            </b>
                            <span style={{ fontSize: '8.2px', color: '#64748b', display: 'block', fontWeight: 600, lineHeight: 1.2, letterSpacing: '0.01em' }}>
                              {stage.port}
                            </span>
                          </div>

                          {/* Async Normalizer Pill with 3D Lightning Bolt */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedStage(2)
                              setSelectedItem('async_normalizer')
                              setInspectMode('item')
                            }}
                            title="Click to inspect Async Normalizer details"
                            style={{
                              fontSize: '8.5px',
                              lineHeight: 1.2,
                              background: inspectMode === 'item' && selectedItem === 'async_normalizer' ? 'rgba(13, 148, 136, 0.15)' : '#ffffff',
                              color: '#0f766e',
                              padding: '3px 8px',
                              borderRadius: '14px',
                              border: inspectMode === 'item' && selectedItem === 'async_normalizer' ? '2px solid #0d9488' : '1px solid rgba(13, 148, 136, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 5px rgba(13, 148, 136, 0.12)',
                              flexShrink: 0,
                            }}
                          >
                            {stage.tagImg ? (
                              <img src={stage.tagImg} alt="tag" style={{ width: '14px', height: '14px', objectFit: 'contain', flexShrink: 0 }} />
                            ) : (
                              <Zap size={11} color="#eab308" />
                            )}
                            <span>{stage.tag}</span>
                          </div>
                        </div>
                      ) : (
                        stage.items.map((it, i) => {
                          const ItemIcon = it.icon
                          const isThisItemSelected = inspectMode === 'item' && selectedItem === it.id
                          const isWb = it.isWeighbridge || it.label === 'Weighbridge' || it.id === 'weighbridge'
                          const isGov = it.icon === ShieldCheck || it.label?.includes('Human Approval') || it.id === 'approval_gate'

                          let itemBg = 'var(--bg-subtle, #f8fafc)'
                          let itemBorder = '1px solid var(--border-color, #e2e8f0)'
                          let itemShadow = '0 1px 2px rgba(0,0,0,0.02)'

                          if (isThisItemSelected) {
                            itemBg = 'rgba(124, 58, 237, 0.10)'
                            itemBorder = '2px solid #7c3aed'
                            itemShadow = '0 0 0 2px rgba(124, 58, 237, 0.35), 0 2px 6px rgba(124, 58, 237, 0.15)'
                          } else if (isWb) {
                            itemBg = 'rgba(254, 243, 199, 0.55)'
                            itemBorder = '1px solid rgba(245, 158, 11, 0.45)'
                          } else if (isGov) {
                            itemBg = 'rgba(240, 253, 250, 0.75)'
                            itemBorder = '1px solid rgba(15, 118, 110, 0.35)'
                          }

                          return (
                            <div
                              key={it.id || i}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedStage(stage.id)
                                setSelectedItem(it.id)
                                setInspectMode('item')
                              }}
                              title={`Click to inspect ${it.label} — ${it.sub}`}
                              style={{
                                background: itemBg,
                                border: itemBorder,
                                borderRadius: '7px',
                                padding: '3px 7px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                boxShadow: itemShadow,
                                height: '38px',
                                minHeight: '38px',
                                flex: '1 0 38px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: isThisItemSelected ? 'scale(1.02)' : 'none',
                              }}
                            >
                              {/* 3D Icon container */}
                              {it.imgSrc ? (
                                <div
                                  style={{
                                    width: (isWb || it.id === 'wms') ? '32px' : '26px',
                                    height: '26px',
                                    borderRadius: '5px',
                                    overflow: 'hidden',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                    background: '#ffffff',
                                    border: `1px solid ${it.iconBorder || 'rgba(0,0,0,0.08)'}`,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                  }}
                                >
                                  <img
                                    src={it.imgSrc}
                                    alt={it.label}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '5px',
                                    background: it.iconBg || 'rgba(100, 116, 139, 0.12)',
                                    border: `1px solid ${it.iconBorder || 'rgba(100, 116, 139, 0.25)'}`,
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ItemIcon size={13} color={it.iconColor || 'var(--text-primary)'} strokeWidth={2.4} />
                                </div>
                              )}

                              <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <b
                                  style={{
                                    fontSize: '9.5px',
                                    color: isThisItemSelected ? '#6d28d9' : (isWb ? '#92400e' : (isGov ? '#0f766e' : 'var(--text-primary)')),
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    lineHeight: 1.25,
                                    fontWeight: 800,
                                  }}
                                >
                                  {it.label}
                                </b>
                                <small
                                  style={{
                                    fontSize: '8px',
                                    color: isThisItemSelected ? '#7c3aed' : (isWb ? '#b45309' : (isGov ? '#0d9488' : 'var(--text-muted)')),
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {it.sub}
                                </small>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  {idx < stages.length - 1 && (
                    <div style={{ padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowRight size={13} strokeWidth={2.6} color="#94a3b8" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ================= ROW 1, COL 2: PROBLEMS SOLVED BY AGENTS (23% WIDTH) ================= */}
        <div
          className="arch-card"
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '10px 11px 12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '285px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0, height: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={15} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Problems Solved
              </h3>
            </div>
            <span style={{ fontSize: '8.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', letterSpacing: '0.04em' }}>
              5 PROBLEMS
            </span>
          </div>

          {/* 5 Problem Bars - Fits neatly within 23% width */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minHeight: '220px', justifyContent: 'space-between' }}>
            {problems.map((prob) => {
              const isProbSelected = selectedProblem === prob.id && inspectMode === 'problem'
              const ProbIcon = prob.icon
              return (
                <div
                  key={prob.id}
                  onClick={() => {
                    setSelectedProblem(prob.id)
                    setInspectMode('problem')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    borderRadius: '7px',
                    background: prob.bg,
                    borderLeft: `4px solid ${prob.border}`,
                    border: isProbSelected ? `2px solid ${prob.border}` : `1px solid ${prob.border}30`,
                    boxShadow: isProbSelected ? `0 0 0 3px ${prob.border}35, 0 3px 8px rgba(0, 0, 0, 0.05)` : 'none',
                    transform: isProbSelected ? 'translateY(-1px)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    height: '38px',
                    minHeight: '38px',
                    flex: '1 0 38px',
                    boxSizing: 'border-box',
                  }}
                >
                  <b style={{ fontSize: '10px', lineHeight: 1.25, fontWeight: 800, color: prob.textColor, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prob.title}
                  </b>
                  <ProbIcon size={14} color={prob.border} style={{ flexShrink: 0, marginLeft: '6px' }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ================= ROW 2: BOTTOM SEGMENT - INFORMATION DETAILS (50% WIDTH) & STAGING HEATMAP (50% WIDTH) ================= */}
      <div
        style={{
          minHeight: '310px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '8px',
          alignItems: 'stretch',
        }}
      >
        {/* ================= ROW 2, COL 1: DYNAMIC STAGE, ITEM & PROBLEM DETAILS (INFORMATION TAB - 50% WIDTH) ================= */}
        <div
          className="arch-card"
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: inspectMode === 'problem'
              ? `1px solid ${activeInspectData.iconColor}40`
              : (inspectMode === 'item' ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid var(--border-color, #e2e8f0)'),
            borderRadius: '12px',
            padding: '10px 14px 8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '310px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'border 0.2s ease',
          }}
        >
          {/* Header with Switcher Tabs: Stage / Item / Problem */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: '6px', columnGap: '8px', marginBottom: '5px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
              <activeInspectData.icon size={15} color={activeInspectData.iconColor} style={{ flexShrink: 0 }} />
              <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeInspectData.title}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'nowrap' }}>
              <div style={{ display: 'inline-flex', background: 'var(--bg-subtle, #f1f5f9)', borderRadius: '16px', padding: '2px', border: '1px solid var(--border-color, #e2e8f0)', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setInspectMode('stage')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: inspectMode === 'stage' ? '#7c3aed' : 'transparent',
                    color: inspectMode === 'stage' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View Architecture Pipeline Stage Details"
                >
                  Stage {selectedStage}
                </button>
                {selectedItem && (
                  <button
                    type="button"
                    onClick={() => setInspectMode('item')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '9.2px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: inspectMode === 'item' ? '#2563eb' : 'transparent',
                      color: inspectMode === 'item' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title={`View ${itemDetails[selectedItem]?.shortName || 'Item'} Details`}
                  >
                    Item: {itemDetails[selectedItem]?.shortName || selectedItem}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectMode('problem')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: inspectMode === 'problem' ? '#dc2626' : 'transparent',
                    color: inspectMode === 'problem' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View Problem Solved Details"
                >
                  Problem {selectedProblem}
                </button>
              </div>

              <span style={{ fontSize: '8.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: activeInspectData.badgeBg, color: activeInspectData.badgeColor, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                {activeInspectData.badge}
              </span>
            </div>
          </div>

          {/* Clean Scrollable Middle Details Body - Sleek & Not Clumsy */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {activeInspectData.description}
            </p>

            {/* Protocols & Tables Metadata Box */}
            <div
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontSize: '9.2px',
                fontFamily: 'monospace',
              }}
            >
              <div>
                <b style={{ color: 'var(--text-primary)' }}>{activeInspectData.protocols}</b>
              </div>
              <div style={{ color: 'var(--teal, #0d9488)' }}>
                <b>{activeInspectData.tables}</b>
              </div>
            </div>

            {/* Pipeline Data Handshake */}
            {activeInspectData.handshake && (
              <div
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(14, 165, 233, 0.04))',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  fontSize: '9.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: '#7c3aed', color: '#ffffff' }}>INCOMING</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeInspectData.handshake.incoming}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: '#0ea5e9', color: '#ffffff' }}>OUTGOING</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeInspectData.handshake.outgoing}</span>
                </div>
              </div>
            )}

            {/* Live Operational Metrics & Telemetry Chips */}
            {activeInspectData.telemetryChips && activeInspectData.telemetryChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {activeInspectData.telemetryChips.map((chip, ci) => (
                  <div
                    key={ci}
                    style={{
                      fontSize: '9.2px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'var(--bg-subtle, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      color: 'var(--text-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: chip.dot, display: 'inline-block' }} />
                    {chip.label}
                  </div>
                ))}
              </div>
            )}

            {/* Execution Logic & Operational Flow */}
            <div>
              <b style={{ fontSize: '10.8px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                {activeInspectData.flowHeading}
              </b>
              <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeInspectData.flow.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '10.2px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    <b style={{ color: 'var(--text-primary)' }}>{item.title}:</b> {item.desc}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Anchored Bottom Status & Quick Action Bar */}
          <div
            style={{
              marginTop: '5px',
              padding: '5px 9px',
              borderRadius: '6px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              gap: '8px',
              fontSize: '9.5px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Architecture Node: <b style={{ color: '#10b981' }}>Live Synced</b> · Neon PostgreSQL
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {activeInspectData.type === 'stage' && selectedStage === 5 ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('overview')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '9.2px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <LayoutDashboard size={10} />
                    <span>Dashboard →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('reports')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      fontSize: '9.2px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <FileSpreadsheet size={10} color="#0d9488" />
                    <span>Reports →</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.('overview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'transparent',
                    color: 'var(--teal, #0d9488)',
                    border: '1px solid rgba(13, 148, 136, 0.3)',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={10} />
                  <span>Inspect Analytics →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= ROW 2, COL 2: MATERIAL INVENTORY & DISPATCH STAGING HEATMAP (45% WIDTH - WIDE & SPACIOUS) ================= */}
        <div
          className="arch-card"
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '10px 12px 8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '310px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header with Switcher Tabs - Responsive Wrap Protected */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              flexWrap: 'wrap',
              rowGap: '6px',
              columnGap: '8px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
              <Table2 size={15} color={heatmapMode === 'materials' ? '#7c3aed' : '#0ea5e9'} style={{ flexShrink: 0 }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={
                  heatmapMode === 'materials'
                    ? 'Material Inventory & Dispatch Staging Heatmap'
                    : (heatmapMode === 'orders' ? 'Customer Delivery Date & Dispatch Heatmap' : 'Corridor Fleet Transport Heatmap')
                }
              >
                {heatmapMode === 'materials'
                  ? 'Material & Staging Heatmap'
                  : (heatmapMode === 'orders' ? 'Customer Orders Heatmap' : 'Fleet Transport Heatmap')
                }
              </h3>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0, flexWrap: 'nowrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--bg-subtle, #f1f5f9)',
                  borderRadius: '16px',
                  padding: '2px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setHeatmapMode('materials'); setSelectedCell(null) }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapMode === 'materials' ? '#7c3aed' : 'transparent',
                    color: heatmapMode === 'materials' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View Material Inventory & Staging Matrix"
                >
                  📦 Materials
                </button>
                <button
                  type="button"
                  onClick={() => { setHeatmapMode('orders'); setSelectedCell(null) }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapMode === 'orders' ? '#0ea5e9' : 'transparent',
                    color: heatmapMode === 'orders' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View Customer Delivery Date Matrix"
                >
                  🏢 Orders
                </button>
                <button
                  type="button"
                  onClick={() => { setHeatmapMode('shipments'); setSelectedCell(null) }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '9.2px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapMode === 'shipments' ? '#0ea5e9' : 'transparent',
                    color: heatmapMode === 'shipments' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View Fleet Trips & Transport Matrix"
                >
                  🚚 Fleet
                </button>
              </div>

              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: heatmapMode === 'materials' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                  color: heatmapMode === 'materials' ? '#7c3aed' : '#0284c7',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {heatmapMode === 'materials' ? '6 MATERIALS' : (heatmapMode === 'orders' ? '4 ACCOUNTS' : '1,000 TRIPS')}
              </span>
            </div>
          </div>

          {/* Heatmap Grid Matrix - Stretched Vertically & Wide Across 50% Width */}
          <div style={{ width: '100%', flex: 1, minHeight: '190px', display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '460px', height: '100%', flex: 1, borderCollapse: 'separate', borderSpacing: '4px', fontSize: '10px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ height: '22px' }}>
                  <th style={{ width: '25%', textAlign: 'left', padding: '2px 4px', color: 'var(--text-muted)', fontSize: '8.8px', fontWeight: 800 }}>
                    {heatmapMode === 'materials' ? 'CRITICAL MATERIAL / FG' : 'ACCOUNT'}
                  </th>
                  {activeHeatmapCols.map((col, ci) => (
                    <th key={ci} style={{ width: '15%', textAlign: 'center', padding: '2px 2px', color: col.color, fontSize: '8.3px', fontWeight: 800 }}>
                      <div style={{ lineHeight: 1.15, wordBreak: 'break-word' }}>{col.title}</div>
                      <div style={{ fontSize: '7.2px', fontWeight: 600, opacity: 0.85, lineHeight: 1.1 }}>{col.sub}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ height: 'calc(100% - 22px)' }}>
                {activeHeatmapData.map((row, ri) => (
                  <tr key={row.id} style={{ height: `${100 / activeHeatmapData.length}%` }}>
                    <td style={{ width: '25%', padding: '2px 6px', overflow: 'hidden', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                        <b style={{ color: 'var(--text-primary)', display: 'block', fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{row.account}</b>
                        <small style={{ color: 'var(--text-muted)', fontSize: '7.8px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>{row.subLabel}</small>
                      </div>
                    </td>

                    {row.windows.map((w, wi) => {
                      let cellBg = 'var(--bg-subtle, #f8fafc)'
                      let cellColor = 'var(--text-muted, #94a3b8)'
                      let cellBorder = '1px solid var(--border-color, #e2e8f0)'

                      if (w.tone === 'red') {
                        cellBg = 'rgba(239, 68, 68, 0.16)'
                        cellColor = '#dc2626'
                        cellBorder = '1px solid rgba(239, 68, 68, 0.35)'
                      } else if (w.tone === 'blue') {
                        cellBg = 'rgba(14, 165, 233, 0.14)'
                        cellColor = '#0369a1'
                        cellBorder = '1px solid rgba(14, 165, 233, 0.3)'
                      } else if (w.tone === 'green') {
                        cellBg = 'rgba(16, 185, 129, 0.16)'
                        cellColor = '#047857'
                        cellBorder = '1px solid rgba(16, 185, 129, 0.35)'
                      } else if (w.tone === 'amber') {
                        cellBg = 'rgba(245, 158, 11, 0.14)'
                        cellColor = '#b45309'
                        cellBorder = '1px solid rgba(245, 158, 11, 0.3)'
                      }

                      const isCellActive = selectedCell === `${ri}-${wi}`
                      return (
                        <td
                          key={wi}
                          onClick={() => setSelectedCell(isCellActive ? null : `${ri}-${wi}`)}
                          style={{
                            width: '15%',
                            background: cellBg,
                            color: cellColor,
                            border: isCellActive ? '2px solid #7c3aed' : cellBorder,
                            borderRadius: '5px',
                            textAlign: 'center',
                            padding: '2px 2px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            transform: isCellActive ? 'scale(1.03)' : 'none',
                            verticalAlign: 'middle',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1px' }}>
                            <b style={{ display: 'block', fontSize: '11px', fontWeight: 800, lineHeight: 1.15 }}>{w.pct}</b>
                            <small style={{ fontSize: '7.8px', opacity: 0.88, display: 'block', lineHeight: 1.1 }}>
                              {w.count} {typeof w.count === 'number' ? (heatmapMode === 'orders' ? 'ord' : (heatmapMode === 'shipments' ? 'trips' : 'EA')) : ''}
                            </small>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Target Banner with Dynamic Cell Inspection */}
          <div
            style={{
              marginTop: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            {activeCellInfo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock3 size={12} color="#7c3aed" />
                <span>
                  <b style={{ color: 'var(--text-primary)' }}>{activeCellInfo.account}</b> ({activeCellInfo.channel}) · <b>{activeCellInfo.window.label}</b>: <strong style={{ color: activeCellInfo.window.tone === 'red' ? '#dc2626' : (activeCellInfo.window.tone === 'green' ? '#16a34a' : '#0284c7') }}>{activeCellInfo.window.pct || '0%'}</strong> ({activeCellInfo.window.count} {typeof activeCellInfo.window.count === 'number' ? (heatmapMode === 'orders' ? 'orders' : (heatmapMode === 'shipments' ? 'trips' : 'EA')) : ''}) — <em>{activeCellInfo.window.note}</em>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock3 size={12} color="#0ea5e9" />
                <span>
                  {heatmapMode === 'materials'
                    ? <>Material Staging: <b style={{ color: '#ef4444' }}>1,401 EA under QA Hold</b> · <b style={{ color: '#0ea5e9' }}>13,421 EA Allocated to Docks</b> · <b style={{ color: '#10b981' }}>24,576 EA Available in FG-WH-01</b></>
                    : (heatmapMode === 'orders'
                      ? <>Dispatch Horizon: <b style={{ color: '#ef4444' }}>328 Overdue Orders</b> · <b style={{ color: '#0ea5e9' }}>332 In-Transit Fleet</b> · <b style={{ color: '#6366f1' }}>300 Dock Staging</b> · <b style={{ color: '#10b981' }}>283 FG Ready</b></>
                      : <>Fleet Journeys: <b style={{ color: '#ef4444' }}>328 Delayed Corridors</b> · <b style={{ color: '#0ea5e9' }}>332 Active In-Transit</b> · <b style={{ color: '#10b981' }}>340 Completed Trips</b> (76.0% Avg Utilization)</>
                    )
                  }
                </span>
              </div>
            )}
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              {activeCellInfo ? 'Click cell again to clear' : 'Click any cell to inspect'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
