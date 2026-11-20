import { useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Award, BarChart3, Bot,
  Box, Check, CheckCircle2, ChevronRight, Clock, Clock3, Cpu,
  Database, Download, ExternalLink, FileSpreadsheet, FileText,
  HelpCircle, Laptop, Layers, LayoutDashboard, Monitor, Navigation,
  Phone, Play, Printer, Radio, RefreshCw, Scale, Server, Settings,
  ShieldAlert, ShieldCheck, Sparkles, Table2, Terminal, Truck,
  User, Users, Warehouse, Wifi, X, Zap
} from 'lucide-react'

const VEHICLE_TYPES = [
  { id: '32FT_TRUCK', label: '10W Heavy (32FT / 25T Container)', maxKg: 18000, defaultTare: 11200 },
  { id: '20FT_TRUCK', label: '6W Medium (20FT / 11T Container)', maxKg: 8500, defaultTare: 5800 },
  { id: '40FT_TRAILER', label: '14W Multi-Axle (40FT Trailer / 35T)', maxKg: 28000, defaultTare: 14500 },
  { id: '16FT_TRUCK', label: '4W Intermediate (16FT / 7T Truck)', maxKg: 5000, defaultTare: 3400 },
  { id: 'VAN', label: 'Light Commercial (Dost / 2.5T)', maxKg: 1500, defaultTare: 1250 },
]

const CARRIERS = [
  'VRL Logistics',
  'Blue Dart',
  'Safexpress',
  'DHL Express',
  'TCI Freight',
  'Delhivery',
  'Gati KWE',
]

const CUSTOMERS = [
  { id: 'CUST-001', name: 'TVS Motor Hosur', plant: 'IN-TN-01', product: 'PRD-CAM-01 Engine Camshafts' },
  { id: 'CUST-002', name: 'Bajaj Auto Pune', plant: 'IN-KA-01', product: 'PRD-STR-02 Steering Gears' },
  { id: 'CUST-003', name: 'Bosch Bangalore', plant: 'IN-KA-01', product: 'PRD-BRK-03 Brake Calipers' },
  { id: 'CUST-004', name: 'Hero MotoCorp Haridwar', plant: 'IN-KA-01', product: 'PRD-ELC-04 Ignition Modules' },
  { id: 'CUST-005', name: 'Royal Enfield Chennai', plant: 'IN-TN-01', product: 'PRD-CHN-05 Sprocket Kits' },
]

export default function VehicleEntryExitManualForm({ authFetch, onToast, onNavigateToTwin, onNavigateToQueue }) {
  const [form, setForm] = useState({
    vehicle_id: 'KA-04-EL-8842',
    carrier: 'VRL Logistics',
    vehicle_type: '32FT_TRUCK',
    plant_id: 'IN-KA-01',
    warehouse_id: 'FG-WH-01',
    dock_bay: 'Bay 02',
    customer_order_id: '',
    customer_name: 'TVS Motor Hosur',
    product_id: 'PRD-CAM-01',
    shipment_qty: 450,
    driver_name: 'Ramesh Kumar',
    driver_phone: '+91 98450 12345',
    rfid_tag: 'FASTAG-KA04-8842',
    gate_pass_no: '',
    tare_weight_kg: 11200,
    gross_weight_kg: 28450,
    current_stage: 'GATE_INWARD',
    priority: 'P1',
    freight_cost_inr: 48500,
    planned_tat_hrs: 48.0,
    seal_no: 'SEAL-KA-8842-A',
    gps_device_id: 'GPS-VT-9912',
    qc_status: 'PASSED',
    notes: 'Urgent line-feed order for automotive assembly corridor.',
  })

  const [submitting, setSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState(null)

  // Auto calculate net weight and utilization
  const selectedVType = VEHICLE_TYPES.find(v => v.id === form.vehicle_type) || VEHICLE_TYPES[0]
  const netWeightKg = Math.max(Number(form.gross_weight_kg || 0) - Number(form.tare_weight_kg || 0), 0)
  const maxPayload = selectedVType.maxKg || 18000
  const utilizationPct = Math.min(Math.round((netWeightKg / maxPayload) * 1000) / 10, 100)

  // Presets handler
  const loadPreset = (type) => {
    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000) % 10000

    if (type === '32ft_urgent') {
      setForm({
        vehicle_id: `KA-04-EL-${ts}`,
        carrier: 'VRL Logistics',
        vehicle_type: '32FT_TRUCK',
        plant_id: 'IN-KA-01',
        warehouse_id: 'FG-WH-01',
        dock_bay: 'Bay 02',
        customer_order_id: `CO-KA-${ts}`,
        customer_name: 'TVS Motor Hosur',
        product_id: 'PRD-CAM-01',
        shipment_qty: 540,
        driver_name: 'Ramesh Kumar',
        driver_phone: '+91 98450 12345',
        rfid_tag: `FASTAG-KA-${ts}`,
        gate_pass_no: `GP-KA01-${ts}`,
        tare_weight_kg: 11200,
        gross_weight_kg: 28450,
        current_stage: 'GATE_INWARD',
        priority: 'P1',
        freight_cost_inr: 48500,
        planned_tat_hrs: 48.0,
        seal_no: `SEAL-KA-${ts}`,
        gps_device_id: `GPS-KA-${ts}`,
        qc_status: 'PASSED',
        notes: 'P1 Urgent Engine Camshaft delivery; critical assembly feeder.',
      })
    } else if (type === '20ft_medium') {
      setForm({
        vehicle_id: `KA-01-MJ-${ts}`,
        carrier: 'Safexpress',
        vehicle_type: '20FT_TRUCK',
        plant_id: 'IN-KA-01',
        warehouse_id: 'FG-WH-01',
        dock_bay: 'Bay 04',
        customer_order_id: `CO-KA-${ts}`,
        customer_name: 'Bajaj Auto Pune',
        product_id: 'PRD-STR-02',
        shipment_qty: 280,
        driver_name: 'Suresh Patil',
        driver_phone: '+91 98200 54321',
        rfid_tag: `FASTAG-MH-${ts}`,
        gate_pass_no: `GP-MH02-${ts}`,
        tare_weight_kg: 5800,
        gross_weight_kg: 13900,
        current_stage: 'DOCK_STAGING',
        priority: 'P2',
        freight_cost_inr: 32000,
        planned_tat_hrs: 64.0,
        seal_no: `SEAL-MH-${ts}`,
        gps_device_id: `GPS-MH-${ts}`,
        qc_status: 'PASSED',
        notes: 'Standard 20FT container scheduled dispatch for Pune corridor.',
      })
    } else if (type === '40ft_trailer') {
      setForm({
        vehicle_id: `TN-09-TR-${ts}`,
        carrier: 'Blue Dart',
        vehicle_type: '40FT_TRAILER',
        plant_id: 'IN-TN-01',
        warehouse_id: 'FG-WH-01',
        dock_bay: 'Bay 05',
        customer_order_id: `CO-TN-${ts}`,
        customer_name: 'Bosch Bangalore',
        product_id: 'PRD-BRK-03',
        shipment_qty: 850,
        driver_name: 'Gopal Krishnan',
        driver_phone: '+91 94440 98765',
        rfid_tag: `FASTAG-TN-${ts}`,
        gate_pass_no: `GP-TN01-${ts}`,
        tare_weight_kg: 14500,
        gross_weight_kg: 41200,
        current_stage: 'WEIGHBRIDGE_IN',
        priority: 'P1',
        freight_cost_inr: 68000,
        planned_tat_hrs: 36.0,
        seal_no: `SEAL-TN-${ts}`,
        gps_device_id: `GPS-TN-${ts}`,
        qc_status: 'PASSED',
        notes: 'High-capacity 40FT trailer multi-axle freight.',
      })
    }
    setSuccessResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicle_id.trim()) {
      onToast?.('Please enter a valid Vehicle License Plate ID.')
      return
    }

    setSubmitting(true)
    try {
      const res = await authFetch('/api/vehicles/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not record vehicle entry')
      }

      const data = await res.json()
      setSuccessResult(data)
      onToast?.(`✓ Vehicle ${data.vehicle_id} entered successfully! Order: ${data.customer_order_id}`)
    } catch (err) {
      onToast?.(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="manual-inward-wrapper">
      {/* ===================== HEADER & PRESETS ===================== */}
      <div className="inward-header-card">
        <div className="inward-title-block">
          <div className="inward-eyebrow">
            <span className="live-dot" />
            <span>OPERATIONAL SOURCE FEED · MANUAL INWARDING</span>
            <span className="badge-tag">STAGE 1 INWARD GATE</span>
          </div>
          <h2>Vehicle Entry-to-Exit Inward Registration Form</h2>
          <p>
            Manually fill in every milestone from <b>Gate Inward</b> → <b>Weighbridge Tare</b> → <b>Dock Staging</b> → <b>QC Inspection</b> → <b>Weighbridge Gross</b> → <b>Exit Gate-Out</b> before intelligent agents evaluate risk.
          </p>
        </div>

        <div className="inward-presets-bar">
          <span className="presets-label">1-Click Presets:</span>
          <button type="button" className="preset-pill-btn" onClick={() => loadPreset('32ft_urgent')}>
            <Truck size={13} color="#dc2626" />
            <span>32FT Urgent Line Feed (TVS)</span>
          </button>
          <button type="button" className="preset-pill-btn" onClick={() => loadPreset('20ft_medium')}>
            <Box size={13} color="#0ea5e9" />
            <span>20FT Container (Bajaj Auto)</span>
          </button>
          <button type="button" className="preset-pill-btn" onClick={() => loadPreset('40ft_trailer')}>
            <Warehouse size={13} color="#7c3aed" />
            <span>40FT Heavy Trailer (Bosch)</span>
          </button>
        </div>
      </div>

      {/* ===================== SUCCESS BANNER (IF SUBMITTED) ===================== */}
      {successResult && (
        <div className="inward-success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={32} color="#10b981" />
          </div>
          <div className="success-meta">
            <h4>Vehicle Inward Completed Successfully!</h4>
            <p>
              Vehicle <b>{successResult.vehicle_id}</b> ({successResult.carrier}) has been entered into the live operations database under Shipment ID <code>{successResult.shipment_id}</code> and Order <code>{successResult.customer_order_id}</code>.
            </p>
            <div className="success-chips-row">
              <span className="chip-item">Gate Pass: <b>{successResult.gate_pass_no}</b></span>
              <span className="chip-item">Dock Bay: <b>{successResult.dock_bay}</b></span>
              <span className="chip-item">Net Payload: <b>{successResult.net_weight_kg.toLocaleString()} kg</b></span>
              <span className="chip-item">Status: <b>{successResult.shipment_status}</b></span>
            </div>
          </div>
          <div className="success-actions">
            {onNavigateToTwin && (
              <button type="button" className="btn-success-action" onClick={onNavigateToTwin}>
                <Box size={14} />
                <span>View in 3D Digital Twin</span>
              </button>
            )}
            {onNavigateToQueue && (
              <button type="button" className="btn-success-action secondary" onClick={onNavigateToQueue}>
                <Clock3 size={14} />
                <span>View in Waiting Queue</span>
              </button>
            )}
            <button
              type="button"
              className="btn-success-action secondary"
              onClick={() => {
                loadPreset('32ft_urgent')
                setSuccessResult(null)
              }}
            >
              <RefreshCw size={14} />
              <span>Inward Another Vehicle</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== THE FORM ===================== */}
      <form onSubmit={handleSubmit} className="inward-form-grid">

        {/* SECTION 1: VEHICLE & CARRIER IDENTIFICATION */}
        <div className="form-section-card">
          <div className="section-head">
            <div className="section-num red-num">1</div>
            <div>
              <h3>Vehicle &amp; Transporter Identification</h3>
              <p>Physical vehicle registration and logistics fleet partner</p>
            </div>
          </div>

          <div className="section-fields-grid">
            <label className="field-group">
              <span className="label-text">Vehicle License Plate / ID <b className="req">*</b></span>
              <div className="input-with-icon">
                <Truck size={15} className="field-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-04-EL-8842"
                  value={form.vehicle_id}
                  onChange={e => setForm({ ...form, vehicle_id: e.target.value.toUpperCase() })}
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label-text">Transporter / Carrier <b className="req">*</b></span>
              <select
                value={form.carrier}
                onChange={e => setForm({ ...form, carrier: e.target.value })}
              >
                {CARRIERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Vehicle Freight Type <b className="req">*</b></span>
              <select
                value={form.vehicle_type}
                onChange={e => {
                  const vt = VEHICLE_TYPES.find(v => v.id === e.target.value)
                  setForm({
                    ...form,
                    vehicle_type: e.target.value,
                    tare_weight_kg: vt ? vt.defaultTare : form.tare_weight_kg,
                  })
                }}
              >
                {VEHICLE_TYPES.map(vt => (
                  <option key={vt.id} value={vt.id}>{vt.label}</option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Driver Full Name</span>
              <div className="input-with-icon">
                <User size={15} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.driver_name}
                  onChange={e => setForm({ ...form, driver_name: e.target.value })}
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label-text">Driver Contact Mobile</span>
              <div className="input-with-icon">
                <Phone size={15} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. +91 98450 12345"
                  value={form.driver_phone}
                  onChange={e => setForm({ ...form, driver_phone: e.target.value })}
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label-text">FASTag / RFID Tag ID</span>
              <div className="input-with-icon">
                <Radio size={15} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. FASTAG-KA04-8842"
                  value={form.rfid_tag}
                  onChange={e => setForm({ ...form, rfid_tag: e.target.value })}
                />
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 2: PLANT & WAREHOUSE ALLOCATION */}
        <div className="form-section-card">
          <div className="section-head">
            <div className="section-num purple-num">2</div>
            <div>
              <h3>Plant, Staging Dock &amp; Warehouse Location</h3>
              <p>Manufacturing complex, dock bay and staging priority</p>
            </div>
          </div>

          <div className="section-fields-grid">
            <label className="field-group">
              <span className="label-text">Facility / Plant Complex</span>
              <select
                value={form.plant_id}
                onChange={e => setForm({ ...form, plant_id: e.target.value })}
              >
                <option value="IN-KA-01">IN-KA-01 (Apex Machining Complex · KA)</option>
                <option value="IN-TN-01">IN-TN-01 (Southern Logistics Park · TN)</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Target Warehouse</span>
              <select
                value={form.warehouse_id}
                onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
              >
                <option value="FG-WH-01">FG-WH-01 (Finished Goods Warehouse)</option>
                <option value="WH-02">WH-02 (Sub-Assembly Staging Yard)</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Allocated Dock Bay</span>
              <select
                value={form.dock_bay}
                onChange={e => setForm({ ...form, dock_bay: e.target.value })}
              >
                <option value="Bay 01">Bay 01 (Heavy 32FT Staging)</option>
                <option value="Bay 02">Bay 02 (High-SLA Fastag Corridor)</option>
                <option value="Bay 03">Bay 03 (Medium 20FT Buffer)</option>
                <option value="Bay 04">Bay 04 (Express Regional)</option>
                <option value="Bay 05">Bay 05 (Trailer 40FT Heavy)</option>
                <option value="Bay 06">Bay 06 (Intra-Plant Yard)</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Dispatch Priority SLA</span>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              >
                <option value="P1">P1 - Immediate / Assembly Line Feed</option>
                <option value="P2">P2 - Standard Scheduled Delivery</option>
                <option value="P3">P3 - Flexible Buffer Load</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Current Operational Stage</span>
              <select
                value={form.current_stage}
                onChange={e => setForm({ ...form, current_stage: e.target.value })}
              >
                <option value="GATE_INWARD">1. Gate Inward (Entry Gate In)</option>
                <option value="WEIGHBRIDGE_IN">2. Weighbridge Inward (Tare Scale WB-01)</option>
                <option value="DOCK_STAGING">3. Dock Staging (Bay Loading)</option>
                <option value="QUALITY_SEAL">4. Quality Seal &amp; Security Cleared</option>
                <option value="WEIGHBRIDGE_OUT">5. Weighbridge Outward (Gross Scale)</option>
                <option value="GATE_OUT_DISPATCH">6. Gate Out (In Transit Corridor)</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Gate Pass Number</span>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={form.gate_pass_no}
                onChange={e => setForm({ ...form, gate_pass_no: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* SECTION 3: CUSTOMER ORDER & CARGO ALLOCATION */}
        <div className="form-section-card">
          <div className="section-head">
            <div className="section-num purple-num">3</div>
            <div>
              <h3>Customer Order &amp; Cargo Bill of Materials</h3>
              <p>Commercial consignment, order reference and shipment quantity</p>
            </div>
          </div>

          <div className="section-fields-grid">
            <label className="field-group">
              <span className="label-text">Consignee / Customer Name</span>
              <select
                value={form.customer_name}
                onChange={e => {
                  const cust = CUSTOMERS.find(c => c.name === e.target.value)
                  setForm({
                    ...form,
                    customer_name: e.target.value,
                    plant_id: cust ? cust.plant : form.plant_id,
                  })
                }}
              >
                {CUSTOMERS.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Customer Order ID</span>
              <input
                type="text"
                placeholder="e.g. CO-001285 (Auto-generated if empty)"
                value={form.customer_order_id}
                onChange={e => setForm({ ...form, customer_order_id: e.target.value })}
              />
            </label>

            <label className="field-group">
              <span className="label-text">Material / Product SKU</span>
              <select
                value={form.product_id}
                onChange={e => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="PRD-CAM-01">PRD-CAM-01 (Engine Camshafts · Machined)</option>
                <option value="PRD-STR-02">PRD-STR-02 (Steering Gearbox Units)</option>
                <option value="PRD-BRK-03">PRD-BRK-03 (Brake Caliper Assemblies)</option>
                <option value="PRD-ELC-04">PRD-ELC-04 (Ignition Control Modules)</option>
                <option value="PRD-CHN-05">PRD-CHN-05 (Automotive Sprocket Kits)</option>
              </select>
            </label>

            <label className="field-group">
              <span className="label-text">Shipment Order Quantity (Units)</span>
              <input
                type="number"
                min="1"
                max="5000"
                value={form.shipment_qty}
                onChange={e => setForm({ ...form, shipment_qty: Number(e.target.value) })}
              />
            </label>

            <label className="field-group">
              <span className="label-text">Contracted Freight Cost (₹ INR)</span>
              <input
                type="number"
                min="1000"
                max="500000"
                step="500"
                value={form.freight_cost_inr}
                onChange={e => setForm({ ...form, freight_cost_inr: Number(e.target.value) })}
              />
            </label>

            <label className="field-group">
              <span className="label-text">Planned Target TAT (Hours)</span>
              <input
                type="number"
                min="4"
                max="240"
                step="1"
                value={form.planned_tat_hrs}
                onChange={e => setForm({ ...form, planned_tat_hrs: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        {/* SECTION 4: WEIGHBRIDGE & SECURITY CHECKPOINTS */}
        <div className="form-section-card">
          <div className="section-head">
            <div className="section-num red-num">4</div>
            <div>
              <h3>Weighbridge Tare &amp; Gross Payload Scales</h3>
              <p>Certified weighbridge weights, container seal and telemetry</p>
            </div>
          </div>

          <div className="section-fields-grid">
            <label className="field-group">
              <span className="label-text">Tare Weight (kg) · Empty Scale</span>
              <div className="input-with-icon">
                <Scale size={15} className="field-icon" />
                <input
                  type="number"
                  min="500"
                  max="30000"
                  value={form.tare_weight_kg}
                  onChange={e => setForm({ ...form, tare_weight_kg: Number(e.target.value) })}
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label-text">Gross Weight (kg) · Loaded Scale</span>
              <div className="input-with-icon">
                <Scale size={15} className="field-icon" />
                <input
                  type="number"
                  min="500"
                  max="60000"
                  value={form.gross_weight_kg}
                  onChange={e => setForm({ ...form, gross_weight_kg: Number(e.target.value) })}
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label-text">Container Security Seal No</span>
              <input
                type="text"
                placeholder="e.g. SEAL-KA-8842-A"
                value={form.seal_no}
                onChange={e => setForm({ ...form, seal_no: e.target.value })}
              />
            </label>

            <label className="field-group">
              <span className="label-text">Quality Inspection Status</span>
              <select
                value={form.qc_status}
                onChange={e => setForm({ ...form, qc_status: e.target.value })}
              >
                <option value="PASSED">Passed · QC Cleared</option>
                <option value="PENDING">Pending Final Lab Sign-off</option>
                <option value="HOLD">Conditional Hold</option>
              </select>
            </label>

            <label className="field-group full-width-field">
              <span className="label-text">Operational Dispatch Notes</span>
              <textarea
                rows={2}
                placeholder="Add special instructions, corridor notes, or gate inspection findings..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </div>

          {/* Real-Time Weight & Utilization Calculator Pill */}
          <div className="weight-calc-summary-bar">
            <div className="calc-item">
              <span>Tare Weight:</span>
              <b>{Number(form.tare_weight_kg).toLocaleString()} kg</b>
            </div>
            <span className="calc-sep">→</span>
            <div className="calc-item">
              <span>Gross Weight:</span>
              <b>{Number(form.gross_weight_kg).toLocaleString()} kg</b>
            </div>
            <span className="calc-sep">=</span>
            <div className="calc-item highlight-calc">
              <span>Net Cargo Payload:</span>
              <b>{netWeightKg.toLocaleString()} kg</b>
            </div>
            <div className="util-bar-wrapper">
              <div className="util-label-row">
                <span>Capacity Utilization:</span>
                <b>{utilizationPct}%</b>
              </div>
              <div className="util-track">
                <div
                  className="util-fill"
                  style={{
                    width: `${utilizationPct}%`,
                    background: utilizationPct > 90 ? '#10b981' : utilizationPct > 70 ? '#0ea5e9' : '#f59e0b',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT ROW */}
        <div className="form-submit-row">
          <div className="submit-disclaimer">
            <ShieldCheck size={16} color="#10b981" />
            <span>
              Submitting registers this vehicle immediately into <b>fact_shipment_milestone</b> and triggers live agent intelligence across 3D Digital Twin &amp; Operations Tower.
            </span>
          </div>

          <div className="submit-buttons-wrap">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => loadPreset('32ft_urgent')}
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-submit-inward"
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>Entering Vehicle into Operations Database...</span>
                </>
              ) : (
                <>
                  <Truck size={15} />
                  <span>Submit Vehicle Entry-to-Exit Record</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
