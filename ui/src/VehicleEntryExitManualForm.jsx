import { useState, useMemo } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Award, BarChart3, Bot,
  Box, Check, CheckCircle2, ChevronRight, Clock, Clock3, Cpu,
  Database, Download, ExternalLink, FileSpreadsheet, FileText,
  HelpCircle, Laptop, Layers, LayoutDashboard, Lock, Monitor,
  Navigation, Phone, Play, Printer, QrCode, Radio, RefreshCw,
  RotateCcw, Scale, Scan, Server, Settings, ShieldAlert,
  ShieldCheck, Sparkles, Table2, Terminal, Truck, Unlock,
  User, Users, Warehouse, Wifi, X, Zap
} from 'lucide-react'

// ============================================================================
// CARGO / LOAD CLASSIFICATIONS & VEHICLE-WISE INSPECTION PROTOCOLS
// ============================================================================
export const LOAD_CATEGORIES = {
  FINISHED_GOODS: {
    id: 'FINISHED_GOODS',
    label: 'Finished Automotive Goods (FG)',
    shortName: 'Finished Goods',
    subtitle: 'Precision Engine Camshafts, Steering Gears & Assemblies',
    icon: Truck,
    color: '#2563eb',
    badge: 'FG COMMERCIAL DISPATCH',
    hazardClass: 'NON-HAZARDOUS · CLASS A COMMERCIAL',
    defaultBay: 'Bay 02',
    defaultWarehouse: 'FG-WH-01',
    defaultRoute: 'DOCK_STAGING',
    routeLabel: 'Direct Staging Docks (Bay 01 - 04)',
    recommendedVehicle: '32FT_TRUCK',
    gateInspectionProtocol: 'E-Way Bill validation, Tamper-Evident High-Security Bolt Seal match, Pallet Tally',
    checkpoints: [
      { id: 'eway_bill', label: 'E-Way Bill & Tax Invoice match active ERP Customer Order', mandatory: true },
      { id: 'tamper_seal', label: 'Tamper-Evident Container Bolt Seal intact & verified against manifest', mandatory: true },
      { id: 'pallet_tally', label: 'Pallet shrink-wrap intact; physical carton count matches delivery challan', mandatory: true },
      { id: 'tarpaulin_weather', label: 'Vehicle cargo bay clean, dry, weather-proof with no moisture ingress', mandatory: false },
    ],
    sampleProduct: 'PRD-CAM-01',
    sampleCustomer: 'TVS Motor Hosur',
    sampleCarrier: 'VRL Logistics',
    sampleDriver: 'Ramesh Kumar',
    samplePhone: '+91 98450 12345',
    sampleTare: 11200,
    sampleGross: 28450,
    sampleQty: 450,
    sampleFreight: 48500,
  },
  RAW_MATERIALS: {
    id: 'RAW_MATERIALS',
    label: 'Heavy Raw Materials & Metal Billets',
    shortName: 'Raw Materials',
    subtitle: 'Steel Coils, Alloy Castings, Aluminum Billets & Sheet Metal',
    icon: Scale,
    color: '#d97706',
    badge: 'COMPULSORY WEIGHBRIDGE WB-01',
    hazardClass: 'STRUCTURAL OVERLOAD & AXLE STRAIN RISK',
    defaultBay: 'Bay 05',
    defaultWarehouse: 'WH-02',
    defaultRoute: 'WEIGHBRIDGE_IN',
    routeLabel: 'Compulsory Dual Weighbridge Scales (WB-01 & WB-02)',
    recommendedVehicle: '40FT_TRAILER',
    gateInspectionProtocol: 'Mill Test Certificate (MTC) Heat Batch Verification, Gross/Tare Axle Load Audit',
    checkpoints: [
      { id: 'mtc_cert', label: 'Mill Test Certificate (MTC) & Metallurgical Heat Batch validated', mandatory: true },
      { id: 'weighbridge_slip', label: 'Compulsory Gross Scale WB-01 verified before inward movement', mandatory: true },
      { id: 'tie_down_chains', label: 'High-tensile steel lashings and ratchet tie-down chains certified (>5T)', mandatory: true },
      { id: 'axle_overload', label: 'Axle load distribution within legal NHAI road limits (<=10.2T/axle)', mandatory: false },
    ],
    sampleProduct: 'PRD-BRK-03',
    sampleCustomer: 'Bajaj Auto Pune',
    sampleCarrier: 'TCI Freight',
    sampleDriver: 'Satish Shinde',
    samplePhone: '+91 98220 99432',
    sampleTare: 14500,
    sampleGross: 38200,
    sampleQty: 850,
    sampleFreight: 62000,
  },
  HAZMAT_CHEMICALS: {
    id: 'HAZMAT_CHEMICALS',
    label: 'Hazardous Materials & Li-ion Batteries',
    shortName: 'Hazmat / Battery',
    subtitle: 'Lithium-Ion Battery Modules, Solvents, Coolants & Electrolytes',
    icon: AlertTriangle,
    color: '#dc2626',
    badge: 'UN CLASS 9 & 3 DANGEROUS GOODS',
    hazardClass: 'FLAMMABLE / REACTIVE CHEMICAL (UN 3480 / UN 1993)',
    defaultBay: 'Bay 06',
    defaultWarehouse: 'WH-02',
    defaultRoute: 'DOCK_STAGING',
    routeLabel: 'Isolated Hazmat Yard & Flameproof Staging Bay 06',
    recommendedVehicle: '20FT_TRUCK',
    gateInspectionProtocol: '16-Point MSDS Compliance, Driver Hazmat Tremcard, Fire Safety & Spark Arrestor',
    checkpoints: [
      { id: 'msds_sheet', label: '16-Point Material Safety Data Sheet (MSDS / SDS) verified & on-dash', mandatory: true },
      { id: 'un_placards', label: 'UN Hazard Class 9 / Class 3 diamond placards visible on all 4 vehicle sides', mandatory: true },
      { id: 'driver_hazmat', label: 'Driver Dangerous Goods (Hazmat) Endorsement & Tremcard valid', mandatory: true },
      { id: 'fire_extinguisher', label: '2x 10kg ABC Dry Powder Fire Extinguishers charged; exhaust spark arrestor fitted', mandatory: true },
      { id: 'spill_kit', label: 'Chemical spill neutralization kit and static grounding cable verified', mandatory: false },
    ],
    sampleProduct: 'PRD-ELC-04',
    sampleCustomer: 'Hero MotoCorp Haridwar',
    sampleCarrier: 'Safexpress Hazmat Logistics',
    sampleDriver: 'Manpreet Singh',
    samplePhone: '+91 98110 33871',
    sampleTare: 5800,
    sampleGross: 13900,
    sampleQty: 320,
    sampleFreight: 54000,
  },
  HIGH_VALUE_ELECTRONICS: {
    id: 'HIGH_VALUE_ELECTRONICS',
    label: 'High-Value Sensitive Electronics',
    shortName: 'High-Value Electronics',
    subtitle: 'ADAS Radar Cameras, Microcontroller ECUs, TFT Infotainment',
    icon: Cpu,
    color: '#7c3aed',
    badge: 'HIGH-SECURITY ARMED ESCORT',
    hazardClass: 'ESD SENSITIVE / COMMERCIAL VALUE CLASS AAA',
    defaultBay: 'Bay 02',
    defaultWarehouse: 'FG-WH-01',
    defaultRoute: 'DOCK_STAGING',
    routeLabel: 'CCTV-Monitored Vault Staging Bay 02',
    recommendedVehicle: 'VAN',
    gateInspectionProtocol: 'Active RFID Tamper-Seal validation, Shock/Tilt Impact Loggers, Armed Escort Handover',
    checkpoints: [
      { id: 'rfid_active', label: 'Active RFID electronic seal verified against central gate authorization server', mandatory: true },
      { id: 'shock_indicator', label: 'Impact shock & tilt sensor indicator < 2.0G (no drop/vibration damage)', mandatory: true },
      { id: 'esd_moisture', label: 'Anti-static ESD vacuum moisture bags sealed with active cobalt indicator cards', mandatory: true },
      { id: 'security_escort', label: 'Armed security marshal transfer log signed by gate officer', mandatory: false },
    ],
    sampleProduct: 'PRD-ELC-04',
    sampleCustomer: 'Bosch Bangalore',
    sampleCarrier: 'Blue Dart Apex Secure',
    sampleDriver: 'Gopal Krishnan',
    samplePhone: '+91 94440 98765',
    sampleTare: 1250,
    sampleGross: 2450,
    sampleQty: 650,
    sampleFreight: 41000,
  },
  RETURNABLE_PACKAGING: {
    id: 'RETURNABLE_PACKAGING',
    label: 'Returnable Packaging & Pallets',
    shortName: 'Returnable Packaging',
    subtitle: 'Euro Wooden Pallets, Collapsible KLT Crates & Wire Stillage',
    icon: RotateCcw,
    color: '#059669',
    badge: 'RETURNABLE GATE PASS (RGP)',
    hazardClass: 'CIRCULAR ASSET / REUSABLE PACKAGING',
    defaultBay: 'Bay 03',
    defaultWarehouse: 'WH-02',
    defaultRoute: 'DOCK_STAGING',
    routeLabel: 'Returnable Packaging Sorter Yard & Wash Conveyor',
    recommendedVehicle: '16FT_TRUCK',
    gateInspectionProtocol: 'Returnable Gate Pass (RGP) Tally, ISPM-15 Phytosanitary Heat Stamp Audit',
    checkpoints: [
      { id: 'rgp_pass', label: 'Returnable Gate Pass (RGP) serial number matches original outward delivery challan', mandatory: true },
      { id: 'count_tally', label: 'Physical unit count of wooden pallets/crates matches declared quantity (0 variance)', mandatory: true },
      { id: 'ispm_stamp', label: 'ISPM-15 Wood Heat-Treatment stamp verified (fumigation certified)', mandatory: false },
      { id: 'hygiene_check', label: 'Crates free of oil stains, metal burrs, biological residue, or structural breaks', mandatory: false },
    ],
    sampleProduct: 'PRD-STR-02',
    sampleCustomer: 'Royal Enfield Chennai',
    sampleCarrier: 'Gati KWE Logistics',
    sampleDriver: 'Murugan Selvam',
    samplePhone: '+91 97890 12845',
    sampleTare: 3400,
    sampleGross: 7600,
    sampleQty: 380,
    sampleFreight: 22000,
  },
  MACHINERY_SPARES: {
    id: 'MACHINERY_SPARES',
    label: 'Critical Machinery Spares & Tooling',
    shortName: 'Machinery Tooling',
    subtitle: 'CNC Spindle Heads, High-Speed Tooling, Hydraulic Valves & Pumps',
    icon: Settings,
    color: '#475569',
    badge: 'CAPITAL ASSET GATE PASS (CAGP)',
    hazardClass: 'PLANT CRITICAL / ASSEMBLY LINE-STOP RISK',
    defaultBay: 'Bay 01',
    defaultWarehouse: 'WH-02',
    defaultRoute: 'DOCK_STAGING',
    routeLabel: 'Plant Tool Crib & Line Maintenance Staging Dock',
    recommendedVehicle: 'VAN',
    gateInspectionProtocol: 'Capital Asset Gate Pass (CAGP), Maintenance HOD Sign-off, OEM Serial Match',
    checkpoints: [
      { id: 'cagp_pass', label: 'Capital Asset Gate Pass (CAGP) endorsed by Plant Engineering Maintenance HOD', mandatory: true },
      { id: 'oem_serial', label: 'Engraved OEM serial number matches emergency line-breakdown work order', mandatory: true },
      { id: 'calibration_cert', label: 'Factory calibration certificate & micrometer tolerance test sheet attached', mandatory: true },
      { id: 'dept_receiver', label: 'Plant Maintenance receiving technician present at gate for physical verification', mandatory: false },
    ],
    sampleProduct: 'PRD-CHN-05',
    sampleCustomer: 'TVS Motor Hosur',
    sampleCarrier: 'DHL Express',
    sampleDriver: 'Anand Kulkarni',
    samplePhone: '+91 98800 66219',
    sampleTare: 1250,
    sampleGross: 2150,
    sampleQty: 6,
    sampleFreight: 18500,
  },
}

const VEHICLE_TYPES = [
  { id: '32FT_TRUCK', label: '10W Heavy (32FT / 25T Container)', maxKg: 18000, defaultTare: 11200 },
  { id: '20FT_TRUCK', label: '6W Medium (20FT / 11T Container)', maxKg: 8500, defaultTare: 5800 },
  { id: '40FT_TRAILER', label: '14W Multi-Axle (40FT Trailer / 35T)', maxKg: 28000, defaultTare: 14500 },
  { id: '16FT_TRUCK', label: '4W Intermediate (16FT / 7T Truck)', maxKg: 5000, defaultTare: 3400 },
  { id: 'VAN', label: 'Light Commercial (Dost / 2.5T)', maxKg: 1500, defaultTare: 1250 },
]

const CARRIERS = [
  'VRL Logistics',
  'Blue Dart Apex Secure',
  'Safexpress Hazmat Logistics',
  'DHL Express',
  'TCI Freight',
  'Delhivery',
  'Gati KWE Logistics',
]

const CUSTOMERS = [
  { id: 'CUST-001', name: 'TVS Motor Hosur', plant: 'IN-TN-01', product: 'PRD-CAM-01' },
  { id: 'CUST-002', name: 'Bajaj Auto Pune', plant: 'IN-KA-01', product: 'PRD-STR-02' },
  { id: 'CUST-003', name: 'Bosch Bangalore', plant: 'IN-KA-01', product: 'PRD-BRK-03' },
  { id: 'CUST-004', name: 'Hero MotoCorp Haridwar', plant: 'IN-KA-01', product: 'PRD-ELC-04' },
  { id: 'CUST-005', name: 'Royal Enfield Chennai', plant: 'IN-TN-01', product: 'PRD-CHN-05' },
]

export default function VehicleEntryExitManualForm({ authFetch, onToast, onNavigateToTwin, onNavigateToQueue }) {
  const [selectedLoadType, setSelectedLoadType] = useState('FINISHED_GOODS')
  const currentCategory = LOAD_CATEGORIES[selectedLoadType] || LOAD_CATEGORIES.FINISHED_GOODS

  // Checklist state for the active load type
  const [checklist, setChecklist] = useState(() => {
    const initial = {}
    currentCategory.checkpoints.forEach(cp => {
      initial[cp.id] = true
    })
    return initial
  })

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

  const [showSlipPreview, setShowSlipPreview] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successResult, setSuccessResult] = useState(null)

  // Auto calculate net weight and utilization
  const selectedVType = VEHICLE_TYPES.find(v => v.id === form.vehicle_type) || VEHICLE_TYPES[0]
  const netWeightKg = Math.max(Number(form.gross_weight_kg || 0) - Number(form.tare_weight_kg || 0), 0)
  const maxPayload = selectedVType.maxKg || 18000
  const utilizationPct = Math.min(Math.round((netWeightKg / maxPayload) * 1000) / 10, 100)

  // Gate clearance calculation based on checklist
  const gateVerdict = useMemo(() => {
    const checks = currentCategory.checkpoints
    const mandatoryChecks = checks.filter(c => c.mandatory)
    const failedMandatory = mandatoryChecks.filter(c => !checklist[c.id])
    const totalPassed = checks.filter(c => checklist[c.id]).length

    if (failedMandatory.length > 0) {
      const isSealOrEway = failedMandatory.some(c => ['eway_bill', 'tamper_seal', 'msds_sheet', 'rfid_active'].includes(c.id))
      return {
        status: isSealOrEway ? 'HOLD_PHYSICAL_INSPECTION' : 'HOLD_DOCUMENT_MISMATCH',
        title: 'HOLD: SECONDARY PHYSICAL CARGO INSPECTION REQUIRED',
        verdictText: 'Entry Hold',
        barrier: 'LOWERED',
        tone: 'hold',
        reason: `Discrepancy detected in ${failedMandatory.map(c => c.label.split(' ')[0]).join(', ')}. Marshal must hold vehicle in Quarantine Inspection Bay.`,
        allPassed: false,
        passedCount: totalPassed,
        totalCount: checks.length,
      }
    }

    // All mandatory passed
    let approvedStatus = 'APPROVED_DOCKS'
    if (selectedLoadType === 'RAW_MATERIALS') approvedStatus = 'APPROVED_WEIGHBRIDGE'
    else if (selectedLoadType === 'HAZMAT_CHEMICALS') approvedStatus = 'APPROVED_HAZMAT_YARD'
    else if (selectedLoadType === 'MACHINERY_SPARES') approvedStatus = 'APPROVED_MAINTENANCE'

    return {
      status: approvedStatus,
      title: 'SECURITY CLEARANCE AUTHORIZED · GATE-IN APPROVED',
      verdictText: 'Clearance Granted',
      barrier: 'RAISED',
      tone: 'approved',
      reason: `All cargo-specific safety and verification protocols validated for ${currentCategory.shortName}. Authorized for entry to ${currentCategory.routeLabel}.`,
      allPassed: true,
      passedCount: totalPassed,
      totalCount: checks.length,
    }
  }, [selectedLoadType, checklist, currentCategory])

  // Handle switching cargo load classification
  const handleSelectLoadType = (typeId) => {
    setSelectedLoadType(typeId)
    const cat = LOAD_CATEGORIES[typeId]
    if (!cat) return

    // Reset checklist to all passed
    const nextChecklist = {}
    cat.checkpoints.forEach(cp => {
      nextChecklist[cp.id] = true
    })
    setChecklist(nextChecklist)

    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000) % 10000

    setForm(prev => ({
      ...prev,
      vehicle_id: `${typeId === 'HAZMAT_CHEMICALS' ? 'MH-12-HZ' : typeId === 'RAW_MATERIALS' ? 'KA-08-CR' : typeId === 'HIGH_VALUE_ELECTRONICS' ? 'DL-01-HV' : typeId === 'RETURNABLE_PACKAGING' ? 'TN-22-RG' : 'KA-04-EL'}-${ts}`,
      carrier: cat.sampleCarrier,
      vehicle_type: cat.recommendedVehicle,
      dock_bay: cat.defaultBay,
      warehouse_id: cat.defaultWarehouse,
      current_stage: cat.defaultRoute,
      customer_name: cat.sampleCustomer,
      product_id: cat.sampleProduct,
      driver_name: cat.sampleDriver,
      driver_phone: cat.samplePhone,
      rfid_tag: `FASTAG-${typeId.substring(0, 3)}-${ts}`,
      gate_pass_no: `GP-GATE01-${ts}`,
      tare_weight_kg: cat.sampleTare,
      gross_weight_kg: cat.sampleGross,
      shipment_qty: cat.sampleQty,
      freight_cost_inr: cat.sampleFreight,
      seal_no: `SEAL-${typeId.substring(0, 3)}-${ts}`,
      notes: `${cat.label} verified at Security Gate-01. Route: ${cat.routeLabel}.`,
    }))
    setSuccessResult(null)
  }

  // Toggle single checklist checkpoint
  const toggleCheckpoint = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Quick actions
  const passAllChecks = () => {
    const nextChecklist = {}
    currentCategory.checkpoints.forEach(cp => {
      nextChecklist[cp.id] = true
    })
    setChecklist(nextChecklist)
    onToast?.(`✓ All ${currentCategory.checkpoints.length} security checks verified as PASSED`)
  }

  const simulateDiscrepancy = () => {
    const checks = currentCategory.checkpoints
    const targetCheck = checks[1] || checks[0]
    setChecklist(prev => ({
      ...prev,
      [targetCheck.id]: false,
    }))
    onToast?.(`⚠️ Simulated Discrepancy: ${targetCheck.label.slice(0, 40)}... flag raised!`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicle_id.trim()) {
      onToast?.('Please enter a valid Vehicle License Plate ID.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        load_type: currentCategory.id,
        inspection_verdict: gateVerdict.status,
        hazard_class: currentCategory.hazardClass,
        security_marshal: 'Marshal Inspector K. Venkatesh (SEC-884)',
        checklist_status: gateVerdict.allPassed ? 'ALL_PASSED' : 'HOLD_FLAGGED',
      }

      const res = await authFetch('/api/vehicles/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not record vehicle security gate entry')
      }

      const data = await res.json()
      setSuccessResult({
        ...data,
        loadCategory: currentCategory,
        gateVerdict,
      })
      onToast?.(`✓ Vehicle ${data.vehicle_id} cleared Security Gate! Gate Pass: ${data.gate_pass_no}`)
    } catch (err) {
      onToast?.(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="manual-inward-wrapper">

      {/* ===================== SECURITY GATE COCKPIT HEADER ===================== */}
      <div className="security-gate-cockpit">
        <div className="gate-cockpit-top">
          <div className="gate-title-meta">
            <div className="gate-eyebrow">
              <span className="live-dot" />
              <span>MAIN SECURITY GATE-01 · INWARD INSPECTION &amp; CARGO CLASSIFICATION</span>
              <span className="gate-badge-tag">APEX SECURITY CONTROLLER</span>
            </div>
            <h2>
              <ShieldCheck size={24} color="#2563eb" />
              <span>Vehicle-Wise Security Gate Inwarding &amp; Cargo Inspection Checkpoint</span>
            </h2>
            <p>
              Inspect incoming commercial fleet based on <b>specific cargo load types</b> (Finished Goods, Heavy Raw Materials, Hazmat Batteries, High-Value Electronics, Returnables, Tooling Spares). Dynamic safety checklists, boom barrier authorization, and certified weighbridge scale routing.
            </p>
          </div>

          <div className="inward-presets-bar">
            <span className="presets-label">1-Click Load Presets:</span>
            <button
              type="button"
              className={`preset-pill-btn ${selectedLoadType === 'FINISHED_GOODS' ? 'active-preset' : ''}`}
              onClick={() => handleSelectLoadType('FINISHED_GOODS')}
            >
              <Truck size={13} color="#2563eb" />
              <span>Finished Goods (TVS)</span>
            </button>
            <button
              type="button"
              className={`preset-pill-btn ${selectedLoadType === 'RAW_MATERIALS' ? 'active-preset' : ''}`}
              onClick={() => handleSelectLoadType('RAW_MATERIALS')}
            >
              <Scale size={13} color="#d97706" />
              <span>Steel Coils (JSW)</span>
            </button>
            <button
              type="button"
              className={`preset-pill-btn ${selectedLoadType === 'HAZMAT_CHEMICALS' ? 'active-preset' : ''}`}
              onClick={() => handleSelectLoadType('HAZMAT_CHEMICALS')}
            >
              <AlertTriangle size={13} color="#dc2626" />
              <span>Hazmat Li-ion (UN 3480)</span>
            </button>
            <button
              type="button"
              className={`preset-pill-btn ${selectedLoadType === 'HIGH_VALUE_ELECTRONICS' ? 'active-preset' : ''}`}
              onClick={() => handleSelectLoadType('HIGH_VALUE_ELECTRONICS')}
            >
              <Cpu size={13} color="#7c3aed" />
              <span>High-Value ECUs (Bosch)</span>
            </button>
            <button
              type="button"
              className={`preset-pill-btn ${selectedLoadType === 'RETURNABLE_PACKAGING' ? 'active-preset' : ''}`}
              onClick={() => handleSelectLoadType('RETURNABLE_PACKAGING')}
            >
              <RotateCcw size={13} color="#059669" />
              <span>Returnable Pallets (RGP)</span>
            </button>
          </div>
        </div>

        {/* Live Gate Telemetry Sensors Strip */}
        <div className="gate-live-telemetry-strip">
          <div className="gate-sensor-pill active-pulse">
            <span className="sensor-dot" />
            <span>FASTag Reader: <b>FASTAG-ANT-01 (ACTIVE 865 MHz)</b></span>
          </div>
          <div className="gate-sensor-pill active-pulse">
            <span className="sensor-dot" />
            <span>ALPR Camera: <b>OCR ACCURACY 99.4% (LANE 01)</b></span>
          </div>
          <div className="gate-sensor-pill active-pulse">
            <span className="sensor-dot" />
            <span>Breathalyzer Test: <b>0.00% BAC (PASSED · FIT)</b></span>
          </div>
          <div className="gate-sensor-pill">
            <User size={13} color="#64748b" />
            <span>Gate Marshal: <b>Inspector K. Venkatesh (SEC-884)</b></span>
          </div>
        </div>
      </div>

      {/* ===================== CARGO LOAD TYPE SELECTOR CARDS ===================== */}
      <div className="cargo-classification-wrapper">
        <div className="cargo-classification-header">
          <h3>
            <Layers size={16} color="#475569" />
            <span>Step 1: Select Vehicle Cargo Load Classification Inside Vehicle</span>
          </h3>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            Checklist protocols and gate routing automatically adapt to the cargo category.
          </span>
        </div>

        <div className="cargo-classification-grid">
          {Object.values(LOAD_CATEGORIES).map(cat => {
            const Icon = cat.icon
            const isSelected = selectedLoadType === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                className={`cargo-card-btn ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? cat.color : undefined,
                }}
                onClick={() => handleSelectLoadType(cat.id)}
              >
                {isSelected && (
                  <div
                    className="cargo-card-accent-bar"
                    style={{ background: cat.color }}
                  />
                )}
                <div className="cargo-card-top">
                  <div
                    className="cargo-card-icon-wrap"
                    style={{
                      background: isSelected ? cat.color : 'var(--bg-subtle, #f1f5f9)',
                      color: isSelected ? '#ffffff' : cat.color,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className="cargo-card-badge"
                    style={{
                      background: `${cat.color}15`,
                      color: cat.color,
                      border: `1px solid ${cat.color}35`,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <div className="cargo-card-title">{cat.label}</div>
                <div className="cargo-card-subtitle">{cat.subtitle}</div>

                <div className="cargo-card-route-pill">
                  <Navigation size={11} />
                  <span>Route: {cat.routeLabel.split('(')[0]}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ===================== DYNAMIC INSPECTION CHECKLIST & GATE VERDICT ===================== */}
      <div className="gate-inspection-grid">
        {/* LEFT COLUMN: LOAD-SPECIFIC INSPECTION CHECKLIST */}
        <div className="inspection-checklist-card">
          <div className="checklist-head-row">
            <div>
              <h3>
                <CheckCircle2 size={16} color={currentCategory.color} />
                <span>Step 2: Security Gate Inspection Checklist ({currentCategory.shortName})</span>
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                Mandatory security criteria to permit barrier lift &amp; vehicle inwarding
              </p>
            </div>

            <div className="checklist-quick-actions">
              <button
                type="button"
                className="btn-checklist-action"
                onClick={passAllChecks}
                title="Mark all checks as passed"
              >
                ✓ Pass All ({currentCategory.checkpoints.length})
              </button>
              <button
                type="button"
                className="btn-checklist-action"
                onClick={simulateDiscrepancy}
                title="Simulate a security hold"
              >
                ⚠️ Flag Discrepancy
              </button>
            </div>
          </div>

          {/* Safety Protocol Banner */}
          <div
            className="checklist-protocol-banner"
            style={{
              background: `${currentCategory.color}10`,
              border: `1px solid ${currentCategory.color}30`,
              color: currentCategory.color,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <b>{currentCategory.hazardClass}</b>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Protocol: {currentCategory.gateInspectionProtocol}
              </div>
            </div>
          </div>

          {/* Checkpoints list */}
          <div className="checklist-items-wrap">
            {currentCategory.checkpoints.map(cp => {
              const isChecked = !!checklist[cp.id]
              return (
                <div
                  key={cp.id}
                  className={`checklist-item-row ${isChecked ? 'passed' : cp.mandatory ? 'failed' : ''}`}
                  onClick={() => toggleCheckpoint(cp.id)}
                >
                  <div className={`checklist-checkbox ${isChecked ? 'checked' : 'unchecked'}`}>
                    {isChecked ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </div>
                  <div className="checklist-item-content">
                    <div className="checklist-item-top">
                      {cp.mandatory ? (
                        <span className="tag-mandatory">MANDATORY</span>
                      ) : (
                        <span className="tag-recommended">RECOMMENDED</span>
                      )}
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        ID: {cp.id.toUpperCase()}
                      </span>
                    </div>
                    <div className="checklist-item-text">{cp.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: GATE CLEARANCE VERDICT & BOOM BARRIER CONSOLE */}
        <div className="gate-verdict-card">
          <div className="checklist-head-row">
            <h3>
              <Award size={16} color="#2563eb" />
              <span>Step 3: Automated Security Clearance Verdict</span>
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
              {gateVerdict.passedCount} of {gateVerdict.totalCount} Checks Passed
            </span>
          </div>

          {/* Verdict Banner */}
          <div className={`verdict-banner ${gateVerdict.tone}`}>
            <div className="verdict-icon-wrap" style={{
              background: gateVerdict.allPassed ? '#dcfce7' : '#fee2e2',
              color: gateVerdict.allPassed ? '#16a34a' : '#dc2626',
            }}>
              {gateVerdict.allPassed ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div className="verdict-text-block">
              <h4 style={{ color: gateVerdict.allPassed ? '#15803d' : '#b91c1c' }}>
                {gateVerdict.title}
              </h4>
              <p style={{ color: gateVerdict.allPassed ? '#166534' : '#991b1b' }}>
                {gateVerdict.reason}
              </p>
            </div>
          </div>

          {/* Boom Barrier Visual Box */}
          <div className="barrier-visual-box">
            <div className="barrier-status-indicator">
              {gateVerdict.barrier === 'RAISED' ? (
                <Unlock size={18} color="#16a34a" />
              ) : (
                <Lock size={18} color="#dc2626" />
              )}
              <span>Entrance Barrier Arm Status:</span>
            </div>
            <span className={`barrier-arm-tag ${gateVerdict.barrier === 'RAISED' ? 'raised' : 'lowered'}`}>
              BARRIER: {gateVerdict.barrier}
            </span>
          </div>

          {/* Gate Destination Routing */}
          <div style={{
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Designated Inward Routing:</span>
              <b style={{ color: '#0f172a' }}>{currentCategory.routeLabel}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Assigned Dock / Yard:</span>
              <b style={{ color: '#2563eb' }}>{form.dock_bay} ({form.warehouse_id})</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Overload Risk Profile:</span>
              <span style={{ color: utilizationPct > 95 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                {netWeightKg.toLocaleString()} kg ({utilizationPct}% Payload)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn-checklist-action"
              onClick={() => setShowSlipPreview(!showSlipPreview)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FileText size={12} />
              <span>{showSlipPreview ? 'Hide' : 'Show'} Inward Gate Pass Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== REALISTIC DIGITAL INWARD GATE PASS SLIP ===================== */}
      {showSlipPreview && (
        <div className="gate-slip-preview-container">
          <div className="slip-header">
            <div className="slip-brand">
              <h4>APEX PRECISION INDUSTRIAL COMPLEX · SECURITY GATE-01</h4>
              <span>OFFICIAL VEHICLE INWARD INSPECTION CLEARANCE CERTIFICATE</span>
            </div>
            <div className="slip-pass-id">
              <span>GATE PASS NO.</span>
              <b>{form.gate_pass_no || 'GP-GATE01-8842'}</b>
            </div>
          </div>

          <div className="slip-grid">
            <div className="slip-data-item">
              <span className="slip-data-label">Vehicle Registration Plate</span>
              <span className="slip-data-value">{form.vehicle_id}</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Logistics Transporter</span>
              <span className="slip-data-value">{form.carrier}</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Cargo Load Category</span>
              <span className="slip-data-value" style={{ color: currentCategory.color }}>
                {currentCategory.label}
              </span>
            </div>

            <div className="slip-data-item">
              <span className="slip-data-label">Driver Full Name</span>
              <span className="slip-data-value">{form.driver_name} ({form.driver_phone})</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Driver Sobriety &amp; Fitness</span>
              <span className="slip-data-value" style={{ color: '#16a34a' }}>0.00% BAC · FIT (CLEARED)</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">FASTag / RFID Tag ID</span>
              <span className="slip-data-value">{form.rfid_tag || 'FASTAG-VERIFIED'}</span>
            </div>

            <div className="slip-data-item">
              <span className="slip-data-label">Certified Tare Weight (Scale)</span>
              <span className="slip-data-value">{Number(form.tare_weight_kg).toLocaleString()} kg</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Certified Gross Weight (Scale)</span>
              <span className="slip-data-value">{Number(form.gross_weight_kg).toLocaleString()} kg</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Net Cargo Weight / Capacity</span>
              <span className="slip-data-value">{netWeightKg.toLocaleString()} kg ({utilizationPct}%)</span>
            </div>

            <div className="slip-data-item">
              <span className="slip-data-label">Container Security Seal</span>
              <span className="slip-data-value">{form.seal_no || 'SEAL-VERIFIED'}</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Assigned Staging Dock / Yard</span>
              <span className="slip-data-value" style={{ color: '#2563eb' }}>{form.dock_bay} ({form.warehouse_id})</span>
            </div>
            <div className="slip-data-item">
              <span className="slip-data-label">Security Marshal Sign-off</span>
              <span className="slip-data-value">Marshal Inspector K. Venkatesh (SEC-884)</span>
            </div>
          </div>

          <div className="slip-barcode-strip">
            <div className="slip-barcode-mock">
              <Scan size={22} color="#0f172a" />
              <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800 }}>
                *GP-2026-{form.vehicle_id.replace(/[^A-Z0-9]/g, '')}*
              </span>
            </div>

            <div className="slip-stamp-badge" style={{
              borderColor: gateVerdict.allPassed ? '#16a34a' : '#dc2626',
              color: gateVerdict.allPassed ? '#15803d' : '#dc2626',
            }}>
              <CheckCircle2 size={12} />
              <span>{gateVerdict.allPassed ? 'SECURITY CLEARED · GATE-IN' : 'HOLD · PENDING MARSHAL'}</span>
            </div>

            <button
              type="button"
              className="btn-print-slip"
              onClick={() => window.print()}
            >
              <Printer size={13} />
              <span>Print Gate Inward Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== SUCCESS BANNER (IF SUBMITTED) ===================== */}
      {successResult && (
        <div className="inward-success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={32} color="#10b981" />
          </div>
          <div className="success-meta">
            <h4>Vehicle Inward &amp; Security Registration Completed!</h4>
            <p>
              Vehicle <b>{successResult.vehicle_id}</b> ({successResult.carrier}) carrying <b>{successResult.loadCategory?.label || currentCategory.label}</b> has been registered under Gate Pass <code>{successResult.gate_pass_no}</code> and Customer Order <code>{successResult.customer_order_id}</code>.
            </p>
            <div className="success-chips-row">
              <span className="chip-item">Gate Pass: <b>{successResult.gate_pass_no}</b></span>
              <span className="chip-item">Assigned Dock: <b>{successResult.dock_bay}</b></span>
              <span className="chip-item">Net Payload: <b>{successResult.net_weight_kg.toLocaleString()} kg</b></span>
              <span className="chip-item">Status: <b>{successResult.shipment_status}</b></span>
              <span className="chip-item">Clearance: <b>{successResult.inspection_verdict || 'APPROVED_WEIGHBRIDGE'}</b></span>
            </div>
          </div>
          <div className="success-actions">
            {onNavigateToQueue && (
              <button type="button" className="btn-success-action" onClick={onNavigateToQueue}>
                <Clock3 size={14} />
                <span>View in Waiting Queue</span>
              </button>
            )}
            {onNavigateToTwin && (
              <button type="button" className="btn-success-action secondary" onClick={onNavigateToTwin}>
                <Box size={14} />
                <span>View in Control Tower</span>
              </button>
            )}
            <button
              type="button"
              className="btn-success-action secondary"
              onClick={() => {
                handleSelectLoadType('FINISHED_GOODS')
                setSuccessResult(null)
              }}
            >
              <RefreshCw size={14} />
              <span>Inward Another Vehicle</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== COMPLETE VEHICLE REGISTRATION FORM ===================== */}
      <form onSubmit={handleSubmit} className="inward-form-grid">

        {/* SECTION 1: VEHICLE & CARRIER IDENTIFICATION */}
        <div className="form-section-card">
          <div className="section-head">
            <div className="section-num red-num">1</div>
            <div>
              <h3>Vehicle &amp; Transporter Identification</h3>
              <p>Commercial registration, vehicle configuration and driver credentials</p>
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
              <span className="label-text">Transporter / Logistics Carrier <b className="req">*</b></span>
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
              <span className="label-text">FASTag / RFID Transponder ID</span>
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
              <h3>Plant, Dock Bay &amp; Staging Yard Allocation</h3>
              <p>Manufacturing complex, inward gate stage and dispatch priority</p>
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
              <span className="label-text">Target Warehouse / Yard</span>
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
                <option value="Bay 06">Bay 06 (Hazmat &amp; Intra-Plant Yard)</option>
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
                <option value="PRD-ELC-04">PRD-ELC-04 (Ignition &amp; ADAS Control ECUs)</option>
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
              <h3>Weighbridge Scales &amp; Physical Tamper Seal</h3>
              <p>Certified weighbridge weights, container seal and telemetry notes</p>
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
              <span className="label-text">Container Security Seal No.</span>
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
              <span className="label-text">Operational Dispatch &amp; Gate Marshal Notes</span>
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
            <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
            <span>
              Submitting registers this vehicle immediately into <b>fact_shipment_milestone</b> under <b>{currentCategory.label}</b> with status <b>{gateVerdict.status}</b>, triggering live agent intelligence across 3D Digital Twin &amp; Operations Tower.
            </span>
          </div>

          <div className="submit-buttons-wrap">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => handleSelectLoadType('FINISHED_GOODS')}
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-submit-inward"
              style={{
                background: gateVerdict.allPassed
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #d97706, #b45309)',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>Registering at Security Gate-01...</span>
                </>
              ) : (
                <>
                  <Truck size={15} />
                  <span>Submit Vehicle Entry &amp; Gate-In Record</span>
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
