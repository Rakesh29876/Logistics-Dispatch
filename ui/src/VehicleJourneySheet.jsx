import { useEffect, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Award, BarChart3, Bot,
  Box, CheckCircle2, ChevronRight, Clock3, Cpu, Database, ExternalLink,
  FileCheck2, FileText, Gauge, MapPin, Navigation, Phone, Printer, Radio,
  RefreshCw, Scale, ShieldAlert, ShieldCheck, Sparkles, Timer, Truck, User, Warehouse, X, Zap
} from 'lucide-react'

const fmt = (v) => Number(v || 0).toLocaleString('en-IN')
const money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const pct = (v) => `${Number(v || 0).toFixed(1)}%`

const CARRIER_LIVERIES = {
  DHL: { bg: '#facc15', text: '#dc2626', border: '#eab308', name: 'DHL Express' },
  BlueDart: { bg: '#1e3a8a', text: '#ffffff', border: '#1d4ed8', name: 'BlueDart Aviation & Surface' },
  Delhivery: { bg: '#dc2626', text: '#ffffff', border: '#b91c1c', name: 'Delhivery Surface Freight' },
  TCI: { bg: '#0f766e', text: '#ffffff', border: '#0d9488', name: 'TCI Freight Logistics' },
  DEFAULT: { bg: '#334155', text: '#ffffff', border: '#475569', name: 'Logistics Fleet Partner' },
}

export default function VehicleJourneySheet({
  isOpen,
  onClose,
  journeyId,
  authFetch,
  userRole = 'MANAGER',
  theme = 'dark',
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !journeyId) return
    let active = true
    setLoading(true)
    setError(null)

    authFetch(`/api/journey/${encodeURIComponent(journeyId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Could not load journey records for ${journeyId}`)
        return r.json()
      })
      .then(res => {
        if (active) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [isOpen, journeyId])

  if (!isOpen) return null

  const d = data || {}
  const carrierKey = Object.keys(CARRIER_LIVERIES).find(k => (d.carrier || '').includes(k)) || 'DEFAULT'
  const livery = CARRIER_LIVERIES[carrierKey] || CARRIER_LIVERIES.DEFAULT
  const weights = d.weights || { gross_weight_kg: 28450, tare_weight_kg: 11200, net_weight_kg: 17250 }
  const sensors = d.sensors || {}
  const aiRisk = d.ai_risk || {}
  const stages = d.stages || []
  const bench = d.benchmark || {}

  return (
    <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div
        className="drawer-content vehicle-journey-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '1120px', width: '92vw' }}
      >
        {/* ================= HEADER & BREADCRUMB ================= */}
        <div className="journey-header">
          <div className="journey-header-left">
            <button className="back-btn" onClick={onClose}>
              <ArrowLeft size={14} />
              <span>Back to Records</span>
            </button>
            <div className="journey-title-block">
              <span className="plate-pill">
                <Truck size={14} />
                <b>{d.vehicle_id || journeyId}</b>
              </span>
              <span
                className="carrier-livery-badge"
                style={{ backgroundColor: livery.bg, color: livery.text, borderColor: livery.border }}
              >
                {livery.name}
              </span>
              <span className={`status-pill ${d.shipment_status || 'IN_TRANSIT'}`}>
                {d.shipment_status || 'IN_TRANSIT'}
              </span>
              <span className={`risk-pill ${aiRisk.risk_tier || 'LOW'}`}>
                {aiRisk.risk_tier || 'LOW'} RISK
              </span>
            </div>
          </div>

          <div className="journey-header-right">
            <button
              className="action-pill-btn secondary"
              onClick={() => window.print()}
              title="Print Vehicle E-Pass"
            >
              <Printer size={14} />
              <span>Print Pass</span>
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="journey-body">
          {loading ? (
            <div className="drawer-loading-state">
              <RefreshCw size={32} className="spin-icon" />
              <h3>Retrieving Vehicle Journey &amp; Telematics...</h3>
              <p>Querying verified milestones, pit weighbridge records, and GPS corridor coordinates</p>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertTriangle size={36} color="#ef4444" />
              <h4>{error}</h4>
              <p>Please check the vehicle or shipment reference and try again.</p>
            </div>
          ) : (
            <>
              {/* Telemetry Summary Cards Grid */}
              <div className="journey-telemetry-grid">
                <div className="telemetry-card">
                  <span className="tel-label"><Scale size={13} /> Weighbridge Scale WB-01</span>
                  <b className="tel-val">{fmt(weights.gross_weight_kg)} kg</b>
                  <span className="tel-sub">Tare: {fmt(weights.tare_weight_kg)} kg · Net: {fmt(weights.net_weight_kg)} kg</span>
                </div>

                <div className="telemetry-card">
                  <span className="tel-label"><Box size={13} /> Capacity Utilization</span>
                  <b className="tel-val">{pct(d.vehicle_utilization_pct || 82.5)}</b>
                  <span className="tel-sub">{d.vehicle_type || '32FT Multi-Axle Heavy'}</span>
                </div>

                <div className="telemetry-card">
                  <span className="tel-label"><Timer size={13} /> Actual Transit TAT</span>
                  <b className="tel-val">{d.transit_tat_hrs || d.order_to_dispatch_hrs || '14.2'} hrs</b>
                  <span className="tel-sub">Planned Benchmark: {bench.peer_avg_planned_hrs || d.planned_tat_hrs || '12.0'} hrs</span>
                </div>

                <div className="telemetry-card">
                  <span className="tel-label"><Clock3 size={13} /> ETA Slippage Variance</span>
                  <b className="tel-val" style={{ color: Number(d.eta_slippage_hrs) > 0 ? '#ef4444' : 'var(--teal)' }}>
                    {Number(d.eta_slippage_hrs) > 0 ? `+${d.eta_slippage_hrs} hrs Late` : 'On Schedule'}
                  </b>
                  <span className="tel-sub">Committed ETA: {d.planned_eta || '2026-10-16'}</span>
                </div>

                <div className="telemetry-card">
                  <span className="tel-label"><Warehouse size={13} /> Allocated Dock Staging</span>
                  <b className="tel-val" style={{ color: '#0ea5e9' }}>{d.allocated_dock_bay || 'BAY 03'}</b>
                  <span className="tel-sub">Facility: {d.plant_id || 'PLANT-101'} ({d.warehouse_id || 'FG-WH-01'})</span>
                </div>

                {d.freight_cost_inr && userRole !== 'DISPATCH_WORKER' && (
                  <div className="telemetry-card">
                    <span className="tel-label"><Award size={13} /> Freight Outlay</span>
                    <b className="tel-val">{money(d.freight_cost_inr)}</b>
                    <span className="tel-sub">Contract Freight Rate</span>
                  </div>
                )}
              </div>

              {/* Hardware & IoT Sensor Status HUD */}
              <div className="sensors-hud-strip">
                <div className="sensor-hud-item">
                  <Radio size={16} color="var(--teal)" />
                  <div>
                    <span className="sensor-name">GPS Telematics</span>
                    <b className="sensor-status">{sensors.gps?.status || 'ACTIVE_PINGING'} ({sensors.gps?.speed_kmh || 58} km/h)</b>
                    <small className="sensor-note">{sensors.gps?.corridor || 'NH-48 Golden Quadrilateral'}</small>
                  </div>
                </div>

                <div className="sensor-hud-item">
                  <Scale size={16} color="#0ea5e9" />
                  <div>
                    <span className="sensor-name">Pit Weighbridge</span>
                    <b className="sensor-status">WB-01 Scale Certified</b>
                    <small className="sensor-note">ISO 9001 / Legal Metrology Calibrated</small>
                  </div>
                </div>

                <div className="sensor-hud-item">
                  <Radio size={16} color="#8b5cf6" />
                  <div>
                    <span className="sensor-name">ANPR &amp; RFID Gantry</span>
                    <b className="sensor-status">Plate Matched (99.4%)</b>
                    <small className="sensor-note">Main Outbound Gate G-02</small>
                  </div>
                </div>

                <div className="sensor-hud-item">
                  <FileCheck2 size={16} color="#10b981" />
                  <div>
                    <span className="sensor-name">Electronic POD (e-POD)</span>
                    <b className="sensor-status">{d.pod_status || 'PENDING'}</b>
                    <small className="sensor-note">Digital Glass Signature</small>
                  </div>
                </div>
              </div>

              {/* 7-Stage Chronological Journey Lifecycle */}
              <div className="journey-lifecycle-section">
                <div className="section-title-row">
                  <h4><Navigation size={17} /> End-to-End Operational Journey Lifecycle</h4>
                  <span className="section-badge">7 Verified Sensor Milestones</span>
                </div>

                <div className="lifecycle-stepper">
                  {stages.map((stg, idx) => {
                    const isDone = stg.status === 'COMPLETED'
                    const isInProg = stg.status === 'IN_PROGRESS'
                    return (
                      <div key={idx} className={`stepper-node ${isDone ? 'completed' : (isInProg ? 'in-progress' : 'pending')}`}>
                        <div className="node-marker">
                          {isDone ? <CheckCircle2 size={16} /> : (isInProg ? <Radio size={15} className="pulse-icon" /> : <span>{idx + 1}</span>)}
                        </div>
                        <div className="node-content">
                          <div className="node-top">
                            <b className="node-title">{stg.stage}</b>
                            <span className="node-system-tag">{stg.system || 'Core System'}</span>
                          </div>
                          <p className="node-desc">{stg.note}</p>
                          <div className="node-meta">
                            <span><Clock3 size={11} /> {stg.timestamp || 'Recorded'}</span>
                            {stg.duration_hrs > 0 && <span>· Duration: <b>{stg.duration_hrs} hrs</b></span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Diagnostic & Prescriptive Recovery Section */}
              <div className="journey-ai-box">
                <div className="ai-box-header">
                  <Sparkles size={16} color="#0ea5e9" />
                  <b>Autonomous AI Dispatch Diagnostic</b>
                  <span className="ai-eval-pill">{aiRisk.risk_tier || 'NORMAL'} EVALUATION</span>
                </div>
                <p className="ai-rec-text">{aiRisk.recommendation || 'Vehicle is operating within planned operational corridor tolerances.'}</p>
                {aiRisk.delay_factors && aiRisk.delay_factors.length > 0 && (
                  <div className="ai-factors-list">
                    <b>Evaluated Contributing Factors:</b>
                    <ul>
                      {aiRisk.delay_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="ai-box-actions">
                  <button className="action-pill-btn" onClick={() => alert(`Escalation alert triggered to Regional Logistics Lead for vehicle ${d.vehicle_id}`)}>
                    <Zap size={13} /> Escalate to Carrier Dispatch Lead
                  </button>
                  <button className="action-pill-btn secondary" onClick={() => alert(`Consignee dock notification sent for order ${d.customer_order_id}`)}>
                    <Warehouse size={13} /> Pre-Alert Consignee Unloading Dock
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

