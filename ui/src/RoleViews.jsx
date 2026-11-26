import { useEffect, useState } from 'react'
import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Factory, History,
  KeyRound, Lock, PackageCheck, Search, ShieldAlert, ShieldCheck,
  Sparkles, Timer, Truck, UserPlus, Users, Warehouse, X
} from 'lucide-react'
import {
  AreaTrendChart,
  CarrierBubbleChart,
  DonutChart,
  RadialGauge,
  StockCompositionBar,
} from './Charts'

const fmt = (v) => Number(v || 0).toLocaleString('en-IN')
const pct = (v) => `${Number(v || 0).toFixed(1)}%`

/* ===================== DISPATCH WORKER DASHBOARD ===================== */
export function DispatchDashboardView({ data, onInspectJourney, onDrilldown, onNavigate }) {
  const k = data?.kpis || {}
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> DISPATCH OPERATIONS WORKSPACE · SCOPE: {data?.plant_scope || 'ALL'}</div>
          <h1>Dispatch Operations Dashboard</h1>
          <p>Track assigned outbound dispatches, pending staging queues, POD tasks, and dispatch-level delay warnings.</p>
        </div>
        <div className="heading-actions">
          <button className="btn-secondary" onClick={() => onNavigate('dock')}><Warehouse size={14} /> Staging Queue</button>
          <button className="btn-primary" onClick={() => onNavigate('delay')}><Truck size={15} /> Inward Gate Checkpoint</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Assigned Dispatches" value={fmt(k.assigned_dispatches)} icon={Truck} tone="blue" foot={`Plant scope: ${data?.plant_scope || 'ALL'}`} onClick={() => onDrilldown?.('all_shipments')} />
        <KpiCard title="Active In-Transit" value={fmt(k.active_in_transit)} icon={Activity} tone="purple" foot="Dispatched loads on route" onClick={() => onDrilldown?.('in_transit')} />
        <KpiCard title="Delayed Dispatches" value={fmt(k.delayed_dispatches)} icon={AlertTriangle} tone="red" foot="Requires dispatch coordination" onClick={() => onDrilldown?.('delayed')} />
        <KpiCard title="Pending POD Sign-Off" value={fmt(k.pending_pod_count)} icon={ShieldCheck} tone="amber" foot="Pending or exception PODs" onClick={() => onDrilldown?.('pending_pod')} />
      </div>

      <div className="bottom-grid">
        <DonutChart
          title="Assigned Dispatch Execution Status"
          subtitle={`Facility scope: ${data?.plant_scope || 'ALL'}`}
          centerValue={fmt(k.assigned_dispatches)}
          centerLabel="Dispatches"
          slices={[
            { label: 'Completed Dispatches', value: k.completed_dispatches || 0, metric: 'delivered', color: '#16a34a' },
            { label: 'Active In-Transit', value: k.active_in_transit || 0, metric: 'in_transit', color: '#6366f1' },
            { label: 'Delayed Exception', value: k.delayed_dispatches || 0, metric: 'delayed', color: '#dc2626' },
          ]}
          onSliceClick={(s) => onDrilldown?.(s.metric)}
        />

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Finished-Goods Warehouse Staging Readiness</h3>
              <p>Click warehouse to inspect SKU &amp; lot stock readiness</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(data?.dock_queue?.warehouse_readiness || []).map(w => (
              <div
                key={`${w.plant_id}-${w.warehouse_id}`}
                className="progress-item-click"
                onClick={() => onDrilldown?.('warehouse_stock', w.plant_id)}
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <b>{w.plant_id} · {w.warehouse_id}</b>
                  <span style={{ color: 'var(--text-muted)' }}>On Hand: <b style={{ color: 'var(--text-primary)' }}>{fmt(w.on_hand_qty)}</b> units · <span className="kpi-drill-tag">Details →</span></span>
                </div>
                <StockCompositionBar warehouse={w} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel full-table">
          <div className="table-caption">
            <b>Assigned Outbound Dispatches</b>
            <span>Click any row to view timeline (pricing &amp; carrier costs restricted)</span>
          </div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead><tr><th>Shipment</th><th>Order</th><th>Vehicle</th><th>Plant</th><th>ETA</th><th>Qty</th><th>POD</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.assigned_dispatches || []).slice(0, 14).map(r => (
                  <tr key={r.shipment_id} className="clickable" onClick={() => onInspectJourney(r.shipment_id)}>
                    <td><b>{r.shipment_id}</b></td>
                    <td>{r.customer_order_id}<small>{r.priority}</small></td>
                    <td>{r.vehicle_type}</td>
                    <td>{r.plant_id}</td>
                    <td>{r.planned_eta}</td>
                    <td>{fmt(r.shipment_qty)}</td>
                    <td><StatusBadge value={r.pod_status} /></td>
                    <td><StatusBadge value={r.shipment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel full-table">
          <div className="table-caption">
            <b>Dispatch Delay Alerts</b>
            <span>Sorted by urgency within assigned plant</span>
          </div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead><tr><th>Shipment</th><th>Checkpoint</th><th>Risk</th><th>Recommended Dispatch Action</th></tr></thead>
              <tbody>
                {(data?.delay_alerts || []).slice(0, 10).map(v => (
                  <tr key={v.shipment_id} className="clickable" onClick={() => onInspectJourney(v.shipment_id)}>
                    <td><b>{v.shipment_id}</b><small>{v.customer_order_id}</small></td>
                    <td><small>{v.current_checkpoint.replaceAll('_', ' ')}</small></td>
                    <td><span className={`risk-pill ${v.risk_level}`}>{v.risk_level}</span></td>
                    <td className="td-wrap">{v.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== LOGISTICS PERSONNEL DASHBOARD ===================== */
export function LogisticsDashboardView({ data, onInspectJourney, onDrilldown, onNavigate }) {
  const k = data?.kpis || {}
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> TRANSPORTATION &amp; MOVEMENT · SCOPE: {data?.plant_scope || 'ALL'}</div>
          <h1>Logistics Operations Dashboard</h1>
          <p>Monitor vehicle movement journeys, corridor turnaround times, carrier scorecards, and predictive delay alerts.</p>
        </div>
        <div className="heading-actions">
          <button className="btn-secondary" onClick={() => onNavigate('tat')}><Timer size={14} /> Full TAT Analysis</button>
          <button className="btn-primary" onClick={() => onNavigate('delay')}><Truck size={15} /> Vehicle Operations</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Vehicle Movements" value={fmt(k.total_movements)} icon={Truck} tone="blue" foot={`Plant scope: ${data?.plant_scope || 'ALL'}`} onClick={() => onDrilldown?.('all_shipments')} />
        <KpiCard title="Vehicles In Corridor" value={fmt(k.vehicles_in_corridor)} icon={Activity} tone="purple" foot="Active corridor transit" onClick={() => onDrilldown?.('in_transit')} />
        <KpiCard title="Average Corridor TAT" value={`${k.avg_tat_hrs || 0} hrs`} icon={Timer} tone="teal" foot={`On-time rate: ${pct(k.on_time_pct)}`} onClick={() => onDrilldown?.('tat_longest')} />
        <KpiCard title="Avg Fleet Utilization" value={pct(k.avg_utilization_pct)} icon={PackageCheck} tone="orange" foot={`${fmt(k.delayed_movements)} delayed trips`} onClick={() => onDrilldown?.('utilization')} />
      </div>

      <div className="health-stat-grid">
        <RadialGauge
          title="On-Time Corridor Delivery"
          value={k.on_time_pct || 0}
          subtitle={`${fmt(k.total_movements)} corridor trips evaluated`}
          color="#16a34a"
          onClick={() => onDrilldown?.('on_time')}
        />
        <RadialGauge
          title="Fleet Capacity Utilization"
          value={k.avg_utilization_pct || 0}
          subtitle="Average vehicle load factor"
          color="#0ea5e9"
          onClick={() => onDrilldown?.('utilization')}
        />
        <RadialGauge
          title="Delayed Movement Share"
          value={k.total_movements ? (Number(k.delayed_movements || 0) / Number(k.total_movements)) * 100 : 0}
          subtitle={`${fmt(k.delayed_movements)} delayed corridor movements`}
          color="#dc2626"
          onClick={() => onDrilldown?.('delayed')}
        />
      </div>

      <div className="analytics-grid">
        <AreaTrendChart
          title="Corridor Turnaround vs ETA Delay Trend"
          subtitle={`Daily actual corridor duration (${data?.plant_scope || 'ALL'})`}
          data={data?.daily_trend || []}
          xKey="day"
          seriesA={{ key: 'avg_tat_hrs', label: 'Avg TAT', color: '#0d9488' }}
          seriesB={{ key: 'avg_delay_hrs', label: 'Avg Delay', color: '#dc2626' }}
          unit=" hrs"
          onPointClick={(d) => onDrilldown?.('day_trend', d.day)}
        />

        <CarrierBubbleChart
          title="Carrier Utilization vs Delay Matrix"
          subtitle="Bubble size reflects corridor volume"
          carriers={data?.by_carrier || []}
          onBubbleClick={(_, label) => onDrilldown?.('carrier', label)}
        />
      </div>

      <div className="analytics-grid">
        <div className="panel full-table">
          <div className="panel-heading"><div><h3>Carrier &amp; Vehicle Type Turnaround</h3><p>Actual corridor TAT vs delay percentage</p></div></div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead><tr><th>Carrier partner</th><th>Journeys</th><th>Avg TAT</th><th>Avg Delay</th><th>Delay %</th></tr></thead>
              <tbody>
                {(data?.by_carrier || []).map(c => (
                  <tr key={c.carrier}>
                    <td><b>{c.carrier}</b></td>
                    <td>{fmt(c.journeys)}</td>
                    <td>{c.avg_actual_hrs} hrs</td>
                    <td>{c.avg_delay_hrs} hrs</td>
                    <td><StatusBadge value={c.delay_pct > 33 ? 'DELAYED' : 'DELIVERED'} customText={`${c.delay_pct}%`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel full-table">
          <div className="panel-heading"><div><h3>Active Predictive Delay Alerts</h3><p>Click row to inspect full milestone history</p></div></div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead><tr><th>Shipment</th><th>Carrier / Type</th><th>Elapsed</th><th>Risk</th></tr></thead>
              <tbody>
                {(data?.delay_alerts || []).slice(0, 8).map(v => (
                  <tr key={v.shipment_id} className="clickable" onClick={() => onInspectJourney(v.shipment_id)}>
                    <td><b>{v.shipment_id}</b><small>{v.arrival_timestamp}</small></td>
                    <td>{v.carrier}<small>{v.vehicle_type}</small></td>
                    <td>{v.time_spent_hrs} hrs</td>
                    <td><span className={`risk-pill ${v.risk_level}`}>{v.risk_level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== MANAGER USER MANAGEMENT, PERMISSION MATRIX & AUDIT LOGS ===================== */
export function UserManagementView({ authFetch, onToast }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [rolesData, setRolesData] = useState({ roles: [], all_permissions: [] })
  const [auditLogs, setAuditLogs] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    employee_id: '', full_name: '', username: '', email: '',
    department: 'Dispatch Operations', plant_id: 'ALL', role_id: 2, password: ''
  })
  const [resetTarget, setResetTarget] = useState(null)
  const [resetPwd, setResetPwd] = useState('')

  const loadAll = async () => {
    try {
      const p = new URLSearchParams()
      if (search.trim()) p.append('search', search.trim())
      if (roleFilter !== 'ALL') p.append('role', roleFilter)
      if (deptFilter !== 'ALL') p.append('department', deptFilter)
      const [uRes, rRes, aRes] = await Promise.all([
        authFetch(`/api/admin/users?${p.toString()}`),
        authFetch('/api/admin/roles'),
        authFetch('/api/admin/audit-logs?limit=100'),
      ])
      if (uRes.ok) setUsers(await uRes.json())
      if (rRes.ok) setRolesData(await rRes.json())
      if (aRes.ok) setAuditLogs(await aRes.json())
    } catch {}
  }

  useEffect(() => { loadAll() }, [search, roleFilter, deptFilter])

  const createUser = async (e) => {
    e.preventDefault()
    try {
      const r = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role_id: Number(form.role_id) }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'User creation failed')
      onToast(`Created user ${data.full_name} (${data.role})`)
      setShowCreate(false)
      setForm({ employee_id: '', full_name: '', username: '', email: '', department: 'Dispatch Operations', plant_id: 'ALL', role_id: 2, password: '' })
      loadAll()
    } catch (err) {
      onToast(`Error: ${err.message}`)
    }
  }

  const updateUser = async (uid, patch) => {
    try {
      const r = await authFetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Update failed')
      onToast(`Updated ${data.username}`)
      loadAll()
    } catch (err) {
      onToast(`Error: ${err.message}`)
    }
  }

  const doResetPassword = async (e) => {
    e.preventDefault()
    if (!resetTarget) return
    try {
      const r = await authFetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPwd }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Reset failed')
      onToast(data.message)
      setResetTarget(null)
      setResetPwd('')
      loadAll()
    } catch (err) {
      onToast(`Error: ${err.message}`)
    }
  }

  const toggleRolePermission = async (roleObj, permKey) => {
    const current = new Set(roleObj.permissions || [])
    if (current.has(permKey)) current.delete(permKey)
    else current.add(permKey)
    try {
      const r = await authFetch(`/api/admin/roles/${roleObj.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_keys: Array.from(current) }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Permission update failed')
      onToast(`Updated ${roleObj.role_name} permission '${permKey}'`)
      loadAll()
    } catch (err) {
      onToast(`Error: ${err.message}`)
    }
  }

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)))

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> MANAGER ACCESS GOVERNANCE &amp; RBAC</div>
          <h1>User Management &amp; Security Audit</h1>
          <p>Provision employees, assign operational plants &amp; roles, configure the permission matrix, and review security audit trails.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Create Employee Account
        </button>
      </div>

      <div className="table-toolbar">
        <button className={tab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('users')}>
          <Users size={14} /> Employee Accounts ({users.length})
        </button>
        <button className={tab === 'matrix' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('matrix')}>
          <ShieldCheck size={14} /> Permission Matrix
        </button>
        <button className={tab === 'audit' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('audit')}>
          <History size={14} /> Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {tab === 'users' && (
        <>
          <div className="table-toolbar">
            <div className="searchbox">
              <Search size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Employee ID, Full Name, or Username..." />
            </div>
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="ALL">All Roles</option>
              {(rolesData.roles || []).map(r => <option key={r.id} value={r.role_name}>{r.role_name}</option>)}
            </select>
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="panel full-table">
            <div className="table-wrap scrollable-md">
              <table>
                <thead>
                  <tr><th>Employee ID</th><th>Name &amp; Username</th><th>Department</th><th>Role</th><th>Plant Scope</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><b>{u.employee_id}</b></td>
                      <td><b>{u.full_name}</b><small>{u.username} · {u.email}</small></td>
                      <td>{u.department}</td>
                      <td>
                        <select
                          className="filter-select"
                          style={{ height: '30px', fontSize: '11px' }}
                          value={u.role_id}
                          onChange={e => updateUser(u.id, { role_id: Number(e.target.value) })}
                        >
                          {(rolesData.roles || []).map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="filter-select"
                          style={{ height: '30px', fontSize: '11px' }}
                          value={u.plant_id}
                          onChange={e => updateUser(u.id, { plant_id: e.target.value })}
                        >
                          <option value="ALL">ALL Plants</option>
                          <option value="IN-KA-01">IN-KA-01</option>
                          <option value="IN-TN-01">IN-TN-01</option>
                        </select>
                      </td>
                      <td><StatusBadge value={u.is_active ? 'APPROVED' : 'REJECTED'} customText={u.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                      <td><small>{u.last_login ? u.last_login.slice(0, 19).replace('T', ' ') : 'Never'}</small></td>
                      <td>
                        <div className="approval-btns">
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '10.5px' }}
                            onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '10.5px' }}
                            onClick={() => { setResetTarget(u); setResetPwd('') }}
                          >
                            <KeyRound size={11} /> Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'matrix' && (
        <div className="panel full-table">
          <div className="table-caption">
            <b>Configurable Role-Permission Matrix</b>
            <span>Changes immediately enforce FastAPI endpoint and AI tool authorization</span>
          </div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead>
                <tr>
                  <th>Permission Module</th>
                  <th>Key</th>
                  {(rolesData.roles || []).map(r => <th key={r.id}>{r.role_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {(rolesData.all_permissions || []).map(p => (
                  <tr key={p.id}>
                    <td><b>{p.permission_name}</b><small>{p.module_name}</small></td>
                    <td><code>{p.permission_key}</code></td>
                    {(rolesData.roles || []).map(r => {
                      const checked = (r.permissions || []).includes(p.permission_key)
                      const locked = r.role_name === 'MANAGER' && p.permission_key === 'user_management'
                      return (
                        <td key={r.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            onChange={() => toggleRolePermission(r, p.permission_key)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--teal)' }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="panel full-table">
          <div className="table-caption">
            <b>Neon Security &amp; Operations Audit Trail</b>
            <span>Latest 100 events (Logins, Access Denials, Approvals, AI Queries, Admin Edits)</span>
          </div>
          <div className="table-wrap scrollable-md">
            <table>
              <thead><tr><th>Timestamp (UTC)</th><th>Employee</th><th>Action</th><th>Module</th><th>Details</th></tr></thead>
              <tbody>
                {auditLogs.map(l => (
                  <tr key={l.id}>
                    <td><small>{l.timestamp ? l.timestamp.slice(0, 19).replace('T', ' ') : '—'}</small></td>
                    <td><b>{l.username}</b><small>{l.employee_id}</small></td>
                    <td><StatusBadge value={l.action.includes('FAILED') || l.action.includes('DENIED') || l.action.includes('LOCKED') ? 'DELAYED' : 'DELIVERED'} customText={l.action} /></td>
                    <td>{l.module_name}</td>
                    <td className="td-wrap">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Employee User Account</h3>
              <button className="icon-btn" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={createUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label className="field-lbl">Employee ID</label><input className="filter-select" style={{ width: '100%' }} required value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="EMP-1024" /></div>
              <div><label className="field-lbl">Full Name</label><input className="filter-select" style={{ width: '100%' }} required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Arun Kumar" /></div>
              <div><label className="field-lbl">Username</label><input className="filter-select" style={{ width: '100%' }} required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="arun.dispatch" /></div>
              <div><label className="field-lbl">Email</label><input className="filter-select" style={{ width: '100%' }} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="arun@gwcdata.ai" /></div>
              <div><label className="field-lbl">Department</label><input className="filter-select" style={{ width: '100%' }} required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div>
                <label className="field-lbl">Plant Operational Scope</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.plant_id} onChange={e => setForm({ ...form, plant_id: e.target.value })}>
                  <option value="ALL">ALL Plants</option>
                  <option value="IN-KA-01">IN-KA-01 (Bengaluru)</option>
                  <option value="IN-TN-01">IN-TN-01 (Chennai)</option>
                </select>
              </div>
              <div>
                <label className="field-lbl">Application Role</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}>
                  {(rolesData.roles || []).map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                </select>
              </div>
              <div><label className="field-lbl">Initial Password (8+ chars, letters &amp; digits)</label><input className="filter-select" style={{ width: '100%' }} type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password: {resetTarget.username}</h3>
              <button className="icon-btn" onClick={() => setResetTarget(null)}><X size={18} /></button>
            </div>
            <form onSubmit={doResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="filter-select"
                type="password"
                required
                value={resetPwd}
                onChange={e => setResetPwd(e.target.value)}
                placeholder="Enter new password (8+ chars, letters & numbers)"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setResetTarget(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===================== USER PROFILE PAGE ===================== */
export function UserProfileView({ user, authFetch, onToast, onLogout }) {
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [busy, setBusy] = useState(false)

  const changePwd = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      })
      const res = await r.json()
      if (!r.ok) throw new Error(res.detail || 'Password update failed')
      onToast('Password changed successfully.')
      setCurPwd('')
      setNewPwd('')
    } catch (err) {
      onToast(`Error: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> EMPLOYEE PROFILE &amp; CREDENTIALS</div>
          <h1>My Operations Profile</h1>
          <p>Review your assigned operational role, plant visibility scope, authorized permissions, and update credentials.</p>
        </div>
        <button className="btn-secondary" onClick={onLogout}>Sign Out</button>
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-heading"><div><h3>Account Identity &amp; Scope</h3><p>Verified from Neon RBAC store</p></div></div>
          <div className="detail-item"><span>Employee ID</span><b>{user.employee_id}</b></div>
          <div className="detail-item"><span>Full Name</span><b>{user.full_name}</b></div>
          <div className="detail-item"><span>Username</span><b>{user.username}</b></div>
          <div className="detail-item"><span>Email</span><b>{user.email}</b></div>
          <div className="detail-item"><span>Role</span><b>{user.role}</b></div>
          <div className="detail-item"><span>Department</span><b>{user.department}</b></div>
          <div className="detail-item"><span>Plant Scope</span><b>{user.plant_id}</b></div>
          <div className="detail-item"><span>Last Login</span><b>{user.last_login ? user.last_login.slice(0, 19).replace('T', ' ') : 'Active session'}</b></div>
        </div>

        <div className="panel">
          <div className="panel-heading"><div><h3>Change Password</h3><p>Minimum 8 characters with letters and digits</p></div><Lock size={18} color="var(--teal)" /></div>
          <form onSubmit={changePwd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="filter-select" type="password" required value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="Current password" />
            <input className="filter-select" type="password" required value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password" />
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Updating...' : 'Update Password'}</button>
          </form>

          <h4 style={{ fontSize: '12px', margin: '18px 0 8px' }}>Authorized Permissions ({(user.permissions || []).length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(user.permissions || []).map(p => <span key={p} className="status info">{p}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== ACCESS DENIED PAGE (403) ===================== */
export function AccessDeniedView({ userRole, targetModule, onReturnHome }) {
  return (
    <div className="content" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <div className="panel" style={{ maxWidth: '500px', textAlign: 'center', padding: '36px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Access Denied (403)</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          Your active role (<b>{userRole}</b>) does not have permission to access <b>{targetModule || 'this restricted module'}</b>. All unauthorized access attempts are recorded in the security audit log.
        </p>
        <button className="btn-primary" style={{ margin: '0 auto' }} onClick={onReturnHome}>
          Return to Authorized Dashboard
        </button>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, tone, foot, onClick }) {
  return (
    <div className={`kpi-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="kpi-top"><span>{title}</span><div className={`kpi-icon ${tone}`}><Icon size={17} /></div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot kpi-drill-hint">
        <span>{foot}</span>
        {onClick && <span className="kpi-drill-tag">Details →</span>}
      </div>
    </div>
  )
}

export function StatusBadge({ value, customText }) {
  const v = String(value || '').toLowerCase()
  let cls = 'neutral'
  if (['delivered', 'received', 'confirmed', 'available', 'success', 'approved'].includes(v)) cls = 'good'
  else if (['delayed', 'exception', 'high', 'quality_hold', 'rejected', 'critical'].includes(v)) cls = 'bad'
  else if (['in_transit', 'pending', 'medium', 'partially_shipped', 'pending_approval'].includes(v)) cls = 'warn'
  else if (['open', 'low', 'in_production'].includes(v)) cls = 'info'
  return <span className={`status ${cls}`}>{customText || String(value || '—').replaceAll('_', ' ')}</span>
}

