import { useEffect, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Box, Calendar,
  CheckCircle2, CircleHelp, Clock3, Command, Cpu, Database, Download,
  FileSpreadsheet, FileText, Filter, History, Home, Info, Layers, LayoutDashboard, LogOut, Mail, MessageSquare,
  Moon, PackageCheck, PanelLeftClose, PanelLeftOpen, Presentation, RotateCcw, Scale, Search, Send, Server, Settings, ShieldAlert, ShieldCheck,
  Sparkles, Sun, Timer, TrendingUp, Truck, UserCircle2, Users, Warehouse, X, Zap
} from 'lucide-react'
import LoginPage from './LoginPage'
import DigitalTwin3D from './DigitalTwin3D'
import ErrorBoundary from './ErrorBoundary'
import MetricInfo from './MetricInfo'
import AgentArchitectureView from './AgentArchitectureView'
import EmailTriggerModal from './EmailTriggerModal'
import OverviewFiltersBar from './OverviewFiltersBar'
import DataSourceIntegrationsView from './DataSourceIntegrationsView'
import AgentTriggerExecutionFlow from './AgentTriggerExecutionFlow'
import VehicleEntryExitManualForm from './VehicleEntryExitManualForm'
import MetricDetailDrawer from './MetricDetailDrawer'
import VehicleJourneySheet from './VehicleJourneySheet'
import TatSmartDockView from './TatSmartDockView'
import {
  AreaTrendChart,
  CarrierBubbleChart,
  DonutChart,
  RadialGauge,
  StockCompositionBar,
} from './Charts'
import {
  AccessDeniedView,
  DispatchDashboardView,
  LogisticsDashboardView,
  UserManagementView,
  UserProfileView,
} from './RoleViews'

const fmt = (v) => Number(v || 0).toLocaleString('en-IN')
const money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const pct = (v) => `${Number(v || 0).toFixed(1)}%`

const ROLE_DEFAULT_PAGE = {
  MANAGER: 'architecture',
  DISPATCH_WORKER: 'architecture',
  LOGISTICS_PERSONNEL: 'architecture',
}

const ROLE_QUESTIONS = {
  MANAGER: [
    "Which vehicles are at critical or high delay risk today?",
    "Why was shipment SHP-000002 delayed and what was its turnaround time?",
    "What is the average vehicle turnaround time by vehicle type and carrier?",
    "Which stage contributes the highest delay or waiting time?",
    "Which waiting vehicles or high-priority orders should be staged next at FG-WH-01?",
    "Prepare this week's logistics operations management report.",
    "Prepare the daily logistics summary for 2026-10-28.",
    "Run a read-only SQL query for total freight cost and utilization by plant and carrier.",
  ],
  DISPATCH_WORKER: [
    "Show me waiting vehicles and high-priority orders needing dispatch staging.",
    "Which dispatches in my plant scope are at CRITICAL or HIGH delay risk?",
    "Track shipment SHP-000002 and show its milestone status.",
    "Which finished goods staging facilities are ready at FG-WH-01?",
  ],
  LOGISTICS_PERSONNEL: [
    "Which vehicles have exceeded their turnaround time?",
    "Compare carrier performance and average corridor TAT by vehicle type.",
    "Which stage contributes the highest waiting or slippage time?",
    "Which docks or staging facilities are available and what dock data is missing?",
    "Prepare the daily logistics summary for 2026-10-28.",
  ],
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('forgeflow_theme') || 'light')
  const [token, setToken] = useState(() => localStorage.getItem('iloa_token') || sessionStorage.getItem('iloa_token') || '')
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const [page, setPage] = useState('architecture')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState('')

  // Module data states
  const [data, setData] = useState(null)
  const [dispatchDash, setDispatchDash] = useState(null)
  const [logisticsDash, setLogisticsDash] = useState(null)
  const [twinData, setTwinData] = useState(null)
  const [dashSection, setDashSection] = useState('ALL')
  const [chartMetricMode, setChartMetricMode] = useState('trend')
  const [selectedBay, setSelectedBay] = useState(null)

  // Overview Dynamic Filters
  const [overviewYear, setOverviewYear] = useState('ALL')
  const [overviewMonth, setOverviewMonth] = useState('ALL')
  const [overviewWeek, setOverviewWeek] = useState('ALL')
  const [overviewDay, setOverviewDay] = useState('')
  const [overviewShift, setOverviewShift] = useState('ALL')
  const [overviewStart, setOverviewStart] = useState('')
  const [overviewEnd, setOverviewEnd] = useState('')
  const [overviewPlant, setOverviewPlant] = useState('ALL')
  const [overviewCarrier, setOverviewCarrier] = useState('ALL')
  const [overviewVehicleType, setOverviewVehicleType] = useState('ALL')
  const [overviewStatus, setOverviewStatus] = useState('ALL')
  const [overviewRisk, setOverviewRisk] = useState('ALL')
  const [overviewPriority, setOverviewPriority] = useState('ALL')

  // Unified Multi-Module Tabs
  const [tatDockTab, setTatDockTab] = useState('tat')
  const [archTab, setArchTab] = useState('agents')
  const [autoRunTriggerFlow, setAutoRunTriggerFlow] = useState(null)

  // Autonomous Email Trigger & Stuck Vehicle Alerts
  const [alertStatus, setAlertStatus] = useState(null)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertModalTab, setAlertModalTab] = useState('email_preview')
  const [triggeringAlert, setTriggeringAlert] = useState(false)
  const [currentAlertReport, setCurrentAlertReport] = useState(null)
  const [alertHistoryList, setAlertHistoryList] = useState([])

  // Use Case 1: Predictive Delay
  const [delayData, setDelayData] = useState(null)
  const [delayRiskFilter, setDelayRiskFilter] = useState('ALL')
  const [delayCheckpointFilter, setDelayCheckpointFilter] = useState('ALL')
  const [delayPlantFilter, setDelayPlantFilter] = useState('ALL')
  const [delayCarrierFilter, setDelayCarrierFilter] = useState('ALL')
  const [delayVehicleFilter, setDelayVehicleFilter] = useState('ALL')
  const [delayStatusFilter, setDelayStatusFilter] = useState('ALL')
  const [delaySearch, setDelaySearch] = useState('')
  const [delayStart, setDelayStart] = useState('')
  const [delayEnd, setDelayEnd] = useState('')

  // Use Case 2: TAT
  const [tatData, setTatData] = useState(null)
  const [tatPlantFilter, setTatPlantFilter] = useState('ALL')
  const [tatCarrierFilter, setTatCarrierFilter] = useState('ALL')
  const [tatVehicleFilter, setTatVehicleFilter] = useState('ALL')
  const [tatStart, setTatStart] = useState('')
  const [tatEnd, setTatEnd] = useState('')
  const [selectedTatId, setSelectedTatId] = useState('')
  const [tatDetail, setTatDetail] = useState(null)
  const [loadingTatDetail, setLoadingTatDetail] = useState(false)

  // Use Case 4: Dock
  const [dockData, setDockData] = useState(null)
  const [dockPriorityFilter, setDockPriorityFilter] = useState('ALL')
  const [dockApprovalFilter, setDockApprovalFilter] = useState('ALL')
  const [approvingId, setApprovingId] = useState(null)

  // Use Case 5: Reports
  const [reportType, setReportType] = useState('weekly')
  const [reportSubTab, setReportSubTab] = useState('summary')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportPlant, setReportPlant] = useState('ALL')
  const [reportVehicleType, setReportVehicleType] = useState('ALL')
  const [reportData, setReportData] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  // KPI & Chart Drilldown Modal
  const [drillModal, setDrillModal] = useState(null)
  const [loadingDrill, setLoadingDrill] = useState(false)
  const [drillSearch, setDrillSearch] = useState('')

  // AI Assistant
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('forgeflow_theme', theme)
  }, [theme])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const resolveApiUrl = (url) => {
    if (url && typeof url === 'string' && url.startsWith('/api') && API_BASE) {
      return `${API_BASE}${url}`
    }
    return url
  }

  const authFetch = async (url, options = {}) => {
    const finalUrl = resolveApiUrl(url)
    const headers = { ...(options.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    const resp = await fetch(finalUrl, { ...options, headers })
    if (resp.status === 401) {
      handleClearSession()
    }
    return resp
  }

  const handleClearSession = () => {
    localStorage.removeItem('iloa_token')
    sessionStorage.removeItem('iloa_token')
    setToken('')
    setUser(null)
    setData(null)
    setDispatchDash(null)
    setLogisticsDash(null)
    setTwinData(null)
    setDelayData(null)
    setTatData(null)
    setDockData(null)
    setReportData(null)
    setConversations([])
    setMessages([])
  }

  const handleLoginSuccess = (newToken, userPayload, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('iloa_token', newToken)
      sessionStorage.removeItem('iloa_token')
    } else {
      sessionStorage.setItem('iloa_token', newToken)
      localStorage.removeItem('iloa_token')
    }
    setToken(newToken)
    setUser(userPayload)
    setPage(ROLE_DEFAULT_PAGE[userPayload.role] || 'overview')
    setAuthReady(true)
  }

  const handleLogout = async () => {
    try { await authFetch('/api/auth/logout', { method: 'POST' }) } catch {}
    handleClearSession()
  }

  // Validate existing token on startup
  useEffect(() => {
    if (!token) {
      setAuthReady(true)
      return
    }
    ;(async () => {
      try {
        const r = await fetch(resolveApiUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
        if (!r.ok) throw new Error('Session expired')
        const u = await r.json()
        setUser(u)
        setPage('twin3d')
      } catch {
        handleClearSession()
      } finally {
        setAuthReady(true)
      }
    })()
  }, [])

  const hasPerm = (...keys) => {
    if (!user) return false
    const perms = new Set(user.permissions || [])
    if (user.role === 'MANAGER' && perms.has('user_management')) return true
    return keys.some(k => perms.has(k))
  }

  const loadOverviewDashboard = async () => {
    if (!user || !hasPerm('executive_dashboard', 'dispatch_dashboard', 'logistics_dashboard')) return
    try {
      const params = new URLSearchParams()
      if (overviewYear !== 'ALL') params.append('year', overviewYear)
      if (overviewMonth !== 'ALL') params.append('month', overviewMonth)
      if (overviewWeek !== 'ALL') params.append('week', overviewWeek)
      if (overviewDay) params.append('day', overviewDay)
      if (overviewShift !== 'ALL') params.append('time_shift', overviewShift)
      if (overviewStart) params.append('start_date', overviewStart)
      if (overviewEnd) params.append('end_date', overviewEnd)
      if (overviewPlant !== 'ALL') params.append('plant_id', overviewPlant)
      if (overviewCarrier !== 'ALL') params.append('carrier', overviewCarrier)
      if (overviewVehicleType !== 'ALL') params.append('vehicle_type', overviewVehicleType)
      if (overviewStatus !== 'ALL') params.append('shipment_status', overviewStatus)
      if (overviewRisk !== 'ALL') params.append('delay_risk', overviewRisk)
      if (overviewPriority !== 'ALL') params.append('priority', overviewPriority)

      const r = await authFetch(`/api/dashboard?${params.toString()}`)
      if (r.ok) {
        setData(await r.json())
      }
    } catch {}
  }

  const handleGlobalVehicleTypeChange = (vt) => {
    setOverviewVehicleType(vt)
    setReportVehicleType(vt)
    setDelayVehicleFilter(vt)
    setTatVehicleFilter(vt)
  }

  const handleGlobalPlantChange = (pl) => {
    setOverviewPlant(pl)
    setReportPlant(pl)
    setDelayPlantFilter(pl)
    setTatPlantFilter(pl)
  }

  const handleResetOverviewFilters = () => {
    setOverviewYear('ALL')
    setOverviewMonth('ALL')
    setOverviewWeek('ALL')
    setOverviewDay('')
    setOverviewShift('ALL')
    setOverviewStart('')
    setOverviewEnd('')
    setOverviewPlant('ALL')
    setOverviewCarrier('ALL')
    setOverviewVehicleType('ALL')
    setOverviewStatus('ALL')
    setOverviewRisk('ALL')
    setOverviewPriority('ALL')
    setReportVehicleType('ALL')
    setDelayVehicleFilter('ALL')
    setTatVehicleFilter('ALL')
    setReportPlant('ALL')
    setDelayPlantFilter('ALL')
    setTatPlantFilter('ALL')
  }

  const handleTriggerEmailScan = async (openModal = false) => {
    setTriggeringAlert(true)
    try {
      const r = await authFetch('/api/alerts/trigger-email-scan', { method: 'POST' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.detail || 'Trigger scan failed')
      }
      const report = await r.json()
      setCurrentAlertReport(report)
      setAlertModalTab('email_preview')
      if (openModal) {
        setAlertModalOpen(true)
      }
      setToast('🚨 Autonomous Scan Complete! Manager Alert Email Dispatched.')
      const s = await authFetch('/api/alerts/status')
      if (s.ok) setAlertStatus(await s.json())
      return report
    } catch (e) {
      setToast(`Trigger failed: ${e.message}`)
      return null
    } finally {
      setTriggeringAlert(false)
    }
  }

  const handleLoadAlertHistory = async () => {
    try {
      const r = await authFetch('/api/alerts/history')
      if (r.ok) setAlertHistoryList(await r.json())
    } catch {}
  }

  const handleSaveAlertConfig = async (cfg) => {
    const r = await authFetch('/api/alerts/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
    if (!r.ok) throw new Error('Failed to update config')
    const updated = await r.json()
    setAlertStatus(prev => ({ ...prev, config: updated }))
    return updated
  }

  const loadAuthorizedModules = async () => {
    if (!user || !token) return
    try {
      const calls = []
      if (hasPerm('executive_dashboard', 'dispatch_dashboard', 'logistics_dashboard')) {
        calls.push(loadOverviewDashboard())
        calls.push(authFetch('/api/alerts/status').then(async r => r.ok && setAlertStatus(await r.json())))
        calls.push(authFetch('/api/dispatch/dashboard').then(async r => r.ok && setDispatchDash(await r.json())))
        calls.push(authFetch('/api/logistics/dashboard').then(async r => r.ok && setLogisticsDash(await r.json())))
      }
      if (hasPerm('digital_twin')) calls.push(authFetch('/api/digital-twin').then(async r => r.ok && setTwinData(await r.json())))
      if (hasPerm('tat_optimization')) calls.push(authFetch('/api/tat').then(async r => r.ok && setTatData(await r.json())))
      if (hasPerm('delay_risk')) calls.push(authFetch('/api/delay-risk?limit=150').then(async r => r.ok && setDelayData(await r.json())))
      if (hasPerm('dock_allocation')) calls.push(authFetch('/api/dock/recommendations').then(async r => r.ok && setDockData(await r.json())))
      if (hasPerm('ai_assistant')) calls.push(authFetch('/api/conversations').then(async r => r.ok && setConversations(await r.json())))
      if (hasPerm('management_reports', 'logistics_reports')) calls.push(loadReport(hasPerm('management_reports') ? 'weekly' : 'daily'))

      await Promise.all(calls)
    } catch {
      // Keep UI responsive if an optional module fetch fails
    }
  }

  useEffect(() => {
    if (user && token) loadAuthorizedModules()
  }, [user, token])

  useEffect(() => {
    if (user && hasPerm('executive_dashboard', 'dispatch_dashboard', 'logistics_dashboard')) {
      loadOverviewDashboard()
    }
  }, [
    overviewYear,
    overviewMonth,
    overviewWeek,
    overviewDay,
    overviewShift,
    overviewStart,
    overviewEnd,
    overviewPlant,
    overviewCarrier,
    overviewVehicleType,
    overviewStatus,
    overviewRisk,
    overviewPriority,
  ])

  const loadDelayRisk = async () => {
    if (!user || !hasPerm('delay_risk')) return
    try {
      const params = new URLSearchParams()
      if (delayRiskFilter !== 'ALL') params.append('risk_level', delayRiskFilter)
      if (delayCheckpointFilter !== 'ALL') params.append('checkpoint', delayCheckpointFilter)
      if (delayPlantFilter !== 'ALL') params.append('plant_id', delayPlantFilter)
      if (delayCarrierFilter !== 'ALL') params.append('carrier', delayCarrierFilter)
      if (delayVehicleFilter !== 'ALL') params.append('vehicle_type', delayVehicleFilter)
      if (delayStatusFilter !== 'ALL') params.append('shipment_status', delayStatusFilter)
      if (delaySearch.trim()) params.append('search', delaySearch.trim())
      if (delayStart) params.append('start_date', delayStart)
      if (delayEnd) params.append('end_date', delayEnd)
      params.append('limit', '150')
      const r = await authFetch(`/api/delay-risk?${params.toString()}`)
      if (r.ok) setDelayData(await r.json())
    } catch {}
  }

  useEffect(() => {
    if (user) loadDelayRisk()
  }, [delayRiskFilter, delayCheckpointFilter, delayPlantFilter, delayCarrierFilter, delayVehicleFilter, delayStatusFilter, delaySearch, delayStart, delayEnd])

  const loadTat = async () => {
    if (!user || !hasPerm('tat_optimization')) return
    try {
      const params = new URLSearchParams()
      if (tatPlantFilter !== 'ALL') params.append('plant_id', tatPlantFilter)
      if (tatCarrierFilter !== 'ALL') params.append('carrier', tatCarrierFilter)
      if (tatVehicleFilter !== 'ALL') params.append('vehicle_type', tatVehicleFilter)
      if (tatStart) params.append('start_date', tatStart)
      if (tatEnd) params.append('end_date', tatEnd)
      const r = await authFetch(`/api/tat?${params.toString()}`)
      if (r.ok) setTatData(await r.json())
    } catch {}
  }

  useEffect(() => {
    if (user) loadTat()
  }, [tatPlantFilter, tatCarrierFilter, tatVehicleFilter, tatStart, tatEnd])

  const loadReport = async (type = reportType, s = reportStart, e = reportEnd, vt = reportVehicleType, pl = reportPlant) => {
    if (!user || !hasPerm('management_reports', 'logistics_reports')) return
    setLoadingReport(true)
    try {
      const params = new URLSearchParams({ report_type: type })
      if (type === 'custom' && s && e) {
        params.append('start_date', s)
        params.append('end_date', e)
      }
      if (vt && vt !== 'ALL') params.append('vehicle_type', vt)
      if (pl && pl !== 'ALL') params.append('plant_id', pl)
      const r = await authFetch(`/api/reports?${params.toString()}`)
      if (r.ok) setReportData(await r.json())
    } catch {
      setToast('Failed to generate report.')
    } finally {
      setLoadingReport(false)
    }
  }

  const triggerExport = async (format) => {
    if (!hasPerm('management_reports')) {
      setToast('Report exports require Manager authorization.')
      return
    }
    try {
      const params = new URLSearchParams({ format, report_type: reportType })
      if (reportType === 'custom' && reportStart && reportEnd) {
        params.append('start_date', reportStart)
        params.append('end_date', reportEnd)
      }
      if (reportVehicleType && reportVehicleType !== 'ALL') params.append('vehicle_type', reportVehicleType)
      if (reportPlant && reportPlant !== 'ALL') params.append('plant_id', reportPlant)
      const r = await authFetch(`/api/reports/export?${params.toString()}`)
      if (!r.ok) throw new Error('Export unauthorized or failed')
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `logistics_report_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(a.href)
      setToast(`Exported ${format.toUpperCase()} report successfully.`)
    } catch (err) {
      setToast(err.message || `Failed to export ${format.toUpperCase()} report.`)
    }
  }

  const inspectJourney = (shipmentId) => {
    setSelectedTatId(shipmentId)
  }

  const openDrilldown = async (metric, value = null, customFilters = null) => {
    setLoadingDrill(true)
    setDrillModal({
      metric,
      title: 'Loading operational records...',
      metric_name: 'Querying Neon PostgreSQL...',
      subtitle: 'Querying Neon PostgreSQL...',
      record_type: 'shipments',
      records: [],
    })
    try {
      const f = customFilters || {
        year: overviewYear,
        month: overviewMonth,
        week: overviewWeek,
        day: overviewDay,
        time_shift: overviewShift,
        start_date: overviewStart,
        end_date: overviewEnd,
        plant_id: overviewPlant,
        carrier: overviewCarrier,
        vehicle_type: overviewVehicleType,
        shipment_status: overviewStatus,
      }
      const params = new URLSearchParams({ metric, limit: '250' })
      if (value != null && String(value).trim()) params.append('value', String(value))
      if (f.year && f.year !== 'ALL') params.append('year', f.year)
      if (f.month && f.month !== 'ALL') params.append('month', f.month)
      if (f.week && f.week !== 'ALL') params.append('week', f.week)
      if (f.day) params.append('day', f.day)
      if (f.time_shift && f.time_shift !== 'ALL') params.append('time_shift', f.time_shift)
      if (f.start_date) params.append('start_date', f.start_date)
      if (f.end_date) params.append('end_date', f.end_date)
      if (f.plant_id && f.plant_id !== 'ALL') params.append('plant_id', f.plant_id)
      if (f.carrier && f.carrier !== 'ALL') params.append('carrier', f.carrier)
      if (f.vehicle_type && f.vehicle_type !== 'ALL') params.append('vehicle_type', f.vehicle_type)
      if (f.shipment_status && f.shipment_status !== 'ALL') params.append('shipment_status', f.shipment_status)
      const r = await authFetch(`/api/drilldown?${params.toString()}`)
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not load drilldown records')
      }
      const res = await r.json()
      setDrillModal(res)
    } catch (e) {
      setDrillModal({
        metric,
        title: 'Operational Drilldown Query',
        metric_name: 'Neon Database Query Notice',
        error: e.message || 'Could not load records from Neon database.',
        records: []
      })
      setToast(e.message)
    } finally {
      setLoadingDrill(false)
    }
  }

  const handleDockDecision = async (rec, decision) => {
    if (!hasPerm('dock_approval')) {
      setToast('Your role cannot approve or reject staging recommendations.')
      return
    }
    setApprovingId(rec.reference_id)
    try {
      const r = await authFetch('/api/dock/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_id: rec.reference_id,
          recommended_facility: rec.recommended_facility,
          priority_tier: rec.priority_tier,
          decision,
          notes: `Reviewed by ${user.full_name} (${user.role})`,
        }),
      })
      if (!r.ok) throw new Error(await r.text())
      setToast(`${rec.reference_id} marked ${decision}`)
      const d = await authFetch('/api/dock/recommendations')
      if (d.ok) setDockData(await d.json())
    } catch (e) {
      setToast(`Approval failed: ${e.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  const startChat = () => {
    setPage('assistant')
    setConversationId(null)
    setMessages([])
    setPrompt('')
  }

  const openConversation = async (id) => {
    setPage('assistant')
    setConversationId(id)
    try {
      const r = await authFetch(`/api/conversations/${id}/messages`)
      if (r.ok) setMessages(await r.json())
    } catch {}
  }

  const send = async (value = prompt) => {
    const message = value.trim()
    if (!message || busy) return
    setPrompt('')
    setMessages(m => [...m, { role: 'user', content: message }])
    setBusy(true)
    try {
      const r = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, message }),
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.detail || 'Agent request failed')
      setConversationId(result.conversation_id)
      setMessages(m => [...m, { role: 'assistant', content: result.answer, steps: result.steps }])
      const cr = await authFetch('/api/conversations')
      if (cr.ok) setConversations(await cr.json())
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Request failed: ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  // Auth loading gate
  if (!authReady) {
    return (
      <div className="login-shell">
        <div className="panel" style={{ padding: '28px 36px', textAlign: 'center' }}>
          <b>Validating session with Neon RBAC...</b>
        </div>
      </div>
    )
  }

  // Unauthenticated gate -> strictly Login Page
  if (!user || !token) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
      />
    )
  }

  const nav = [
    { id: 'architecture', label: 'Home Page', icon: Home, show: true, badge: '4X AI' },
    { id: 'overview', label: 'Operations Dashboard', icon: LayoutDashboard, show: true },
    { id: 'delay', label: 'Vehicle Operations', icon: Truck, show: hasPerm('delay_risk', 'tat_optimization', 'dock_allocation'), badge: 'OPS' },
    { id: 'integrations', label: 'Data Source Integrations', icon: Database, show: true, badge: '5 LIVE' },
    { id: 'twin3d', label: '3D Digital Twin', icon: Box, show: hasPerm('digital_twin'), badge: '3D' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, show: hasPerm('ai_assistant'), badge: 'AI' },
    { id: 'pipeline_flow', label: 'Data Pipeline & Telemetry', icon: Cpu, show: hasPerm('agent_architecture', 'pipeline_monitoring'), badge: 'LIVE' },
    { id: 'users', label: 'User Management', icon: Users, show: hasPerm('user_management', 'audit_logs') },
  ].filter(n => n.show)

  const pagePermitted = nav.some(n => n.id === page) || page === 'profile' || page === 'tat' || page === 'dock' || page === 'pipeline' || page === 'tat_dock' || page === 'vehicle_inward' || page === 'delay' || page === 'reports' || page === 'architecture' || page === 'overview' || page === 'pipeline_flow'
  const k = data?.kpis || {}
  const maxTrend = Math.max(1, ...(data?.trend || []).map(x => Number(x.shipments)))
  const delaySum = data?.delay_summary || delayData?.summary || {}
  const tatSum = data?.tat_summary || tatData?.summary || {}
  const suggestedPrompts = ROLE_QUESTIONS[user.role] || ROLE_QUESTIONS.MANAGER

  return (
    <div className="shell">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="brand">
          {sidebarOpen ? (
            <>
              <img
                src={theme === 'dark' ? '/logos/logo-horizontal-dark.png' : '/logos/logo-horizontal-light.png'}
                alt="GWC DATA.AI"
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                className="icon-btn side-toggle"
                onClick={() => setSidebarOpen(false)}
                title="Collapse navigation"
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          ) : (
            <div className="brand-collapsed">
              <img
                src={theme === 'dark' ? '/logos/logo-icon-dark.png' : '/logos/logo-icon-light.png'}
                alt="GWC"
                style={{ height: '28px', width: '28px', objectFit: 'contain', cursor: 'pointer' }}
                onClick={() => setSidebarOpen(true)}
                title="Click to expand navigation"
              />
              <button
                className="side-toggle-collapsed"
                onClick={() => setSidebarOpen(true)}
                title="Expand navigation"
              >
                <PanelLeftOpen size={15} />
              </button>
            </div>
          )}
        </div>

        {sidebarOpen ? (
          <div className="workspace-badge">
            <span className="status-dot" />
            <span>{user.role} · PLANT: {user.plant_id}</span>
          </div>
        ) : (
          <div className="workspace-badge-collapsed" title={`Live System: ${user.role} · Plant: ${user.plant_id}`}>
            <span className="status-dot" />
          </div>
        )}

        {sidebarOpen ? (
          <div className="nav-label">AUTHORIZED MODULES</div>
        ) : (
          <div className="nav-divider-collapsed" />
        )}

        <nav>
          {nav.map(n => {
            const isActive = page === n.id || (n.id === 'tat_dock' && (page === 'tat' || page === 'dock')) || (n.id === 'architecture' && page === 'pipeline')
            return (
              <button
                key={n.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (n.id === 'tat_dock') {
                    setTatDockTab('tat')
                    setPage('tat_dock')
                  } else {
                    setPage(n.id)
                  }
                }}
                title={sidebarOpen ? n.label : undefined}
              >
                <n.icon size={18} />
                {sidebarOpen && <span>{n.label}</span>}
                {n.badge && sidebarOpen && <span className="nav-badge">{n.badge}</span>}
                {!sidebarOpen && (
                  <span className="nav-tooltip">
                    {n.label}
                    {n.badge ? <span className="nav-tooltip-badge">{n.badge}</span> : null}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="agent-profile" style={{ cursor: 'pointer' }} onClick={() => setPage('profile')} title={`${user.full_name} (${user.role}) · View Profile`}>
            <div className="agent-avatar">{(user.full_name || 'U').slice(0, 2).toUpperCase()}</div>
            {sidebarOpen && (
              <div className="agent-meta">
                <b>{user.full_name}</b>
                <span>{user.employee_id} · {user.role}</span>
              </div>
            )}
          </div>
          {sidebarOpen ? (
            <button className="icon-btn" onClick={handleLogout} title="Sign out">
              <LogOut size={15} />
            </button>
          ) : (
            <button className="side-logout-collapsed" onClick={handleLogout} title="Sign out">
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setPage('overview')}>
              <Activity size={14} color="var(--teal)" />
              <span>INTELLIGENT LOGISTICS OPERATIONS</span>
            </span>
            <span className="crumb-sep">/</span>
            <b>{nav.find(n => n.id === page)?.label || (page === 'tat_dock' || page === 'tat' || page === 'dock' || page === 'delay' ? 'Predictive Delay, TAT & Smart Dock' : page === 'pipeline' ? 'Data Pipeline & Architecture' : page === 'profile' ? 'My Profile' : 'Access Check')}</b>
          </div>

          <div className="top-actions">
            {/* Live Operational Status Telemetry Pill */}
            <div
              className="health-pill"
              onClick={() => setPage('twin3d')}
              title="Click to launch 360° Interactive 3D Facility Digital Twin"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <i style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontWeight: 700, fontSize: '10.5px', letterSpacing: '0.3px' }}>
                LIVE OPERATIONS · NEON DB SYNC
              </span>
              <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', fontSize: '9.5px', fontWeight: 800 }}>
                3D TWIN
              </span>
            </div>

            {/* Quick Inward Vehicle Button */}
            <button
              type="button"
              onClick={() => {
                setTatDockTab('inward')
                setPage('delay')
              }}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: '6px',
                background: page === 'delay' && tatDockTab === 'inward' ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
              }}
              title="Record a new vehicle entry into the facility before agent dispatch"
            >
              <Truck size={13} />
              <span>+ Inward Vehicle</span>
            </button>

            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button className="theme-toggle-btn" onClick={() => setPage('profile')} title="My Profile">
              <UserCircle2 size={17} />
            </button>
          </div>
        </header>

        {!pagePermitted && (
          <AccessDeniedView
            userRole={user.role}
            targetModule={page}
            onReturnHome={() => setPage(ROLE_DEFAULT_PAGE[user.role] || 'overview')}
          />
        )}


        {pagePermitted && page === 'integrations' && (
          <DataSourceIntegrationsView onNavigate={setPage} />
        )}

        {pagePermitted && page === 'twin3d' && (
          <ErrorBoundary title="3D Digital Twin Render Error" onGoHome={() => setPage('overview')}>
            <DigitalTwin3D
              twinData={twinData}
              theme={theme}
              userRole={user?.role || 'MANAGER'}
              onInspectJourney={inspectJourney}
            />
          </ErrorBoundary>
        )}

        {pagePermitted && page === 'architecture' && (
          <div className="content" style={{ padding: 0, minHeight: 'calc(100vh - 52px)', overflowY: 'auto', overflowX: 'hidden' }}>
            <AgentArchitectureView
              authFetch={authFetch}
              onNavigate={(target) => {
                if (target === 'overview') setPage('overview')
                else if (target === 'trigger_flow' || target === 'pipeline_flow') setPage('pipeline_flow')
                else if (target === 'tat') { setTatDockTab('tat'); setPage('tat_dock'); }
                else if (target === 'dock') { setTatDockTab('dock'); setPage('tat_dock'); }
                else setPage(target)
              }}
              onToast={setToast}
              hasPerm={hasPerm}
              userRole={user?.role || 'MANAGER'}
              theme={theme}
            />
          </div>
        )}

        {pagePermitted && page === 'pipeline_flow' && (
          <div className="content">
            <AgentTriggerExecutionFlow
              authFetch={authFetch}
              onTriggerEmailScan={handleTriggerEmailScan}
              triggering={triggeringAlert}
              alertStatus={alertStatus}
              alertReport={currentAlertReport}
              onOpenEmailModal={() => { setAlertModalTab('email_preview'); setAlertModalOpen(true); }}
              onNavigate={(target) => {
                if (target === 'reports') {
                  setReportSubTab('entry_exit');
                  setPage('delay');
                  setTatDockTab('reports');
                } else {
                  setPage(target);
                }
              }}
              onToast={setToast}
              autoRun={autoRunTriggerFlow}
              onAutoRunFinished={() => setAutoRunTriggerFlow(null)}
            />
          </div>
        )}

        {pagePermitted && page === 'users' && (
          <UserManagementView authFetch={authFetch} onToast={setToast} />
        )}

        {pagePermitted && page === 'profile' && (
          <UserProfileView user={user} authFetch={authFetch} onToast={setToast} onLogout={handleLogout} />
        )}

        {/* UNIFIED OPERATIONS CONTROL TOWER (EXECUTIVE + DISPATCH + LOGISTICS) */}
        {pagePermitted && page === 'overview' && (
          <div className="content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  INTELLIGENT LOGISTICS OPERATIONS CONTROL TOWER · UNIFIED COMMAND
                  <span className="live-tag">GWC DATA.AI · NEON LIVE</span>
                </div>
                <h1>Operations Dashboard</h1>
                <p>Unified real-time visibility across Executive KPIs, Outbound Dispatch Floor, Warehouse Staging, and Corridor Fleet Logistics.</p>
              </div>
              <div className="heading-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setAutoRunTriggerFlow(Date.now());
                    setPage('pipeline_flow');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={14} />
                  <span>Run Agent Trigger Flow</span>
                </button>
                <button className="btn-secondary" onClick={() => setPage('twin3d')}><Box size={14} /> Open 3D Twin</button>
              </div>
            </div>

            {/* Focused Operations Filters (Time Window, From/To Date, Plant, Shift, Vehicle Type) */}
            <OverviewFiltersBar
              startDate={overviewStart}
              setStartDate={setOverviewStart}
              endDate={overviewEnd}
              setEndDate={setOverviewEnd}
              plant={overviewPlant}
              setPlant={handleGlobalPlantChange}
              shift={overviewShift}
              setShift={setOverviewShift}
              vehicleType={overviewVehicleType}
              setVehicleType={handleGlobalVehicleTypeChange}
              onReset={handleResetOverviewFilters}
            />

            {/* UNIFIED LOGISTICS OPERATIONS COMMAND DASHBOARD (EXECUTIVE + DISPATCH + LOGISTICS CONSOLIDATED) */}
            <div className="unified-dash-container" style={{ marginTop: '6px' }}>

              {/* Core 4 High-Impact Operational KPI Cards */}
              <div
                className="kpi-grid"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  marginBottom: '8px',
                  gap: '8px',
                }}
              >
                <KpiCard
                  title="Total Fleet Dispatches"
                  value={fmt(k.total_shipments)}
                  icon={Truck}
                  tone="blue"
                  foot={`${fmt(k.delivered)} Delivered (${pct(k.on_time_pct)} on-time) · ${fmt(k.in_transit)} in-transit`}
                  onClick={() => openDrilldown('all_shipments')}
                />
                <KpiCard
                  title="Yard Waiting & Dock Queue"
                  value={`${fmt(dockData?.summary?.waiting_queue_count || dispatchDash?.dock_queue?.waiting_queue || 3)} Vehicles`}
                  icon={Warehouse}
                  tone="amber"
                  foot={`6 Dock Bays active · ${fmt(dockData?.summary?.p1_immediate_count || 1)} P1 Immediate Bay`}
                  onClick={() => openDrilldown('waiting_queue')}
                />
                <KpiCard
                  title="Average Corridor Turnaround"
                  value={`${tatSum.avg_tat_hrs || logisticsDash?.kpis?.avg_tat_hrs || '4.2'} hrs`}
                  icon={Timer}
                  tone="teal"
                  foot={`Target: ${tatSum.avg_planned_hrs || '4.0'} hrs (Variance +${tatSum.avg_delay_variance_hrs || '0.2'} hrs)`}
                  onClick={() => openDrilldown('tat_longest')}
                />
                <KpiCard
                  title="Vehicles at Delay Risk"
                  value={fmt(delaySum.at_risk_total || 2)}
                  icon={AlertTriangle}
                  tone="red"
                  foot={`${fmt(delaySum.CRITICAL || 1)} Critical (>24h) · ${fmt(delaySum.HIGH || 1)} High Exception`}
                  onClick={() => openDrilldown('at_risk')}
                />
              </div>

              {/* Interactive Quick Metrics Ribbon */}
              <div className="metrics-ribbon">
                <div className="ribbon-chip" onClick={() => openDrilldown('fleet_spend')} title="Click for freight spend drilldown">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Total Fleet Spend:</span>
                  <b style={{ color: 'var(--teal, #0d9488)' }}>{money(k.freight_cost_inr)}</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Details →</span>
                </div>
                <div className="ribbon-chip" onClick={() => openDrilldown('utilization')} title="Click for fleet load efficiency">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Avg Load Factor:</span>
                  <b style={{ color: '#0ea5e9' }}>{pct(k.avg_utilization_pct)} Capacity</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Details →</span>
                </div>
                <div className="ribbon-chip" onClick={() => openDrilldown('fulfillment')} title="Click for order fulfillment">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Order Fulfillment:</span>
                  <b style={{ color: '#16a34a' }}>{pct(k.fulfillment_pct)} Completed</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Details →</span>
                </div>
                <div className="ribbon-chip" onClick={() => openDrilldown('in_transit')} title="Click for active corridor vehicles">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Active In-Transit:</span>
                  <b style={{ color: '#6366f1' }}>{fmt(k.in_transit)} Vehicles</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Details →</span>
                </div>
                <div className="ribbon-chip" onClick={() => openDrilldown('pending_pod')} title="Click for pending PODs">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Pending POD Sign-Off:</span>
                  <b style={{ color: '#d97706' }}>{fmt(dispatchDash?.kpis?.pending_pod_count || 3)} Pending</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Details →</span>
                </div>
                <div className="ribbon-chip" onClick={() => { setAlertModalTab('weighbridge'); setAlertModalOpen(true); }} title="Click to view certified weighbridge sequence">
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Weighbridge Scale WB-01:</span>
                  <b style={{ color: '#16a34a' }}>Certified 60T (Online)</b>
                  <span className="kpi-drill-tag" style={{ fontSize: '9px', marginLeft: '4px' }}>Inspect →</span>
                </div>
              </div>

              {/* Visual 1: Live Plant Dock Bays 01-06 Interactive Status Board (Placed on Top of Area Chart) */}
              <div className="panel" style={{ padding: '10px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Warehouse size={15} color="#0ea5e9" />
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                      Live Plant Dock Bays (01–06) Real-Time Board
                    </h3>
                    <span className="live-tag" style={{ fontSize: '9.5px', padding: '1px 6px' }}>● 6 BAYS SYNCHRONIZED</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                      Queue: <b style={{ color: '#f59e0b' }}>{fmt(dockData?.summary?.waiting_queue_count || 3)} vehicles waiting</b>
                    </span>
                    <button
                      type="button"
                      className="clickable"
                      onClick={() => { setTatDockTab('dock'); setPage('tat_dock'); }}
                      style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--teal, #0d9488)', fontWeight: 700, fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      Dock Master →
                    </button>
                  </div>
                </div>

                <div className="dock-bays-grid">
                  {[
                    { bay: 'Bay 01', type: '10-Wheel (32FT)', vType: '32FT_TRUCK', status: 'ACTIVE LOADING', color: '#16a34a', order: 'CO-001248', vehicle: 'TRK-KA-0921', carrier: 'Safexpress', gross: '14.2T', detail: '85% loaded · Tare verified' },
                    { bay: 'Bay 02', type: '6-Wheel (20FT)', vType: '20FT_TRUCK', status: 'TARE VERIFIED', color: '#0ea5e9', order: 'CO-001255', vehicle: 'TRK-TN-3412', carrier: 'VRL Logistics', gross: '6.4T', detail: 'Weighbridge WB-01 cleared' },
                    { bay: 'Bay 03', type: 'Dost Mini', vType: 'VAN', status: 'AVAILABLE', color: '#64748b', order: 'Clear Standby', vehicle: 'Open Bay', carrier: 'Internal Yard', gross: '—', detail: 'Ready for next staging dispatch' },
                    { bay: 'Bay 04', type: '10-Wheel (32FT)', vType: '32FT_TRUCK', status: 'P1 IMMEDIATE', color: '#dc2626', order: 'CO-001261', vehicle: 'TRK-KA-8819', carrier: 'TCI Express', gross: '18.7T', detail: 'High SLA priority order allocation' },
                    { bay: 'Bay 05', type: '14W Multi-Axle (40FT)', vType: '40FT_TRAILER', status: 'READY DISPATCH', color: '#10b981', order: 'CO-001270', vehicle: 'TRK-DL-4109', carrier: 'Blue Dart', gross: '34.2T', detail: 'Gate pass & POD sign-off ready' },
                    { bay: 'Bay 06', type: '6-Wheel (20FT)', vType: '20FT_TRUCK', status: 'STAGING BUFFER', color: '#f59e0b', order: 'CO-001274', vehicle: 'TRK-KA-5501', carrier: 'Safexpress', gross: '8.5T', detail: 'Buffer pallet load staged at FG-WH-01' },
                  ].map((d, i) => {
                    const isSelected = selectedBay?.bay === d.bay
                    const isFleetMatch = overviewVehicleType === 'ALL' || d.vType === overviewVehicleType
                    return (
                      <div
                        key={i}
                        className={`dock-bay-tile ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBay(isSelected ? null : d)}
                        style={{
                          padding: '6px 8px',
                          border: (!isFleetMatch)
                            ? '1px solid var(--border-color, #e2e8f0)'
                            : (overviewVehicleType !== 'ALL'
                                ? '2px solid #8b5cf6'
                                : (isSelected ? '2px solid #0ea5e9' : '1px solid var(--border-color, #e2e8f0)')),
                          opacity: isFleetMatch ? 1 : 0.45,
                          background: (overviewVehicleType !== 'ALL' && isFleetMatch)
                            ? 'rgba(139, 92, 246, 0.08)'
                            : undefined,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <b style={{ fontSize: '11px', color: 'var(--text-primary, #0f172a)' }}>{d.bay}</b>
                            {overviewVehicleType !== 'ALL' && isFleetMatch && (
                              <span style={{ fontSize: '7.5px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: '#8b5cf6', color: '#ffffff' }}>
                                MATCH
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              background: `${d.color}18`,
                              color: d.color,
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <span className="dock-bay-pulse" style={{ background: d.color }} />
                            {d.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: 'var(--text-muted, #64748b)' }}>
                          <span>{d.type}</span>
                          <span style={{ color: 'var(--teal, #0d9488)', fontWeight: 700 }}>{d.gross}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '9px' }}>
                          <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>{d.order}</span>
                          <span style={{ color: 'var(--text-muted, #64748b)' }}>{d.vehicle}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Interactive Selected Bay Mini Telemetry Inspector */}
                {selectedBay && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(13, 148, 136, 0.08) 100%)',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <b>{selectedBay.bay} Telemetry:</b> {selectedBay.vehicle} ({selectedBay.carrier}) · {selectedBay.detail} (Gross: {selectedBay.gross})
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => openDrilldown('all_shipments')}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                      >
                        Details →
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBay(null)}
                        style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* High-Impact Visuals: 2-Column Balanced Grid (Left: Trend Line Chart, Right: SLA Gauges + Plant/Carrier Performance) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: '8px', marginBottom: '8px', alignItems: 'stretch' }}>
                {/* Left Column - Visual 2: Operations Temporal Series Chart */}
                <div className="panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {chartMetricMode === 'trend' ? 'Daily Vehicle Movement & Delay Trend' : 'Corridor Turnaround vs Delay Variance'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>
                        Interactive temporal analysis · Click any data point to drill down
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="legend" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i style={{ width: '7px', height: '7px', borderRadius: '50%', background: chartMetricMode === 'trend' ? '#0ea5e9' : '#0d9488', display: 'inline-block' }} />
                          {chartMetricMode === 'trend' ? 'Dispatches' : 'Avg TAT'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                          {chartMetricMode === 'trend' ? 'Delayed' : 'Delay Variance'}
                        </span>
                      </span>

                      <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-subtle, #f1f5f9)', padding: '2px', borderRadius: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setChartMetricMode('trend')}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: 0,
                            fontSize: '10px',
                            fontWeight: chartMetricMode === 'trend' ? 700 : 500,
                            background: chartMetricMode === 'trend' ? '#ffffff' : 'transparent',
                            color: chartMetricMode === 'trend' ? '#0ea5e9' : 'var(--text-secondary, #475569)',
                            boxShadow: chartMetricMode === 'trend' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Volume
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricMode('tat')}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: 0,
                            fontSize: '10px',
                            fontWeight: chartMetricMode === 'tat' ? 700 : 500,
                            background: chartMetricMode === 'tat' ? '#ffffff' : 'transparent',
                            color: chartMetricMode === 'tat' ? '#0d9488' : 'var(--text-secondary, #475569)',
                            boxShadow: chartMetricMode === 'tat' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Corridor TAT
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '210px' }}>
                    {chartMetricMode === 'trend' ? (
                      <AreaTrendChart
                        title=""
                        subtitle=""
                        data={data?.trend || []}
                        xKey="day"
                        seriesA={{ key: 'shipments', label: 'Dispatches', color: '#0ea5e9' }}
                        seriesB={{ key: 'delayed', label: 'Delayed', color: '#dc2626' }}
                        w={660}
                        h={210}
                        onPointClick={(d) => openDrilldown('day_trend', d.day)}
                      />
                    ) : (
                      <AreaTrendChart
                        title=""
                        subtitle=""
                        data={logisticsDash?.daily_trend?.length ? logisticsDash.daily_trend : (data?.trend || []).map(t => ({ day: t.day, avg_tat_hrs: 4.2, avg_delay_hrs: Number(t.delayed || 0) * 0.8 }))}
                        xKey="day"
                        seriesA={{ key: 'avg_tat_hrs', label: 'Avg TAT', color: '#0d9488' }}
                        seriesB={{ key: 'avg_delay_hrs', label: 'Delay Variance', color: '#dc2626' }}
                        unit=" hrs"
                        w={660}
                        h={210}
                        onPointClick={(d) => openDrilldown('day_trend', d.day)}
                      />
                    )}
                  </div>
                </div>

                {/* Right Column: Visual 3 (Radial Gauges) + Visual 4 (Plants & Top Carriers) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Visual 3: Operational Health Tri-Gauges */}
                  <div className="panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        Operational SLA &amp; Fleet Efficiency Gauges
                      </h3>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>Interactive KPI click drilldown</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', flex: 1, alignItems: 'center' }}>
                      <RadialGauge
                        title="On-Time Delivery"
                        value={k.on_time_pct || 0}
                        subtitle={`${fmt(k.delivered)} completed trips on schedule`}
                        color="#16a34a"
                        onClick={() => openDrilldown('on_time')}
                      />
                      <RadialGauge
                        title="Fleet Load Capacity"
                        value={k.avg_utilization_pct || 0}
                        subtitle="Load factor efficiency across active carriers"
                        color="#0ea5e9"
                        onClick={() => openDrilldown('utilization')}
                      />
                      <RadialGauge
                        title="Order Fulfillment"
                        value={k.fulfillment_pct || 0}
                        subtitle={`${fmt(k.total_shipments)} outbound journeys tracked`}
                        color="#0d9488"
                        onClick={() => openDrilldown('fulfillment')}
                      />
                    </div>
                  </div>

                  {/* Visual 4: Manufacturing Plants & Top Corridor Carriers (Zero Big Tables) */}
                  <div className="panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        Manufacturing Plants &amp; Corridor Carrier Performance
                      </h3>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>Live Facility Staging · Carrier SLA</span>
                    </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                    {/* Plant Operations Snapshot */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid var(--border-color, #e2e8f0)', paddingRight: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                        Plant Scope Readiness {overviewVehicleType !== 'ALL' && <span style={{ color: '#8b5cf6', fontSize: '9.5px', textTransform: 'none' }}>· Filtered</span>}
                      </div>
                      {(() => {
                        const kaPlant = (data?.plant_analysis || []).find(p => p.plant_id === 'IN-KA-01' || p.plant_id === 'KA-01')
                        const kaShipments = kaPlant ? Number(kaPlant.shipments || 0) : 0
                        const kaDelayed = kaPlant ? Number(kaPlant.delayed || 0) : 0
                        const kaSla = kaShipments > 0 ? (100 - (kaDelayed * 100.0 / kaShipments)).toFixed(1) : '100.0'
                        const kaUtil = kaPlant?.utilization_pct || 68.2

                        const tnPlant = (data?.plant_analysis || []).find(p => p.plant_id === 'IN-TN-01' || p.plant_id === 'TN-01')
                        const tnShipments = tnPlant ? Number(tnPlant.shipments || 0) : 0
                        const tnDelayed = tnPlant ? Number(tnPlant.delayed || 0) : 0
                        const tnSla = tnShipments > 0 ? (100 - (tnDelayed * 100.0 / tnShipments)).toFixed(1) : '100.0'
                        const tnUtil = tnPlant?.utilization_pct || 71.0

                        return (
                          <>
                            <div
                              className="clickable"
                              onClick={() => openDrilldown('all_shipments', null, { plant_id: 'IN-KA-01' })}
                              style={{
                                padding: '7px 9px',
                                borderRadius: '7px',
                                background: (overviewPlant === 'KA-01' || overviewPlant === 'IN-KA-01') ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-subtle, #f8fafc)',
                                border: (overviewPlant === 'KA-01' || overviewPlant === 'IN-KA-01') ? '1px solid #0ea5e9' : '1px solid var(--border-color, #e2e8f0)',
                                cursor: 'pointer',
                              }}
                              title="Click to drill down into KA-01 Bengaluru Plant dispatches and warehouse inventory"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                                <span>KA-01 · Bengaluru Plant</span>
                                <span style={{ color: Number(kaSla) >= 90 ? '#16a34a' : '#d97706' }}>{kaSla}% SLA · <span className="kpi-drill-tag">Drilldown →</span></span>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>
                                {kaShipments} Dispatches ({kaDelayed} delayed) · {kaUtil}% Load Factor
                              </div>
                            </div>

                            <div
                              className="clickable"
                              onClick={() => openDrilldown('all_shipments', null, { plant_id: 'IN-TN-01' })}
                              style={{
                                padding: '7px 9px',
                                borderRadius: '7px',
                                background: (overviewPlant === 'TN-01' || overviewPlant === 'IN-TN-01') ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-subtle, #f8fafc)',
                                border: (overviewPlant === 'TN-01' || overviewPlant === 'IN-TN-01') ? '1px solid #0ea5e9' : '1px solid var(--border-color, #e2e8f0)',
                                cursor: 'pointer',
                              }}
                              title="Click to drill down into TN-01 Chennai Complex dispatches and warehouse inventory"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                                <span>TN-01 · Chennai Complex</span>
                                <span style={{ color: Number(tnSla) >= 90 ? '#16a34a' : '#d97706' }}>{tnSla}% SLA · <span className="kpi-drill-tag">Drilldown →</span></span>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>
                                {tnShipments} Dispatches ({tnDelayed} delayed) · {tnUtil}% Load Factor
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    {/* Top Corridor Carriers Snapshot */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                        Carrier Corridor SLAs {overviewVehicleType !== 'ALL' && <span style={{ color: '#8b5cf6', fontSize: '9.5px', textTransform: 'none' }}>· Filtered</span>}
                      </div>
                      <div className="carrier-corridor-grid">
                        {((data?.carriers && data.carriers.length > 0)
                          ? data.carriers.slice(0, 4).map(c => {
                              const delayPct = Number(c.delay_pct || 0)
                              const onTimePct = (100 - delayPct).toFixed(1)
                              const status = delayPct > 30 ? 'WATCH' : delayPct < 15 ? 'FAST' : 'TOP'
                              return {
                                carrier: c.carrier,
                                on_time: `${onTimePct}%`,
                                tat: `${(c.utilization_pct || 80) > 85 ? '4.2' : '4.8'} hrs`,
                                count: `${c.shipments} trips`,
                                status,
                              }
                            })
                          : [
                              { carrier: 'Safexpress', on_time: '94.2%', tat: '4.1 hrs', count: '24 trips', status: 'TOP' },
                              { carrier: 'VRL Logistics', on_time: '89.6%', tat: '4.8 hrs', count: '19 trips', status: 'GOOD' },
                              { carrier: 'TCI Express', on_time: '86.1%', tat: '5.2 hrs', count: '15 trips', status: 'WATCH' },
                              { carrier: 'Blue Dart', on_time: '98.0%', tat: '3.4 hrs', count: '12 trips', status: 'FAST' },
                            ]
                        ).map((c, idx) => (
                          <div
                            key={idx}
                            className="carrier-corridor-tile"
                            onClick={() => openDrilldown('carrier', c.carrier)}
                            title={`Inspect ${c.carrier} corridor performance (${c.count})`}
                          >
                            <div>
                              <b style={{ fontSize: '11px', color: 'var(--text-primary, #0f172a)', display: 'block' }}>{c.carrier}</b>
                              <span style={{ fontSize: '9.5px', color: 'var(--text-muted, #64748b)' }}>{c.count} · {c.tat}</span>
                            </div>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: c.status === 'WATCH' ? '#fee2e2' : '#dcfce7',
                                color: c.status === 'WATCH' ? '#b91c1c' : '#15803d',
                              }}
                            >
                              {c.on_time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Client Presentation Interactive Walkthrough Bar */}
              <div className="presentation-walkthrough-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} color="#f59e0b" />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Client Presentation Demo Walkthrough:</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Click any stage to showcase live autonomous operation to the client</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="walkthrough-step-btn"
                    onClick={() => { setAlertModalTab('weighbridge'); setAlertModalOpen(true); }}
                  >
                    1. Weighbridge Sequence
                  </button>
                  <button
                    type="button"
                    className="walkthrough-step-btn"
                    onClick={() => {
                      setDashSection('DISPATCH');
                      setSelectedBay({ bay: 'Bay 04', type: '10-Wheel (32FT)', status: 'P1 IMMEDIATE', color: '#dc2626', order: 'CO-001261', vehicle: 'TRK-KA-8819', carrier: 'TCI Express', gross: '18.7T', detail: 'High SLA priority order allocation' });
                    }}
                  >
                    2. Bay 04 Urgent Staging
                  </button>
                  <button
                    type="button"
                    className="walkthrough-step-btn"
                    onClick={() => openDrilldown('at_risk')}
                  >
                    3. Predictive Delay Risks
                  </button>
                  <button
                    type="button"
                    className="walkthrough-step-btn"
                    onClick={() => {
                      setAutoRunTriggerFlow(Date.now());
                      setPage('pipeline_flow');
                    }}
                  >
                    4. Agent Trigger Flow &amp; Email
                  </button>
                  <button
                    type="button"
                    className="walkthrough-step-btn"
                    onClick={() => setPage('twin3d')}
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', borderColor: '#38bdf8', color: '#ffffff' }}
                  >
                    <Box size={12} /> 5. 3D Digital Twin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED AUTONOMOUS OPERATIONS AGENTS (VEHICLE INWARD, DELAY, TAT, DOCK & MANAGEMENT REPORTS) */}
        {pagePermitted && (page === 'delay' || page === 'tat_dock' || page === 'tat' || page === 'dock' || page === 'reports' || page === 'vehicle_inward') && (
          <TatSmartDockView
            delayData={delayData}
            delaySum={delaySum}
            delayPlantFilter={delayPlantFilter}
            setDelayPlantFilter={setDelayPlantFilter}
            delayCarrierFilter={delayCarrierFilter}
            setDelayCarrierFilter={setDelayCarrierFilter}
            delayVehicleFilter={delayVehicleFilter}
            setDelayVehicleFilter={setDelayVehicleFilter}
            delayStatusFilter={delayStatusFilter}
            setDelayStatusFilter={setDelayStatusFilter}
            delayRiskFilter={delayRiskFilter}
            setDelayRiskFilter={setDelayRiskFilter}
            delayCheckpointFilter={delayCheckpointFilter}
            setDelayCheckpointFilter={setDelayCheckpointFilter}
            delaySearch={delaySearch}
            setDelaySearch={setDelaySearch}
            delayStart={delayStart}
            setDelayStart={setDelayStart}
            delayEnd={delayEnd}
            setDelayEnd={setDelayEnd}
            tatData={tatData}
            tatSum={tatSum}
            tatPlantFilter={tatPlantFilter}
            setTatPlantFilter={setTatPlantFilter}
            tatCarrierFilter={tatCarrierFilter}
            setTatCarrierFilter={setTatCarrierFilter}
            tatVehicleFilter={tatVehicleFilter}
            setTatVehicleFilter={setTatVehicleFilter}
            tatStart={tatStart}
            setTatStart={setTatStart}
            tatEnd={tatEnd}
            setTatEnd={setTatEnd}
            dockData={dockData}
            dockPriorityFilter={dockPriorityFilter}
            setDockPriorityFilter={setDockPriorityFilter}
            dockApprovalFilter={dockApprovalFilter}
            setDockApprovalFilter={setDockApprovalFilter}
            approvingId={approvingId}
            handleDockDecision={handleDockDecision}
            inspectJourney={inspectJourney}
            openDrilldown={openDrilldown}
            startChat={startChat}
            setPage={setPage}
            hasPerm={hasPerm}
            user={user}
            authFetch={authFetch}
            onToast={setToast}
            reportType={reportType}
            setReportType={setReportType}
            reportSubTab={reportSubTab}
            setReportSubTab={setReportSubTab}
            reportStart={reportStart}
            setReportStart={setReportStart}
            reportEnd={reportEnd}
            setReportEnd={setReportEnd}
            reportPlant={reportPlant}
            setReportPlant={setReportPlant}
            reportVehicleType={reportVehicleType}
            setReportVehicleType={setReportVehicleType}
            reportData={reportData}
            loadingReport={loadingReport}
            loadReport={loadReport}
            triggerExport={triggerExport}
            setAutoRunTriggerFlow={setAutoRunTriggerFlow}
            setArchTab={setArchTab}
            setAlertModalTab={setAlertModalTab}
            setAlertModalOpen={setAlertModalOpen}
            initialTab={page === 'reports' ? 'reports' : (tatDockTab || (page === 'vehicle_inward' ? 'inward' : page === 'delay' ? 'inward' : page === 'dock' ? 'dock' : 'tat'))}
          />
        )}



        {/* AI LOGISTICS ASSISTANT (ROLE-SCOPED) */}
        {pagePermitted && page === 'assistant' && (
          <div className="assistant-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> ROLE-SCOPED DOMO AI ASSISTANT · {user.role}</div>
                <h1>AI Logistics Assistant</h1>
                <p>Authorized database &amp; tool access enforced dynamically from your verified employee permissions.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  SCOPE: {user.plant_id || 'ALL PLANTS'}
                </span>
                <button className="btn-secondary" onClick={startChat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> ＋ New Chat
                </button>
              </div>
            </div>

            <div className="assistant-layout">
              {/* Left Panel: Recent Conversations history inside AI Assistant */}
              <aside className="assistant-sidebar">
                <div className="assistant-sidebar-header">
                  <div className="assistant-sidebar-title">
                    <MessageSquare size={15} />
                    <span>Recent Chats</span>
                  </div>
                  <span className="assistant-sidebar-badge">{conversations.length}</span>
                </div>

                <div style={{ padding: '10px 10px 4px' }}>
                  <button className="assistant-new-chat-btn" onClick={startChat}>
                    <Sparkles size={13} /> ＋ Start New Chat
                  </button>
                </div>

                <div className="assistant-history-list">
                  {conversations.length === 0 ? (
                    <div className="assistant-history-empty">
                      <MessageSquare size={22} style={{ opacity: 0.4, marginBottom: '6px' }} />
                      <p>No chat history yet</p>
                      <span>Ask a question to start an intelligent agent thread</span>
                    </div>
                  ) : (
                    conversations.map(c => {
                      const isActive = conversationId === c.id
                      return (
                        <button
                          key={c.id}
                          className={`assistant-history-item ${isActive ? 'active' : ''}`}
                          onClick={() => openConversation(c.id)}
                          title={c.title}
                        >
                          <MessageSquare size={13} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                          <span className="assistant-history-title">{c.title}</span>
                          {isActive && <span className="assistant-active-indicator" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </aside>

              {/* Right Panel: Chat Stream & Composer */}
              <div className="chat-workspace assistant-workspace-card">
                <div className="chat-stream">
                  {messages.length === 0 && (
                    <div className="sample-questions">
                      <div className="sample-title"><Sparkles size={14} /> Suggested Questions ({user.role})</div>
                      <div className="sample-grid">
                        {suggestedPrompts.map(q => (
                          <button key={q} className="sample-card" onClick={() => send(q)}>
                            <span>{q}</span><ArrowUpRight size={14} style={{ flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`message-row ${m.role}`}>
                      <div className="message-avatar">{m.role === 'assistant' ? <Bot size={17} /> : user.full_name.slice(0, 2).toUpperCase()}</div>
                      <div className="message-body">
                        <div className="message-author">{m.role === 'assistant' ? 'Logistics Agent' : user.full_name}</div>
                        <div className="message-text"><MarkdownView content={m.content} /></div>
                        {m.steps?.length > 0 && (
                          <details className="tool-trace">
                            <summary><Command size={13} /> {m.steps.length} tool {m.steps.length === 1 ? 'call' : 'calls'} executed</summary>
                            {m.steps.map((s, j) => (
                              <div className="trace-step" key={j}><b>Tool: {s.tool}</b><code>{JSON.stringify(s.input)}</code><pre>{s.output}</pre></div>
                            ))}
                          </details>
                        )}
                      </div>
                    </div>
                  ))}

                  {busy && (
                    <div className="message-row assistant">
                      <div className="message-avatar"><Bot size={17} /></div>
                      <div className="message-body"><div className="thinking"><span /><span /><span /> Checking permissions &amp; querying Neon...</div></div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="composer">
                  <div className="composer-box">
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={`Ask within ${user.role} (${user.plant_id}) scope...`} rows={1} />
                    <button className="composer-send" disabled={!prompt.trim() || busy} onClick={() => send()}><Send size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Enterprise Card-Level Interactive Drilldown Drawer */}
      {drillModal && (
        <ErrorBoundary
          title="Metric Drilldown Drawer Error"
          onReset={() => setDrillModal(null)}
          onGoHome={() => setDrillModal(null)}
        >
          <MetricDetailDrawer
            isOpen={true}
            onClose={() => setDrillModal(null)}
            data={drillModal}
            loading={loadingDrill}
            activeFilters={{
              year: overviewYear,
              month: overviewMonth,
              week: overviewWeek,
              day: overviewDay,
              time_shift: overviewShift,
              start_date: overviewStart,
              end_date: overviewEnd,
              plant_id: overviewPlant,
              carrier: overviewCarrier,
              vehicle_type: overviewVehicleType,
              shipment_status: overviewStatus,
            }}
            onFilterChange={(newFilters) => {
              if (!drillModal?.metric) return
              openDrilldown(drillModal.metric, null, newFilters)
            }}
            onInspectVehicle={(vehicleOrShipmentId) => {
              inspectJourney(vehicleOrShipmentId)
            }}
            userRole={user?.role || 'MANAGER'}
            theme={theme}
          />
        </ErrorBoundary>
      )}

      {/* Dedicated Multi-Level Vehicle & Shipment Journey Sheet */}
      {selectedTatId && (
        <ErrorBoundary
          title="Vehicle Journey Sheet Error"
          onReset={() => setSelectedTatId(null)}
          onGoHome={() => setSelectedTatId(null)}
        >
          <VehicleJourneySheet
            isOpen={true}
            onClose={() => setSelectedTatId(null)}
            journeyId={selectedTatId}
            authFetch={authFetch}
            userRole={user?.role || 'MANAGER'}
            theme={theme}
          />
        </ErrorBoundary>
      )}

      {/* Automated Email Trigger & Management Report Modal */}
      {alertModalOpen && (
        <ErrorBoundary
          title="Email Alert Modal Error"
          onReset={() => setAlertModalOpen(false)}
          onGoHome={() => setAlertModalOpen(false)}
        >
          <EmailTriggerModal
            isOpen={true}
            onClose={() => setAlertModalOpen(false)}
            activeTab={alertModalTab}
            setActiveTab={setAlertModalTab}
            alertReport={currentAlertReport}
            alertStatus={alertStatus}
            onTriggerScan={handleTriggerEmailScan}
            triggering={triggeringAlert}
            historyList={alertHistoryList}
            onLoadHistory={handleLoadAlertHistory}
            onSaveConfig={handleSaveAlertConfig}
            onToast={setToast}
            onExport={triggerExport}
          />
        </ErrorBoundary>
      )}

      {/* Floating AI Assistant Launcher Popup (Compact & Small) */}
      {page !== 'assistant' && (
        <div
          className="floating-ai-launcher"
          onClick={startChat}
          title="Click to open Operations AI Assistant"
          role="button"
          tabIndex={0}
        >
          <div className="floating-ai-icon">
            <Sparkles size={12} color="#ffffff" />
            <span className="floating-ai-ping" />
          </div>
          <div className="floating-ai-content">
            <span className="floating-ai-title">Ask Operations AI</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>{toast}</span>
          <button onClick={() => setToast('')} style={{ background: 'transparent', border: 0, color: 'white' }}><X size={14} /></button>
        </div>
      )}
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, tone, foot, onClick, info, className = '' }) {
  return (
    <div className={`kpi-card ${onClick ? 'clickable' : ''} ${className}`} onClick={onClick}>
      <div className="kpi-top">
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {title}
          {info && <MetricInfo {...info} />}
        </span>
        <div className={`kpi-icon ${tone}`}><Icon size={15} /></div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot kpi-drill-hint">
        <span>{foot}</span>
        {onClick && <span className="kpi-drill-tag">Details →</span>}
      </div>
    </div>
  )
}

function StatusBadge({ value, customText }) {
  const v = String(value || '').toLowerCase()
  let cls = 'neutral'
  if (['delivered', 'received', 'confirmed', 'available', 'success', 'approved'].includes(v)) cls = 'good'
  else if (['delayed', 'exception', 'high', 'quality_hold', 'rejected', 'critical'].includes(v)) cls = 'bad'
  else if (['in_transit', 'pending', 'medium', 'partially_shipped', 'pending_approval'].includes(v)) cls = 'warn'
  else if (['open', 'low', 'in_production'].includes(v)) cls = 'info'
  return <span className={`status ${cls}`}>{customText || String(value || '—').replaceAll('_', ' ')}</span>
}

function MarkdownView({ content }) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []
  let tableRows = []
  let inTable = false

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const header = tableRows[0]
      const body = tableRows.slice(1).filter(r => !r.every(c => /^[-:| ]+$/.test(c)))
      elements.push(
        <div className="table-wrap" key={`tbl-${key}`} style={{ margin: '10px 0' }}>
          <table style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <thead><tr>{header.map((col, idx) => <th key={idx}>{col.trim()}</th>)}</tr></thead>
            <tbody>{body.map((row, rIdx) => <tr key={rIdx}>{row.map((col, cIdx) => <td key={cIdx}>{formatInline(col.trim())}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
      tableRows = []
      inTable = false
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true
      tableRows.push(trimmed.slice(1, -1).split('|').map(c => c.trim()))
      return
    } else if (inTable) {
      flushTable(idx)
    }
    if (trimmed.startsWith('### ')) elements.push(<h4 key={idx}>{formatInline(trimmed.slice(4))}</h4>)
    else if (trimmed.startsWith('## ')) elements.push(<h3 key={idx}>{formatInline(trimmed.slice(3))}</h3>)
    else if (trimmed.startsWith('# ')) elements.push(<h3 key={idx}>{formatInline(trimmed.slice(2))}</h3>)
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) elements.push(<li key={idx} style={{ marginLeft: '18px' }}>{formatInline(trimmed.slice(2))}</li>)
    else if (/^\d+\.\s/.test(trimmed)) elements.push(<li key={idx} style={{ marginLeft: '18px' }}>{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</li>)
    else if (trimmed) elements.push(<p key={idx}>{formatInline(trimmed)}</p>)
  })
  if (inTable) flushTable('last')
  return <div className="markdown-content">{elements}</div>
}

function formatInline(text) {
  const parts = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex))
  return parts.length ? parts : text
}
