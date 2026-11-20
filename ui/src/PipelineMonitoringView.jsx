import { useEffect, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, Database,
  Layers, RefreshCw, Server, ShieldCheck
} from 'lucide-react'

export default function PipelineMonitoringView({ authFetch, onToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshingMode, setRefreshingMode] = useState('')

  const loadPipeline = async () => {
    setLoading(true)
    try {
      const r = await authFetch('/api/pipeline/monitoring')
      if (r.ok) setData(await r.json())
    } catch (e) {
      onToast?.(`Failed to load pipeline telemetry: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPipeline()
  }, [])

  const triggerRefresh = async (mode) => {
    setRefreshingMode(mode)
    try {
      const r = await authFetch('/api/pipeline/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!r.ok) throw new Error(await r.text())
      const res = await r.json()
      onToast?.(`Pipeline ${res.run_type} succeeded (${res.records_processed} rows verified in ${res.duration_ms}ms)`)
      await loadPipeline()
    } catch (e) {
      onToast?.(`Pipeline refresh failed: ${e.message}`)
    } finally {
      setRefreshingMode('')
    }
  }

  const db = data?.database || {}
  const dqPass = (data?.data_quality || []).filter(c => c.status === 'PASS').length
  const dqTotal = (data?.data_quality || []).length

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            CENTRAL DATA PIPELINE MONITORING &amp; CONTROL TOWER
            <span className="live-tag">CONTROLLED INGESTION · VIEWS · DQ</span>
          </div>
          <h1>Data Pipeline Monitoring</h1>
          <p>End-to-end observability across source systems, Neon PostgreSQL ingestion, analytical views, data quality assertions, and execution history.</p>
        </div>

        <div className="heading-actions">
          <button className="btn-secondary" disabled={!!refreshingMode} onClick={() => triggerRefresh('incremental')}>
            <RefreshCw size={14} className={refreshingMode === 'incremental' ? 'spin' : ''} />
            {refreshingMode === 'incremental' ? 'Verifying...' : 'Verify & Re-Process Agents'}
          </button>
          <button className="btn-primary" disabled={!!refreshingMode} onClick={() => triggerRefresh('full')}>
            <Database size={14} />
            {refreshingMode === 'full' ? 'Reloading ZIP...' : 'Controlled Full Refresh'}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="panel" style={{ padding: '36px', textAlign: 'center' }}>Loading Neon pipeline telemetry...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top"><span>Connected Neon Host</span><div className="kpi-icon teal"><Server size={16} /></div></div>
              <div style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-all', margin: '6px 0' }}>{db.host || 'Connected'}</div>
              <div className="kpi-foot">Dialect: {db.dialect} · Schema: {db.schema}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top"><span>Total Records Ingested</span><div className="kpi-icon blue"><Database size={16} /></div></div>
              <div className="kpi-value">{Number(db.total_rows || 0).toLocaleString('en-IN')}</div>
              <div className="kpi-foot">{db.total_tables || 17} source tables · {(data?.analytical_views || []).length} SQL views</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top"><span>Data Freshness Bounds</span><div className="kpi-icon purple"><Activity size={16} /></div></div>
              <div style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0' }}>{db.latest_dispatch_date || '—'}</div>
              <div className="kpi-foot">Inventory snapshot: {db.latest_snapshot_date || '—'}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top"><span>Data Quality Checks</span><div className="kpi-icon green"><ShieldCheck size={16} /></div></div>
              <div className="kpi-value">{dqPass} / {dqTotal}</div>
              <div className="kpi-foot">Automated SQL null, duplicate &amp; integrity checks</div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Source Systems */}
            <div className="panel full-table">
              <div className="table-caption"><b>Source System Connectivity Matrix</b><span>Honest integration status</span></div>
              <div className="table-wrap scrollable-sm">
                <table>
                  <thead><tr><th>Source System</th><th>Feed Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.source_systems || []).map((s, i) => (
                      <tr key={i}>
                        <td><b>{s.name}</b></td>
                        <td>{s.type}</td>
                        <td><span className={`risk-pill ${s.status === 'CONNECTED' ? 'LOW' : 'MEDIUM'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytical Views */}
            <div className="panel full-table">
              <div className="table-caption"><b>Agent Analytical Views (Neon <code>public</code>)</b><span>Pre-built transformation models</span></div>
              <div className="table-wrap scrollable-sm">
                <table>
                  <thead><tr><th>View Name</th><th>Cols</th><th>Rows</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.analytical_views || []).map(v => (
                      <tr key={v.view_name}>
                        <td><code>{v.view_name}</code></td>
                        <td>{v.column_count}</td>
                        <td><b>{Number(v.total_rows || 0).toLocaleString('en-IN')}</b></td>
                        <td><span className={`risk-pill ${v.status === 'ACTIVE' ? 'LOW' : 'CRITICAL'}`}>{v.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 17 Ingested Source Tables */}
          <div className="panel full-table">
            <div className="table-caption">
              <b>Ingested Neon PostgreSQL Tables ({(data?.tables || []).length})</b>
              <span>Preserves users, RBAC permissions, audit logs, conversations &amp; dock approvals during refresh</span>
            </div>
            <div className="table-wrap" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Table Name</th><th>CSV Source</th><th>Source Rows</th><th>Loaded Rows</th><th>Columns</th><th>Last Ingested</th><th>Status</th></tr></thead>
                <tbody>
                  {(data?.tables || []).map(t => (
                    <tr key={t.table_name}>
                      <td><b>{t.table_name}</b></td>
                      <td><small>{t.source_file}</small></td>
                      <td>{Number(t.source_rows || 0).toLocaleString('en-IN')}</td>
                      <td><b>{Number(t.loaded_rows || 0).toLocaleString('en-IN')}</b></td>
                      <td>{t.column_count}</td>
                      <td><small>{t.ingested_at}</small></td>
                      <td><span className={`risk-pill ${t.status === 'SUCCESS' ? 'LOW' : 'CRITICAL'}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Quality Audit + Execution Runs */}
          <div className="bottom-grid">
            <div className="panel full-table">
              <div className="table-caption"><b>Live SQL Data Quality Matrix</b><span>Nulls, duplicates, durations &amp; relationships</span></div>
              <div className="table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table>
                  <thead><tr><th>Table</th><th>Quality Check</th><th>Issues</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.data_quality || []).map(q => (
                      <tr key={q.check_id}>
                        <td><small>{q.table}</small></td>
                        <td>{q.check_name}</td>
                        <td><b>{q.issue_count}</b></td>
                        <td><span className={`risk-pill ${q.status === 'PASS' ? 'LOW' : q.status === 'WARN' ? 'MEDIUM' : 'CRITICAL'}`}>{q.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel full-table">
              <div className="table-caption"><b>Pipeline &amp; Agent Execution Logs</b><span>Persisted run telemetry</span></div>
              <div className="table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table>
                  <thead><tr><th>Pipeline / Agent</th><th>Triggered By</th><th>Duration</th><th>Records</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.pipeline_runs || []).map(p => (
                      <tr key={`p-${p.id}`}>
                        <td><b>{p.run_type}</b><small>{p.started_at}</small></td>
                        <td>{p.triggered_by}</td>
                        <td>{p.duration_ms} ms</td>
                        <td>{Number(p.records_processed || 0).toLocaleString('en-IN')}</td>
                        <td><span className={`risk-pill ${p.status === 'SUCCESS' ? 'LOW' : 'CRITICAL'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                    {(data?.agent_executions || []).map(a => (
                      <tr key={`a-${a.id}`}>
                        <td><b>{a.agent_key}</b><small>{a.run_at}</small></td>
                        <td>{a.triggered_by}</td>
                        <td>{a.duration_ms} ms</td>
                        <td>{Number(a.records_processed || 0).toLocaleString('en-IN')}</td>
                        <td><span className={`risk-pill ${a.status === 'SUCCESS' ? 'LOW' : 'CRITICAL'}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

