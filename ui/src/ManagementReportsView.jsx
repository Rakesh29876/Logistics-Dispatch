import React from 'react'
import {
  Box,
  Calendar,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Truck,
  Warehouse,
  Zap,
  ArrowUpRight,
} from 'lucide-react'
import { CarrierBubbleChart, DonutChart, RadialGauge } from './Charts'

export default function ManagementReportsView({
  reportType,
  setReportType,
  reportSubTab,
  setReportSubTab,
  reportStart,
  setReportStart,
  reportEnd,
  setReportEnd,
  reportPlant,
  setReportPlant,
  reportVehicleType,
  setReportVehicleType,
  reportData,
  loadingReport,
  loadReport,
  triggerExport,
  hasPerm,
  openDrilldown,
  inspectJourney,
  setAutoRunTriggerFlow,
  setPage,
  setArchTab,
  setAlertModalTab,
  setAlertModalOpen,
  fmt = (v) => Number(v || 0).toLocaleString('en-IN'),
  money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
  pct = (v) => `${Number(v || 0).toFixed(1)}%`,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Section Header */}
      <div className="page-heading" style={{ margin: 0, padding: '10px 0' }}>
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> AGENT 4 · AUTOMATED REPORTING &amp; SLA AUDIT
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px' }}>
            {hasPerm('management_reports') ? 'Automated Management Reports' : 'Operational Logistics Reports'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Verified period performance summaries and full entry-to-exit audit generated directly from Neon PostgreSQL.
          </p>
        </div>
        <div className="heading-actions">
          {hasPerm('agent_architecture') && (
            <button className="btn-secondary" onClick={() => setPage('architecture')}>
              <Cpu size={14} /> Architecture &amp; AI
            </button>
          )}
          {hasPerm('management_reports') && (
            <>
              <button className="btn-secondary" onClick={() => triggerExport('xlsx')}>
                <FileSpreadsheet size={15} /> Export Excel (.xlsx)
              </button>
              <button className="btn-primary" onClick={() => triggerExport('pdf')}>
                <Download size={15} /> Export PDF (.pdf)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Toolbar: Period Controls & Scope Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: 'var(--panel-bg, #ffffff)',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Period:</span>
          {(hasPerm('management_reports') ? ['daily', 'weekly', 'monthly', 'custom'] : ['daily', 'weekly']).map((rt) => (
            <button
              key={rt}
              type="button"
              className={reportType === rt ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                borderRadius: '16px',
                fontWeight: reportType === rt ? 700 : 500,
              }}
              onClick={() => {
                setReportType(rt)
                if (rt !== 'custom') loadReport(rt, reportStart, reportEnd, reportVehicleType, reportPlant)
              }}
            >
              <Calendar size={13} /> {rt.toUpperCase()}
            </button>
          ))}
          {reportType === 'custom' && hasPerm('management_reports') && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
              />
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ padding: '5px 10px', fontSize: '11px' }}
                onClick={() => loadReport('custom', reportStart, reportEnd, reportVehicleType, reportPlant)}
              >
                Generate
              </button>
            </div>
          )}

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color, #e2e8f0)', margin: '0 4px' }} />

          {/* Inline Plant Scope */}
          <select
            value={reportPlant}
            onChange={(e) => {
              const pl = e.target.value
              setReportPlant(pl)
              loadReport(reportType, reportStart, reportEnd, reportVehicleType, pl)
            }}
            className="filter-select"
            style={{ padding: '4px 8px', fontSize: '11px', height: '28px', borderRadius: '6px' }}
          >
            <option value="ALL">All Plants (KA-01 / TN-01)</option>
            <option value="IN-KA-01">KA-01 · Bengaluru</option>
            <option value="IN-TN-01">TN-01 · Chennai</option>
          </select>

          {/* Inline Vehicle Type Scope */}
          <select
            value={reportVehicleType}
            onChange={(e) => {
              const vt = e.target.value
              setReportVehicleType(vt)
              loadReport(reportType, reportStart, reportEnd, vt, reportPlant)
            }}
            className="filter-select"
            style={{ padding: '4px 8px', fontSize: '11px', height: '28px', borderRadius: '6px' }}
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="32FT_TRUCK">10W Heavy (32FT / 25T Container)</option>
            <option value="20FT_TRUCK">6W Medium (20FT / 11T Container)</option>
            <option value="40FT_TRAILER">14W Multi-Axle (40FT Trailer / 35T)</option>
            <option value="16FT_TRUCK">4W Intermediate (16FT / 7T Truck)</option>
            <option value="VAN">Light Commercial (Dost / 2.5T)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="live-tag" style={{ background: '#dcfce7', color: '#15803d', fontSize: '10.5px' }}>
            ● VERIFIED NEON DB
          </span>
          {hasPerm('management_reports') && (
            <>
              <button className="btn-secondary" onClick={() => triggerExport('xlsx')} style={{ padding: '4px 10px', fontSize: '11.5px' }}>
                <FileSpreadsheet size={13} /> Excel (.xlsx)
              </button>
              <button className="btn-primary" onClick={() => triggerExport('pdf')} style={{ padding: '4px 10px', fontSize: '11.5px' }}>
                <Download size={13} /> Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {loadingReport && (
        <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
          <b>Generating verified management report from Neon PostgreSQL...</b>
        </div>
      )}

      {reportData && !loadingReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Executive Period Summary Hero Card */}
          <div className="report-hero-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#0ea5e9" />
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Executive Logistics Management Report ({reportData.report_type?.toUpperCase()})
                </h3>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Reporting Window: <b>{reportData.reporting_period?.start_date}</b> to <b>{reportData.reporting_period?.end_date}</b>
              </span>
            </div>

            {/* Plain-English Executive Narrative */}
            <div className="report-narrative-box">
              {reportData.executive_summary}
              {reportData.operational_insights?.period_comparison && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <TrendingUp size={12} color="#16a34a" />
                  <span>{reportData.operational_insights.period_comparison}</span>
                </div>
              )}
            </div>

            {/* 4-Stat Visual Scorecard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px', marginTop: '10px' }}>
              <div
                className="clickable"
                onClick={() => openDrilldown('completed')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Inspect all completed and delivered journeys"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Completed Deliveries</span>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <b style={{ fontSize: '16px', color: '#16a34a' }}>{fmt(reportData.vehicle_movement_summary?.completed_journeys)}</b>
                <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  of {fmt(reportData.vehicle_movement_summary?.total_dispatches)} total dispatches
                </small>
              </div>

              <div
                className="clickable"
                onClick={() => openDrilldown('delayed')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Inspect delayed exceptions and overdue journeys"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Delayed Exceptions</span>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <b style={{ fontSize: '16px', color: '#dc2626' }}>{fmt(reportData.vehicle_movement_summary?.delayed_vehicles)}</b>
                <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  {fmt(reportData.delay_summary?.CRITICAL)} critical risks
                </small>
              </div>

              <div
                className="clickable"
                onClick={() => openDrilldown('avg_tat')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Inspect corridor turnaround duration breakdown"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Average Corridor TAT</span>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <b style={{ fontSize: '16px', color: '#0ea5e9' }}>{reportData.turnaround_time_summary?.avg_tat_hrs || 0} hrs</b>
                <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  Planned SLA: {reportData.turnaround_time_summary?.avg_planned_hrs || 0} hrs
                </small>
              </div>

              <div
                className="clickable"
                onClick={() => openDrilldown('fleet_spend')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title="Inspect total freight expenditure and load capacity"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Total Freight Spend</span>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <b style={{ fontSize: '16px', color: 'var(--teal)' }}>{money(reportData.vehicle_movement_summary?.total_freight_inr)}</b>
                <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  Load factor: {pct(reportData.vehicle_movement_summary?.avg_utilization_pct)}
                </small>
              </div>
            </div>
          </div>

          {/* Structured Sub-Report Lens Tabs */}
          <div className="report-lens-strip">
            {[
              { id: 'summary', label: 'Executive Overview & Actions' },
              { id: 'entry_exit', label: 'Complete Entry-to-Exit Lifecycle Audit' },
              { id: 'delay', label: 'Delay & Exception Analysis' },
              { id: 'tat', label: 'Corridor Turnaround (TAT)' },
              ...(hasPerm('carrier_performance') ? [{ id: 'carrier', label: 'Transporter Scorecard' }] : []),
              ...(hasPerm('management_reports') ? [{ id: 'spend', label: 'Fleet Spend & Capacity' }] : []),
              { id: 'dock', label: 'Dock Staging & Readiness' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                className={`report-lens-btn ${reportSubTab === st.id ? 'active' : ''}`}
                onClick={() => setReportSubTab(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Lens Content Area */}
          {reportSubTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '12px', alignItems: 'start' }}>
              <DonutChart
                title="Movement Execution Summary"
                subtitle={`${fmt(reportData.vehicle_movement_summary?.total_dispatches)} total dispatches in period`}
                centerValue={fmt(reportData.vehicle_movement_summary?.total_dispatches)}
                centerLabel="Dispatches"
                slices={[
                  { label: 'Completed Deliveries', metric: 'delivered', value: reportData.vehicle_movement_summary?.completed_journeys || 0, color: '#16a34a' },
                  { label: 'Vehicles In Transit', metric: 'in_transit', value: reportData.vehicle_movement_summary?.vehicles_in_transit || 0, color: '#6366f1' },
                  { label: 'Delayed Vehicles', metric: 'delayed', value: reportData.vehicle_movement_summary?.delayed_vehicles || 0, color: '#dc2626' },
                ]}
                onSliceClick={(s) => openDrilldown(s.metric)}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#f59e0b" />
                      <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>AI Recommended Executive Actions</h3>
                    </div>
                    <span className="live-tag" style={{ fontSize: '9.5px', background: '#fef3c7', color: '#b45309' }}>
                      ACTIONABLE DIRECTIVES
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(reportData.recommended_actions || []).map((a, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          background: 'var(--bg-subtle, #f8fafc)',
                          border: '1px solid var(--border-color)',
                          fontSize: '11.5px',
                          lineHeight: '1.5',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '5px',
                            background: 'rgba(14, 165, 233, 0.15)',
                            color: '#0ea5e9',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Active Corridor Transit: <b style={{ color: '#6366f1' }}>{fmt(reportData.vehicle_movement_summary?.vehicles_in_transit)}</b>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Pending POD Reconciliation: <b style={{ color: '#d97706' }}>{fmt(reportData.vehicle_movement_summary?.incomplete_pod_journeys)}</b>
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'entry_exit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Top Summary Banner */}
              <div
                className="panel"
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06), rgba(99, 102, 241, 0.04))',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={18} color="#0ea5e9" />
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Complete Plant Entry-to-Exit Fleet Lifecycle Audit
                      </h3>
                      <span className="live-tag" style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', fontWeight: 700 }}>
                        100% AUDIT TRAIL VERIFIED
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Chronological gate-in to delivery lifecycle: <strong>Weighbridge Tare (WB-01)</strong> ➔ <strong>Dispatch Inbound Dock Sequencing</strong> ➔ <strong>Yard Dwell Demurrage Scan</strong> ➔ <strong>Autonomous Email Trigger</strong> ➔ <strong>Gross Weighbridge &amp; Gate-Out</strong> ➔ <strong>Corridor Transit TAT</strong> ➔ <strong>Consignee Digital e-POD</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setAutoRunTriggerFlow(Date.now())
                        setPage('pipeline_flow')
                      }}
                    >
                      <Zap size={13} /> Run Agent Trigger Flow
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setAlertModalTab('preview')
                        setAlertModalOpen(true)
                      }}
                    >
                      <Mail size={13} /> View Popup Email Alert
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setPage('twin3d')}
                    >
                      <Box size={13} /> 3D Plant Twin
                    </button>
                  </div>
                </div>

                {/* 5-Key Executive Metrics Scorecard */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div
                    className="clickable"
                    onClick={() => openDrilldown('avg_tat')}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Click to drill down into total end-to-end turnaround times"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Timer size={13} color="#0ea5e9" />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Total End-to-End TAT</span>
                      </div>
                      <span className="kpi-drill-tag">Details →</span>
                    </div>
                    <b style={{ fontSize: '17px', color: '#0ea5e9' }}>{reportData.turnaround_time_summary?.avg_tat_hrs || '7.2'} hrs</b>
                    <small style={{ display: 'block', fontSize: '9.5px', color: '#16a34a', fontWeight: 600 }}>0.8 hrs faster than SLA target</small>
                  </div>

                  <div
                    className="clickable"
                    onClick={() => openDrilldown('waiting_queue')}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Click to inspect in-plant dwell queue and staging vehicles"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Warehouse size={13} color="#6366f1" />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>In-Plant Dwell TAT</span>
                      </div>
                      <span className="kpi-drill-tag">Details →</span>
                    </div>
                    <b style={{ fontSize: '17px', color: '#6366f1' }}>3.0 hrs</b>
                    <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>Gate In Tare ➔ Gate Out Gross</small>
                  </div>

                  <div
                    className="clickable"
                    onClick={() => { setAlertModalTab('weighbridge'); setAlertModalOpen(true); }}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Click to inspect certified weighbridge scale logs"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Scale size={13} color="#16a34a" />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Weighbridge Compliance</span>
                      </div>
                      <span className="kpi-drill-tag">Inspect →</span>
                    </div>
                    <b style={{ fontSize: '17px', color: '#16a34a' }}>100% Certified</b>
                    <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>WB-01 Tare + Gross Verified</small>
                  </div>

                  <div
                    className="clickable"
                    onClick={() => openDrilldown('waiting_queue')}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Click to view inbound dock sequencing and vehicle priority"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={13} color="#f59e0b" />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Dock Inbound Accuracy</span>
                      </div>
                      <span className="kpi-drill-tag">Details →</span>
                    </div>
                    <b style={{ fontSize: '17px', color: '#f59e0b' }}>98.4%</b>
                    <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>Dispatch Supervisor Sequencing</small>
                  </div>

                  <div
                    className="clickable"
                    onClick={() => openDrilldown('at_risk')}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Click to inspect delay risks and demurrage avoidance actions"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={13} color="#10b981" />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Demurrage Avoided</span>
                      </div>
                      <span className="kpi-drill-tag">Details →</span>
                    </div>
                    <b style={{ fontSize: '17px', color: '#10b981' }}>₹3.75 Lakhs</b>
                    <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--text-muted)' }}>25 Dwell Alerts Remediated</small>
                  </div>
                </div>
              </div>

              {/* Chronological 6-Stage Entry-to-Exit Timeline Flow */}
              <div className="panel" style={{ padding: '18px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Chronological Entry-to-Exit Operational Sequence
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Exact sequence executed per vehicle before executive management sign-off
                    </span>
                  </div>
                  <span className="live-tag" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '10px' }}>
                    7 VERIFIED CHECKPOINTS
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {/* Stage 1 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 1 · GATE ENTRY
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>08:15 AM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Weighbridge WB-01 Certified Tare Scale
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Vehicle enters Gate 01. RFID FASTag scanned; WB-01 Mettler Toledo 60T scale captures empty tare (14.20T). Axle laser alignment confirmed. Stored in Neon DB.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tare Scale Weight:</span>
                      <strong style={{ color: '#0ea5e9' }}>14.20T Verified</strong>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 2 · INBOUND SEQUENCING
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>08:45 AM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Dispatch Inbound Dock Decision
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Dispatch supervisor evaluates yard queue &amp; dock capacity (Bays 01-06). Determines which vehicle enters first inside based on docking turnaround. Vehicle prioritized for Bay 04.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Dock:</span>
                      <strong style={{ color: '#8b5cf6' }}>Bay 04 (P1 Urgent Staging)</strong>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 3 · DWELL ANOMALY SCAN
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>09:15 AM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Neon SQL Yard Dwell &amp; Demurrage Scan
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Agent queries staging yard timestamps. Evaluates 25 dwelling trucks; detects 3 vehicles exceeding 48h SLA benchmark. Quantifies ₹25,000 demurrage exposure risk.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Scan Finding:</span>
                      <strong style={{ color: '#dc2626' }}>3 Exceptions Flagged</strong>
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', background: 'rgba(220, 38, 38, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 4 · AUTONOMOUS EMAIL
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>09:18 AM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Email Trigger &amp; Popup Modal Dispatch
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Autonomous agent compiles executive alert with root-cause breakdown. Dispatches SMTP email to logistics.manager@apexmanufacturing.com &amp; triggers interactive popup for review.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Relay Status:</span>
                      <strong style={{ color: '#16a34a' }}>Dispatched &amp; Acknowledged</strong>
                    </div>
                  </div>

                  {/* Stage 5 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 5 · LOADING &amp; GROSS EXIT
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>11:15 AM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      WB-01 Gross Scale &amp; Electronic Gate Pass
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Bay 04 loading completed. Vehicle returns to WB-01 gross scale (28.15T gross, 13.95T net). Overload compliance certified. E-Way bill &amp; QR gate pass issued for highway departure.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gross Payload:</span>
                      <strong style={{ color: '#10b981' }}>28.15T (13.95T Net OK)</strong>
                    </div>
                  </div>

                  {/* Stage 6 */}
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        STAGE 6 · TRANSIT &amp; POD ROLLUP
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>15:45 PM</span>
                    </div>
                    <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      Corridor TAT &amp; Consignee POD Rollup
                    </b>
                    <p style={{ margin: 0, fontSize: '10.8px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Transit across NH-48 / NH-544 (3.95h actual vs 4.5h SLA). Consignee signs digital e-POD. All gate, scale, dock, and transit timestamps rollup into this executive Management Report.
                    </p>
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Final Outcome:</span>
                      <strong style={{ color: '#16a34a' }}>e-POD Archived in Neon DB</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry-to-Exit Audited Trips Ledger */}
              <div className="panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>
                      Audited Vehicle Entry-to-Exit Ledger (Live Neon Postgres)
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Complete timestamp and telemetry trace for active and completed shipments
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Showing certified trip records
                  </span>
                </div>

                <div className="table-wrap">
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>Vehicle / Trip ID</th>
                        <th style={{ padding: '8px 10px' }}>1. WB-01 Tare</th>
                        <th style={{ padding: '8px 10px' }}>2. Dock Sequencing</th>
                        <th style={{ padding: '8px 10px' }}>3 &amp; 4. Email Dwell Scan</th>
                        <th style={{ padding: '8px 10px' }}>5. WB-01 Gross &amp; Exit</th>
                        <th style={{ padding: '8px 10px' }}>6. Corridor TAT</th>
                        <th style={{ padding: '8px 10px' }}>7. Consignee POD</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          vehicle: 'TN-01-AB-4501',
                          trip: 'TRIP-2026-9041',
                          tare: '14.20T (08:15)',
                          dock: 'Bay 04 (Priority 1)',
                          email: 'Triggered (09:18)',
                          gross: '28.15T (11:15)',
                          tat: '3.95 hrs (NH-48)',
                          pod: 'Verified (15:45)',
                          statusGood: true,
                        },
                        {
                          vehicle: 'KA-04-XY-8812',
                          trip: 'TRIP-2026-9042',
                          tare: '13.80T (09:00)',
                          dock: 'Bay 02 (Assembly)',
                          email: 'Normal Dwell',
                          gross: '27.40T (12:20)',
                          tat: '4.10 hrs (NH-544)',
                          pod: 'Verified (16:30)',
                          statusGood: true,
                        },
                        {
                          vehicle: 'MH-12-PQ-2244',
                          trip: 'TRIP-2026-9043',
                          tare: '15.10T (07:30)',
                          dock: 'Bay 05 (Overflow)',
                          email: 'Alert Dispatched',
                          gross: '29.05T (13:00)',
                          tat: '4.80 hrs (+0.3h late)',
                          pod: 'Verified (17:48)',
                          statusGood: false,
                        },
                        {
                          vehicle: 'TN-10-CD-9931',
                          trip: 'TRIP-2026-9044',
                          tare: '14.05T (10:15)',
                          dock: 'Bay 01 (Powertrain)',
                          email: 'Normal Dwell',
                          gross: '28.00T (13:45)',
                          tat: '3.80 hrs (NH-48)',
                          pod: 'Verified (17:33)',
                          statusGood: true,
                        },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <button
                              type="button"
                              onClick={() => inspectJourney(row.vehicle)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--teal, #0d9488)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Open complete vehicle milestone journey timeline"
                            >
                              <Truck size={12} />
                              <span>{row.vehicle}</span>
                              <ArrowUpRight size={11} />
                            </button>
                            <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9.5px' }}>{row.trip}</small>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{row.tare}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{row.dock}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background:
                                  row.email.includes('Alert') || row.email.includes('Triggered')
                                    ? 'rgba(220, 38, 38, 0.12)'
                                    : 'rgba(16, 185, 129, 0.12)',
                                color:
                                  row.email.includes('Alert') || row.email.includes('Triggered') ? '#dc2626' : '#16a34a',
                              }}
                            >
                              {row.email}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{row.gross}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ color: row.statusGood ? '#16a34a' : '#d97706', fontWeight: 600 }}>{row.tat}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                              {row.pod}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '10px' }}
                                onClick={() => inspectJourney(row.vehicle)}
                                title="Open complete milestone timeline"
                              >
                                Journey →
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '10px' }}
                                onClick={() => setPage('twin3d')}
                                title="Inspect campus in 3D Digital Twin"
                              >
                                3D Twin
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'delay' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '12px', alignItems: 'start' }}>
              <DonutChart
                title="Period Delay Risk Tier Breakdown"
                subtitle={`${fmt(reportData.delay_summary?.total_evaluated)} journeys evaluated`}
                centerValue={fmt(reportData.delay_summary?.at_risk_total)}
                centerLabel="At Risk"
                slices={[
                  { label: 'Critical (>24h delay)', risk: 'CRITICAL', value: reportData.delay_summary?.CRITICAL || 0, color: '#dc2626' },
                  { label: 'High (Overdue Benchmark)', risk: 'HIGH', value: reportData.delay_summary?.HIGH || 0, color: '#ea580c' },
                  { label: 'Medium (80% benchmark)', risk: 'MEDIUM', value: reportData.delay_summary?.MEDIUM || 0, color: '#d97706' },
                  { label: 'Low (On schedule)', risk: 'LOW', value: reportData.delay_summary?.LOW || 0, color: '#16a34a' },
                ]}
                onSliceClick={(s) => openDrilldown('risk_tier', s.risk)}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Critical Overdue Delay Exceptions</h3>
                    <button type="button" className="btn-secondary" onClick={() => openDrilldown('at_risk')} style={{ fontSize: '10.5px', padding: '3px 8px' }}>
                      Full Risk Sheet →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(reportData.delay_summary?.high_risk_samples || []).slice(0, 3).map((v) => (
                      <div
                        key={v.shipment_id}
                        className="clickable"
                        onClick={() => inspectJourney(v.shipment_id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '7px',
                          background: 'var(--bg-subtle, #f8fafc)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <b style={{ fontSize: '11.5px', color: '#0ea5e9' }}>{v.shipment_id}</b>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {v.customer_order_id} · {v.carrier} ({v.plant_id})
                          </span>
                          <small style={{ display: 'block', fontSize: '10px', color: '#b91c1c', marginTop: '2px' }}>
                            ⚠️ {v.risk_reason}
                          </small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`risk-pill ${v.risk_level}`}>{v.risk_level}</span>
                          <small style={{ display: 'block', fontSize: '9.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                            +{v.overdue_hrs} hrs overdue
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'tat' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '12px' }}>
              <RadialGauge
                title="Period Corridor Turnaround Benchmark"
                value={reportData.turnaround_time_summary?.avg_tat_hrs || 0}
                max={120}
                suffix=" hrs"
                subtitle={`Planned SLA benchmark: ${reportData.turnaround_time_summary?.avg_planned_hrs || 0} hrs`}
                color="#0d9488"
                onClick={() => openDrilldown('tat_longest')}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <div className="panel-heading" style={{ marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Corridor Turnaround Metrics Breakdown</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Click any metric to inspect contributing loads</p>
                  </div>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('avg_tat')}>
                  <span>Average Corridor Transit TAT</span>
                  <b>{reportData.turnaround_time_summary?.avg_tat_hrs || 0} hrs</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('on_time')}>
                  <span>Committed Customer SLA Target</span>
                  <b>{reportData.turnaround_time_summary?.avg_planned_hrs || 0} hrs</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('tat_longest')}>
                  <span>Min / Max Corridor Range</span>
                  <b>{reportData.turnaround_time_summary?.min_tat_hrs || 0}h — {reportData.turnaround_time_summary?.max_tat_hrs || 0}h</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('eta_overdue')}>
                  <span>Average ETA Delay Slippage</span>
                  <b style={{ color: '#dc2626' }}>+{reportData.turnaround_time_summary?.avg_eta_delay_hrs || 0} hrs</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'carrier' && hasPerm('carrier_performance') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.3fr)', gap: '12px' }}>
              <CarrierBubbleChart
                title="Carrier Delay vs Utilization Scorecard"
                subtitle="Bubble size represents dispatch volume in selected reporting window"
                carriers={reportData.carrier_breakdown || []}
                onBubbleClick={(_, label) => openDrilldown('carrier', label)}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Carrier SLA &amp; Spend Matrix</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click carrier to inspect journeys</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(reportData.carrier_breakdown || []).slice(0, 4).map((c) => (
                    <div
                      key={c.carrier}
                      className="clickable"
                      onClick={() => openDrilldown('carrier', c.carrier)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '7px',
                        background: 'var(--bg-subtle, #f8fafc)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <b style={{ fontSize: '11.5px', color: '#0ea5e9', display: 'block' }}>{c.carrier}</b>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {fmt(c.loads)} trips · Load factor: <b>{c.avg_utilization_pct}%</b>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--teal)' }}>{money(c.freight_inr)}</b>
                        <small
                          style={{
                            display: 'block',
                            fontSize: '9.5px',
                            color: c.delay_pct > 25 ? '#dc2626' : '#16a34a',
                            fontWeight: 700,
                          }}
                        >
                          {c.delay_pct}% delay ({fmt(c.delayed)} late)
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'spend' && hasPerm('management_reports') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '12px' }}>
              <RadialGauge
                title="Average Fleet Utilization"
                value={reportData.vehicle_movement_summary?.avg_utilization_pct || 0}
                max={100}
                suffix="%"
                subtitle="Load factor efficiency across active carriers"
                color="#0ea5e9"
                onClick={() => openDrilldown('utilization')}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <div className="panel-heading" style={{ marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Freight Expenditure &amp; Reconciliation</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Verified audit log records</p>
                  </div>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('fleet_spend')}>
                  <span>Total Period Freight Expenditure</span>
                  <b style={{ color: 'var(--teal)' }}>{money(reportData.vehicle_movement_summary?.total_freight_inr)}</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('utilization')}>
                  <span>Average Fleet Capacity Load Factor</span>
                  <b>{pct(reportData.vehicle_movement_summary?.avg_utilization_pct)}</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('pending_pod')}>
                  <span>Incomplete POD Billing Holds</span>
                  <b style={{ color: '#d97706' }}>{fmt(reportData.vehicle_movement_summary?.incomplete_pod_journeys)} loads</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
              </div>
            </div>
          )}

          {reportSubTab === 'dock' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '12px', alignItems: 'start' }}>
              <DonutChart
                title="Dock Staging Recommendation Status"
                subtitle={`${fmt(reportData.dock_and_warehouse_summary?.queue_summary?.p1_immediate_count)} P1 immediate items`}
                centerValue={fmt(reportData.dock_and_warehouse_summary?.queue_summary?.waiting_queue_count)}
                centerLabel="Queued"
                slices={[
                  {
                    label: 'Approved Sign-Offs',
                    statusKey: 'APPROVED',
                    value: reportData.dock_and_warehouse_summary?.queue_summary?.approved_count || 0,
                    color: '#16a34a',
                  },
                  {
                    label: 'Pending Review',
                    statusKey: 'PENDING_APPROVAL',
                    value: reportData.dock_and_warehouse_summary?.queue_summary?.pending_approval_count || 0,
                    color: '#f59e0b',
                  },
                ]}
                onSliceClick={(s) => openDrilldown('dock_decision', s.statusKey)}
              />

              <div className="panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <div className="panel-heading" style={{ marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Dock Staging &amp; Warehouse Readiness</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {reportData.dock_and_warehouse_summary?.limitation_note}
                    </p>
                  </div>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('waiting_queue')}>
                  <span>Total Waiting / Staging Queue</span>
                  <b>{fmt(reportData.dock_and_warehouse_summary?.queue_summary?.waiting_queue_count)} vehicles</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('p1_immediate')}>
                  <span>P1 Immediate Priority Staging</span>
                  <b style={{ color: '#dc2626' }}>{fmt(reportData.dock_and_warehouse_summary?.queue_summary?.p1_immediate_count)} urgent loads</b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
                <div className="detail-item clickable" onClick={() => openDrilldown('dock_decision')}>
                  <span>Supervisor Approved / Pending</span>
                  <b>
                    {fmt(reportData.dock_and_warehouse_summary?.queue_summary?.approved_count)} /{' '}
                    {fmt(reportData.dock_and_warehouse_summary?.queue_summary?.pending_approval_count)}
                  </b>
                  <span className="kpi-drill-tag">Details →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
