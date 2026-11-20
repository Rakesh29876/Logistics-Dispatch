import React, { useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock3, Copy, Download, ExternalLink,
  FileSpreadsheet, FileText, History, Mail, RefreshCw, Scale, Send, Settings, ShieldAlert,
  Sparkles, Truck, Warehouse, X, Zap
} from 'lucide-react'

const fmt = (v) => Number(v || 0).toLocaleString('en-IN')
const money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function EmailTriggerModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  alertReport,
  alertStatus,
  onTriggerScan,
  triggering,
  historyList,
  onLoadHistory,
  onSaveConfig,
  onToast,
  onExport,
}) {
  const [configForm, setConfigForm] = useState({
    manager_email: alertStatus?.config?.manager_email || 'logistics.manager@apexmanufacturing.com',
    secondary_emails: alertStatus?.config?.secondary_emails || 'dispatch.supervisor@apexmanufacturing.com,ops-tower@gwcdata.ai',
    tat_excess_threshold_hrs: alertStatus?.config?.tat_excess_threshold_hrs || 3.0,
    dock_wait_threshold_hrs: alertStatus?.config?.dock_wait_threshold_hrs || 2.0,
    auto_trigger_enabled: alertStatus?.config?.auto_trigger_enabled ?? true,
    check_interval_minutes: alertStatus?.config?.check_interval_minutes || 15,
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)

  if (!isOpen) return null

  const report = selectedHistoryItem || alertReport || alertStatus?.latest_alert || {}
  const summary = alertReport?.summary || {}
  const weightSeq = alertReport?.weighbridge_sequence || []
  const dwellList = alertReport?.plant_dwell_anomalies || []
  const dockList = alertReport?.urgent_dock_allocations || []

  const handleCopyText = () => {
    if (alertReport?.plain_text_preview) {
      navigator.clipboard.writeText(alertReport.plain_text_preview)
      setCopied(true)
      onToast?.('Plain-text email summary copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleConfigSubmit = async (e) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      await onSaveConfig(configForm)
      onToast?.('Email alert configuration updated successfully in Neon!')
    } catch (err) {
      onToast?.(`Config update failed: ${err.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <div
      className="modal-overlay modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="email-trigger-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.5)',
          maxWidth: '1140px',
          width: '95vw',
          height: '88vh',
          maxHeight: '920px',
          minHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          position: 'relative',
          zIndex: 1000000,
        }}
      >
        {/* Modal Header */}
        <div
          className="email-trigger-modal-header"
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            margin: 0,
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-card, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                flexShrink: 0,
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                  Automated Stuck-Vehicle Email Trigger Agent
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: alertStatus?.monitor_status === 'ACTIVE_MONITORING' ? '#dcfce7' : '#f1f5f9',
                    color: alertStatus?.monitor_status === 'ACTIVE_MONITORING' ? '#166534' : '#475569',
                    border: '1px solid currentColor',
                  }}
                >
                  ● {alertStatus?.monitor_status || 'ACTIVE_MONITORING'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Autonomous dispatch monitor evaluates weighbridge weight, inside plant dwell anomalies, and urgent loading bay priorities.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              className="btn-primary"
              onClick={onTriggerScan}
              disabled={triggering}
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={triggering ? 'spin' : ''} />
              {triggering ? 'Scanning Neon DB...' : 'Run Trigger Scan Now'}
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs Strip (Never Collapses, Hidden Overflow Scrollbar) */}
        <div
          className="email-trigger-modal-tabs"
          style={{
            flexShrink: 0,
            minHeight: '54px',
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 24px',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
          }}
        >
          <button
            className={`tab-pill ${activeTab === 'email_preview' ? 'active' : ''}`}
            onClick={() => { setSelectedHistoryItem(null); setActiveTab('email_preview'); }}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <Mail size={14} /> Generated Management Email
          </button>
          <button
            className={`tab-pill ${activeTab === 'weighbridge' ? 'active' : ''}`}
            onClick={() => setActiveTab('weighbridge')}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <Scale size={14} /> Weighbridge Sequence ({weightSeq.length})
          </button>
          <button
            className={`tab-pill ${activeTab === 'dwell' ? 'active' : ''}`}
            onClick={() => setActiveTab('dwell')}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <Clock3 size={14} /> Inside Plant Dwell &amp; TAT ({dwellList.length})
          </button>
          <button
            className={`tab-pill ${activeTab === 'docks' ? 'active' : ''}`}
            onClick={() => setActiveTab('docks')}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <Warehouse size={14} /> Urgent Dock Bays ({dockList.length})
          </button>
          <button
            className={`tab-pill ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { onLoadHistory?.(); setActiveTab('history'); }}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <History size={14} /> Alert History ({historyList.length})
          </button>
          <button
            className={`tab-pill ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
            style={{ flexShrink: 0, height: '34px' }}
          >
            <Settings size={14} /> Trigger Config
          </button>
        </div>

        {/* Modal Body Container (minHeight: 0 prevents flex child intrinsic size push) */}
        <div
          className="email-trigger-modal-body"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--bg-card, #ffffff)',
          }}
        >
          {/* TAB 1: GENERATED MANAGEMENT EMAIL */}
          {activeTab === 'email_preview' && (
            <div>
              {/* Executive Dispatch Info Banner */}
              <div
                style={{
                  background: 'var(--surface-sunken, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
                    Subject Line Dispatched
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                    {report.subject || '🚨 [CRITICAL DISPATCH ALERT] Stuck Vehicles Inside Plant | Weighbridge Sequence'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                    Sent to: <strong>{report.recipient_email || 'logistics.manager@apexmanufacturing.com'}</strong> ·
                    Status: <strong style={{ color: '#16a34a' }}>{report.status || report.dispatch_status || 'DISPATCHED_TO_OPERATIONS'}</strong> ·
                    Log #{report.id || report.log_id || '1'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onExport && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onExport('pdf')}
                        style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', fontWeight: 700 }}
                        title="Download official PDF Executive Management Report"
                      >
                        <FileText size={13} /> PDF Report
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onExport('xlsx')}
                        style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(22, 163, 74, 0.08)', color: '#16a34a', borderColor: 'rgba(22, 163, 74, 0.3)', fontWeight: 700 }}
                        title="Download verified Excel spreadsheet of operations"
                      >
                        <FileSpreadsheet size={13} /> Excel (.xlsx)
                      </button>
                    </>
                  )}
                  <button className="btn-secondary" onClick={handleCopyText} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Copy size={13} /> {copied ? 'Copied!' : 'Copy Plaintext'}
                  </button>
                  <button className="btn-primary" onClick={onTriggerScan} disabled={triggering} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <RefreshCw size={13} className={triggering ? 'spin' : ''} /> Re-Scan
                  </button>
                </div>
              </div>

              {/* Rendered HTML Email Container */}
              <div
                style={{
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                {report.html_content || alertReport?.html_preview ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: report.html_content || alertReport.html_preview }}
                    style={{ minHeight: '400px' }}
                  />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    <p>No email preview loaded. Click "Run Trigger Scan Now" to evaluate live stuck vehicles.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WEIGHBRIDGE INBOUND SEQUENCING */}
          {activeTab === 'weighbridge' && (
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.08) 100%)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 800, fontSize: '14px' }}>
                  <Scale size={18} /> Inbound Weight &amp; Shortest Loading Duration Rule
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  The agent calculates total vehicle gross weight (tare weight + load payload) and estimated loading cycle minutes.
                  Vehicles with shorter processing duration and high customer priority enter <strong>FIRST</strong> to clear the plant gate and Weighbridge WB-01 quickly.
                </p>
              </div>

              <div className="table-wrap">
                <table className="data-table" style={{ width: '100%', minWidth: '920px', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sequence</th>
                      <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Vehicle &amp; Carrier</th>
                      <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Vehicle Type</th>
                      <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Weighbridge Weights</th>
                      <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Est. Loading Time</th>
                      <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Priority / SLA</th>
                      <th style={{ minWidth: '240px', maxWidth: '360px', whiteSpace: 'normal' }}>Verdict &amp; Directive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightSeq.map((w, i) => (
                      <tr key={i} style={{ backgroundColor: w.inbound_sequence_rank === 1 ? 'rgba(22, 163, 74, 0.06)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: w.inbound_sequence_rank === 1 ? '#16a34a' : w.inbound_sequence_rank <= 3 ? '#0284c7' : 'var(--bg-subtle, #f1f5f9)',
                              color: w.inbound_sequence_rank <= 3 ? '#ffffff' : 'var(--text-primary, #0f172a)',
                            }}
                          >
                            #{w.inbound_sequence_rank}
                          </span>
                        </td>
                        <td>
                          <strong>{w.vehicle_id}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{w.carrier} · {w.customer_name}</div>
                        </td>
                        <td>
                          <span className="badge-tag">{w.vehicle_type}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          <div>Tare: <strong>{fmt(w.tare_weight_kg)} kg</strong></div>
                          <div>Payload: <strong>{fmt(w.net_payload_kg)} kg</strong> ({fmt(w.load_units)} units)</div>
                          <div style={{ color: '#0284c7', fontWeight: 700 }}>Gross: {fmt(w.gross_weight_kg)} kg</div>
                        </td>
                        <td style={{ color: '#0d9488', fontWeight: 800 }}>
                          {w.est_loading_duration_str}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: w.priority === 'HIGH' ? '#fef2f2' : '#f8fafc',
                              color: w.priority === 'HIGH' ? '#dc2626' : '#475569',
                            }}
                          >
                            {w.priority}
                          </span>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{w.service_level}</div>
                        </td>
                        <td style={{ fontSize: '12px', whiteSpace: 'normal', minWidth: '220px', maxWidth: '340px', wordBreak: 'break-word', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: w.inbound_sequence_rank === 1 ? '#16a34a' : '#0284c7', whiteSpace: 'normal' }}>
                            {w.entry_verdict}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {w.recommendation_reason}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PLANT DWELL & TAT OPTIMIZATION */}
          {activeTab === 'dwell' && (
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(234, 88, 12, 0.08) 100%)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '14px' }}>
                  <Clock3 size={18} /> Turnaround Time (TAT) Dwell Bottlenecks Inside Manufacturing Plant
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  Vehicles below have exceeded the standard <strong>4.0 hr gate-to-exit turnaround SLA</strong>.
                  The agent identifies the exact internal bottleneck, explains what the vehicle is doing inside for excess hours, and recommends corrective action to management.
                </p>
              </div>

              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '1050px', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '320px' }} />
                    <col style={{ width: '320px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ width: '160px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Shipment &amp; Vehicle</th>
                      <th style={{ width: '140px', whiteSpace: 'nowrap', padding: '10px 12px' }}>TAT SLA vs Actual</th>
                      <th style={{ width: '110px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Excess Dwell</th>
                      <th style={{ width: '320px', whiteSpace: 'normal', padding: '10px 12px' }}>Internal Location &amp; Root Cause ("What It Is Doing Inside")</th>
                      <th style={{ width: '320px', whiteSpace: 'normal', padding: '10px 12px' }}>Manager Corrective Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dwellList.map((d, i) => (
                      <tr key={i}>
                        <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap', padding: '10px 12px' }}>
                          <strong>{d.shipment_id}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{d.carrier} · {d.vehicle_type}</div>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '3px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: d.severity === 'CRITICAL' ? '#fee2e2' : '#ffedd5',
                              color: d.severity === 'CRITICAL' ? '#b91c1c' : '#c2410c',
                            }}
                          >
                            {d.severity}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap', padding: '10px 12px' }}>
                          <div>Planned: <strong>{d.planned_tat_hrs} hrs</strong></div>
                          <div style={{ color: '#dc2626', fontWeight: 700 }}>Actual Inside: {d.actual_dwell_hrs} hrs</div>
                        </td>
                        <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap', padding: '10px 12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626' }}>
                            +{d.excess_dwell_hrs} hrs
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Overdue SLA</div>
                        </td>
                        <td style={{ width: '320px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px', fontSize: '12px', whiteSpace: 'normal' }}>
                            📍 {d.internal_location}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {d.what_vehicle_is_doing_inside}
                          </div>
                        </td>
                        <td style={{ width: '320px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top', backgroundColor: 'rgba(22, 163, 74, 0.05)', padding: '10px 12px' }}>
                          <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: 600, lineHeight: 1.5, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            👉 {d.manager_corrective_action}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: URGENT DOCK ALLOCATION */}
          {activeTab === 'docks' && (
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
                  border: '1px solid rgba(13, 148, 136, 0.25)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d9488', fontWeight: 800, fontSize: '14px' }}>
                  <Warehouse size={18} /> Urgent Loading Bay Allocation (Priority Unload/Load First)
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  Critical delayed shipments and P1 customer orders are prioritized to be allocated to Loading Bays 1, 2, and 3
                  and <strong>unloaded or loaded FIRST</strong> before standard freight.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                {dockList.map((dock, idx) => (
                  <div
                    key={idx}
                    className="panel"
                    style={{
                      borderTop: idx === 0 ? '4px solid #dc2626' : idx === 1 ? '4px solid #0284c7' : '4px solid #16a34a',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                        {dock.assigned_bay}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                        }}
                      >
                        UNLOAD/LOAD FIRST
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                      Vehicle: {dock.vehicle_id} ({dock.vehicle_type})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                      Carrier: <strong>{dock.carrier}</strong> · Customer: {dock.customer_name}
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-subtle, #f8fafc)',
                        fontSize: '12px',
                        marginBottom: '10px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '3px' }}>
                        Directive: {dock.operation_directive}
                      </div>
                      <div style={{ color: 'var(--text-muted, #64748b)' }}>{dock.urgency_reason}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
                      <span>Dock Turnaround Est: <strong>{dock.est_dock_turnaround_hrs} hrs</strong></span>
                      <span>Open Load: <strong>{fmt(dock.open_qty)} units</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ALERT HISTORY & LOGS */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Historical Autonomous Email Alerts Dispatched
                </h3>
                <button className="btn-secondary" onClick={onLoadHistory} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <RefreshCw size={13} /> Refresh Log
                </button>
              </div>

              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '1050px', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '380px' }} />
                    <col style={{ width: '220px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Log ID</th>
                      <th style={{ width: '380px', whiteSpace: 'normal', padding: '10px 12px' }}>Subject / Alert</th>
                      <th style={{ width: '220px', whiteSpace: 'normal', padding: '10px 12px' }}>Recipient</th>
                      <th style={{ width: '130px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Trigger Mode</th>
                      <th style={{ width: '130px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Stuck Vehicles</th>
                      <th style={{ width: '110px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Status</th>
                      <th style={{ width: '150px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Timestamp</th>
                      <th style={{ width: '100px', whiteSpace: 'nowrap', padding: '10px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((h) => (
                      <tr key={h.id}>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}><strong>#{h.id}</strong></td>
                        <td style={{ width: '380px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '12px', lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', color: 'var(--text-primary, #0f172a)' }}>
                            {h.subject}
                          </div>
                        </td>
                        <td style={{ width: '220px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top', padding: '10px 12px' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary, #475569)', wordBreak: 'break-word' }}>
                            {h.recipient_email}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}>
                          <span className="badge-tag">{h.trigger_type}</span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}>
                          <strong style={{ color: '#dc2626' }}>{h.stuck_vehicle_count}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}> ({h.critical_count} critical)</span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}>
                          {h.created_at ? new Date(h.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', padding: '10px 12px' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setSelectedHistoryItem(h);
                              setActiveTab('email_preview');
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            View Email
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURATION */}
          {activeTab === 'config' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div
                style={{
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary, #0f172a)' }}>
                  <Settings size={16} /> Autonomous Trigger &amp; Escalation Thresholds
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                  Configure recipient email targets, TAT threshold hours, and automated schedule frequency.
                </p>
              </div>

              <form onSubmit={handleConfigSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Primary Logistics Manager Email:
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={configForm.manager_email}
                    onChange={(e) => setConfigForm({ ...configForm, manager_email: e.target.value })}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Receives full executive dispatch alerts with weighbridge sequence and urgent dock bay assignments.
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Secondary Operations &amp; Supervisor Emails (comma separated):
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={configForm.secondary_emails}
                    onChange={(e) => setConfigForm({ ...configForm, secondary_emails: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      TAT Excess Dwell Threshold (Hours):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="input"
                      value={configForm.tat_excess_threshold_hrs}
                      onChange={(e) => setConfigForm({ ...configForm, tat_excess_threshold_hrs: parseFloat(e.target.value) || 3.0 })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Dock Staging Wait Threshold (Hours):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="input"
                      value={configForm.dock_wait_threshold_hrs}
                      onChange={(e) => setConfigForm({ ...configForm, dock_wait_threshold_hrs: parseFloat(e.target.value) || 2.0 })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={configForm.auto_trigger_enabled}
                      onChange={(e) => setConfigForm({ ...configForm, auto_trigger_enabled: e.target.checked })}
                    />
                    <strong>Enable Autonomous Background Scanning &amp; Alerts</strong>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingConfig}>
                    {savingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

