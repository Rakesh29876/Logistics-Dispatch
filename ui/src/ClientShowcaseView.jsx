import { useEffect, useRef, useState } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Award, BarChart3, Bot, Box, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Clock3, Copy, Cpu, Database, Eye, FileCheck2, FileText,
  Filter, HelpCircle, Layers, LayoutDashboard, Mail, Maximize2, Minimize2,
  Pause, Play, Presentation, RotateCcw, Scale, Send, ShieldAlert,
  ShieldCheck, Sparkles, TrendingUp, Truck, Users, Warehouse, Zap
} from 'lucide-react'

const STAGES = [
  {
    id: 'input',
    num: '1',
    badge: 'DATA INTEGRATION',
    title: 'Input Layer',
    subtitle: 'Data Requirements, Source Systems, Tables & APIs',
    question: 'What enterprise data is required and where does it come from?',
    icon: Database,
    color: '#0ea5e9',
    liveMetric: '4 Core Systems Synchronized · 2.1s Gate Ingestion',
    whatWeUse: [
      { name: 'Neon Lakebase PostgreSQL', role: 'Serverless raw transactions & milestone audit store' },
      { name: 'Weighbridge WB-01 (60-Ton)', role: 'Certified digital load cell tare & gross scale' },
      { name: 'SAP S/4HANA & Oracle TMS', role: 'Enterprise purchase orders, delivery notes & contracts' },
      { name: 'RFID FASTag & Optical Lasers', role: 'Automated 2.1s gate identification & axle scan' },
      { name: 'REST Webhooks & Kafka Stream', role: 'Real-time telemetry ingestion pipelines' },
    ],
    navTarget: 'overview',
    navLabel: 'View Operations Dashboard',
    script: "In our Input Layer, we connect directly to your core enterprise applications: SAP ERP for customer sales orders, Manhattan WMS for finished-goods inventory, Oracle TMS for carrier contracts, and Weighbridge scales for vehicle weights. Instead of manual data entry or paper challans, raw logistics data flows directly into Lakebase PostgreSQL in real time. This establishes a clean, unified single source of truth across all manufacturing plants.",
    flowCards: [
      { step: 1, title: 'SAP ERP Sales Orders', sys: 'ERP · SAP S/4HANA', purpose: 'Ingests customer orders, line items, target delivery dates & priority tags.', impact: '100% automated order intake' },
      { step: 2, title: 'WMS Finished Goods', sys: 'WMS · Manhattan Assoc.', purpose: 'Tracks lot availability at FG-WH-01 warehouse & staging bay berths.', impact: 'Zero stock-out dispatch errors' },
      { step: 3, title: 'Weighbridge VMS Scales', sys: 'Scale · Mettler Toledo', purpose: 'Captures WB-01 certified 60-Ton tare & gross weights via laser sensors.', impact: '15-sec automated scale check' },
      { step: 4, title: 'GPS Corridor Telematics', sys: 'TMS · Oracle OTM & IoT', purpose: 'Streams FASTag RFID toll checkpoints & live highway transit coordinates.', impact: 'Minute-by-minute visibility' },
    ],
    clientQuestion: 'How many disconnected software systems does your team currently check just to confirm if an order is ready for dispatch?',
    keyPoints: [
      'Direct integration with SAP, Manhattan WMS, Oracle TMS & industrial weighbridge scales.',
      'Eliminates manual spreadsheet reconciliation, paper delivery challans & double-entry.',
      'Continuous FASTag RFID gate scans log vehicle arrival in under 2 seconds.'
    ],
    roiMetrics: [
      { label: 'Gate Ingestion Time', value: '2.1 Secs', sub: 'Down from 18 mins paper log' },
      { label: 'Data Entry Errors', value: '0%', sub: 'Eliminated manual typing' },
      { label: 'Enterprise Systems', value: 'Unified', sub: 'SAP + WMS + TMS + Scales' },
    ],
    faq: {
      q: 'Does this require changing or replacing our existing SAP ERP or WMS?',
      a: 'No. The agent acts as an intelligent real-time overlay, connecting via standard APIs and read-replicas without modifying your existing ERP.'
    }
  },
  {
    id: 'processing',
    num: '2',
    badge: 'DATA ENGINEERING & RULES',
    title: 'Processing Layer',
    subtitle: 'ETL Pipelines, Transformations, Business Rules & Data Models',
    question: 'How is raw data cleaned, validated, and evaluated against business logic?',
    icon: Cpu,
    color: '#8b5cf6',
    liveMetric: 'Zero-Human Rules Engine · 65% Less Yard Congestion',
    whatWeUse: [
      { name: 'Python & SQL Automated ETL', role: '6-stage data cleansing, null audit & deduplication' },
      { name: 'Shortest Processing Time (SPT)', role: 'Priority algorithm for vehicle yard entry sequencing' },
      { name: 'WMS Bay Allocation Matrix', role: 'Dynamic lot stock matching for Bays 01–06' },
      { name: '48.0h Dwell Security Rules', role: 'Automated anomaly detection for idle trucks' },
      { name: 'Axle Tolerance Interlock', role: 'Cross-checks gross vs permissible axle legal limit' },
    ],
    navTarget: 'delay',
    navLabel: 'Inspect Smart Dock Staging',
    script: "The Processing Layer is the operational brain of the platform. Raw telemetry from gates, loading bays, and scales is continuously cleaned and validated against your company's business rules. If a commercial vehicle is dwelling inside the plant premises for over 48 hours without gate exit, the agent automatically flags this dwell anomaly. It also matches vehicle axle capacity to the exact loading dock equipped for that cargo, eliminating yard gridlocks.",
    flowCards: [
      { step: 1, title: 'Automated Quality Audit', sys: 'Neon SQL Pipeline', purpose: 'Validates timestamp sequences, eliminates duplicate RFID reads & audits missing data.', impact: '100% data integrity verified' },
      { step: 2, title: 'Stuck Dwell Anomaly Engine', sys: 'Business Rules Engine', purpose: 'Detects commercial trucks dwelling abnormally inside plant premises (> 48 hrs).', impact: 'Eliminates lost yard trucks' },
      { step: 3, title: 'Smart Dock Allocation', sys: 'Dynamic Bay Slotting', purpose: 'Matches order product lot, tonnage & forklift capacity to Bays 01-06.', impact: 'Optimal bay throughput' },
      { step: 4, title: 'Highway Overload Lock', sys: 'Axle Tolerance Interlock', purpose: 'Cross-checks gross vs. permissible axle weights before exit barrier lifts.', impact: 'Zero statutory road fines' },
    ],
    clientQuestion: 'How do your yard supervisors currently catch a vehicle that has been stuck or forgotten in your plant for more than two days?',
    keyPoints: [
      'Automated SQL pipelines continuously audit data quality, null fields & sequence validity.',
      'Configurable dwell thresholds automatically identify bottlenecks before carrier detention accumulates.',
      'Dynamic dock slotting balances forklift workload and keeps buffer staging lanes clear.'
    ],
    roiMetrics: [
      { label: 'Yard Congestion', value: '-65%', sub: 'No multi-truck bay collisions' },
      { label: 'Daily Audit Hours', value: '-4.5 Hrs', sub: 'Saved per dispatcher daily' },
      { label: 'Loading Bay Throughput', value: '+32%', sub: 'Pre-allocated loading queues' },
    ],
    faq: {
      q: 'Can dock assignments or dwell rules be configured for different plants?',
      a: 'Yes. Rules, dwell thresholds, and dock allocation parameters are fully customizable per facility (e.g. KA-01 Assembly vs TN-01 Powertrain).'
    }
  },
  {
    id: 'presentation',
    num: '3',
    badge: 'BUSINESS INTELLIGENCE',
    title: 'Presentation Layer',
    subtitle: 'Unified Control Tower, 3D Digital Twin, Reports & Drilldowns',
    question: 'What do plant managers, dispatchers, and C-suite leadership see?',
    icon: LayoutDashboard,
    color: '#10b981',
    liveMetric: '360° Facility Visual Twin · Single Pane of Glass',
    whatWeUse: [
      { name: 'Unified Logistics Control Tower', role: 'Executive fleet KPIs, plant filters & TAT tracking' },
      { name: 'Real-Time Dispatch Telemetry', role: 'Live operations and vehicle sequencing' },
      { name: 'Interactive SVG Analytics', role: 'Dual-series area trends, donut charts & bubble matrix' },
      { name: '1-Click Journey Audit Drawers', role: 'Full shipment history from gate-in to exit' },
      { name: 'Executive Report Generator', role: 'One-click board-ready PDF & Excel exports' },
    ],
    navTarget: 'overview',
    navLabel: 'Open Operations Dashboard',
    script: "Operations teams no longer need to switch between ten disconnected tabs or chase drivers on WhatsApp. The Presentation Layer delivers a single Unified Control Tower covering Executive KPIs, Dispatch Staging, and Corridor TAT. Operations leadership gains complete visibility across all facilities and corridors in real time.",
    flowCards: [
      { step: 1, title: 'Executive Control Tower', sys: 'Unified Dashboard', purpose: 'Live KPIs, delay distributions, carrier scorecards & plant-by-plant filter views.', impact: 'Instant executive oversight' },
      { step: 2, title: 'Real-Time Fleet Telemetry', sys: 'Operations Engine', purpose: 'Live tracking of Assembly, Powertrain, Silos, Utilities & Docks 01-06.', impact: 'Zero yard blind spots' },
      { step: 3, title: 'Click-to-Inspect Telemetry', sys: 'Interactive Drawers', purpose: 'Inspect live shipment payload, weight, and driver credentials.', impact: '5-second status verification' },
      { step: 4, title: 'Executive Management Reports', sys: 'PDF & Excel Generator', purpose: 'One-click executive summaries with carrier rankings & exception root causes.', impact: 'Board-ready documentation' },
    ],
    clientQuestion: 'When leadership asks for a status report on current yard operations, does your team take hours to compile it, or can you pull it up on screen in 5 seconds?',
    keyPoints: [
      'Consolidates Executive KPIs, Dispatch Staging, and Corridor Logistics onto one screen.',
      'Comprehensive facility tracking covers the entire multi-unit manufacturing campus.',
      'One-click Clean View mode for executive boardroom presentations.'
    ],
    roiMetrics: [
      { label: 'Decision Speed', value: '10x Faster', sub: 'Real-time visual command' },
      { label: 'Facility Blind Spots', value: '0%', sub: '360° spatial visibility' },
      { label: 'Report Generation', value: 'Instant', sub: 'One-click executive exports' },
    ],
    faq: {
      q: 'Does the 3D twin require specialized graphics cards or CAD workstations?',
      a: 'No. It runs smoothly on standard web browsers (Chrome, Edge, Safari) on laptops, tablets, and mobile devices using WebGL with zero plugins.'
    }
  },
  {
    id: 'ai',
    num: '4',
    badge: 'AUTONOMOUS DECISION AI',
    title: 'AI Intelligence Layer',
    subtitle: 'Analyse, Predict, Detect, Recommend & Automate',
    question: 'What autonomous decisions and actions does the AI agent take without human prompting?',
    icon: Sparkles,
    color: '#f59e0b',
    liveMetric: '12-24h Delay Forecasting · ₹12.4L/mo Detention Savings',
    whatWeUse: [
      { name: 'Domo AI Predictive Delay Models', role: '12-24h ETA slippage forecasting & bottleneck prevention' },
      { name: 'Continuous Dwell Anomaly Scanner', role: 'Autonomous detection of 25 stuck vehicles inside plant' },
      { name: 'SMTP Autonomous Alert Relay', role: 'Dispatches high-priority executive emails to managers' },
      { name: 'Freight Risk Valuation Engine', role: 'Calculates exact demurrage & SLA breach exposure' },
      { name: 'Conversational AI Assistant', role: 'Natural language plain-English operations queries' },
    ],
    navTarget: 'reports',
    navLabel: 'Trigger Autonomous Email Scan',
    script: "This is not a generic chatbot—it is an autonomous agent that takes real operational actions. Our AI engine uses Domo AI machine learning to predict delivery delays twelve to twenty-four hours in advance, giving you the window to re-route before SLA penalties kick in. Even better, our autonomous daemon monitors vehicle dwell times around the clock: the moment a truck is stuck, it automatically packages an executive briefing with freight value at risk and emails management directly. Problems are solved before they escalate.",
    flowCards: [
      { step: 1, title: 'Domo AI Delay Prediction', sys: 'Predictive ML Engine', purpose: 'Forecasts highway transit bottlenecks 12 to 24 hours in advance with 91.8% accuracy.', impact: 'Proactive re-routing window' },
      { step: 2, title: 'Autonomous Email Triggers', sys: 'Background Daemon', purpose: 'Automatically drafts & dispatches executive alerts for stuck vehicles with freight value.', impact: 'Zero manual monitoring' },
      { step: 3, title: 'Dynamic Staging Priority', sys: 'Optimization Agent', purpose: 'Re-orders loading dock queues based on urgency, customer tier & carrier SLA.', impact: '99.4% on-time dispatch' },
      { step: 4, title: 'Natural Language Querying', sys: 'Intelligent AI Assistant', purpose: 'Allows managers to query yard telemetry, delay risks & carrier SLAs in plain English.', impact: 'Instant conversational BI' },
    ],
    clientQuestion: 'How much did your organization spend in commercial vehicle detention charges or customer SLA breach penalties last quarter?',
    keyPoints: [
      'Predicts delivery delays 12 to 24 hours in advance by analyzing weather, tolls & carrier history.',
      'Autonomous exception daemon dispatches direct executive email briefings for stuck vehicles.',
      'Quantifies exact freight value locked inside idle vehicles, accelerating management sign-offs.'
    ],
    roiMetrics: [
      { label: 'Detention Savings', value: '₹12.4 Lakhs', sub: 'Monthly bottom-line recovery' },
      { label: 'SLA Breach Penalty', value: '-38%', sub: 'Proactive early warning' },
      { label: 'Prediction Accuracy', value: '91.8%', sub: 'Validated ML models' },
    ],
    faq: {
      q: 'Who receives the autonomous email triggers and can the alert rules be customized?',
      a: 'Alerts are dispatched to plant logistics managers, dispatchers, and carrier liaisons. Dwell thresholds and recipient lists are configurable in seconds.'
    }
  }
]

export default function ClientShowcaseView({ authFetch, onNavigate, onStartChat }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true)
  const [simulatedCardIndex, setSimulatedCardIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef(null)

  const currentStage = STAGES[currentSlideIndex]

  // Auto-play timer (12 seconds per slide)
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCurrentSlideIndex(idx => (idx + 1) % STAGES.length)
            setSimulatedCardIndex(0)
            return 0
          }
          return prev + 1
        })
      }, 120)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const nextSlide = () => {
    setProgress(0)
    setCurrentSlideIndex(i => (i + 1) % STAGES.length)
    setSimulatedCardIndex(0)
  }

  const prevSlide = () => {
    setProgress(0)
    setCurrentSlideIndex(i => (i - 1 + STAGES.length) % STAGES.length)
    setSimulatedCardIndex(0)
  }

  const handleCopyScript = () => {
    if (!currentStage?.script) return
    navigator.clipboard.writeText(currentStage.script).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {})
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Keyboard navigation for presentation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextSlide()
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying(p => !p)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      ref={containerRef}
      className="client-showcase-container"
      style={{
        padding: isFullscreen ? '28px 36px' : '16px 20px 36px',
        background: 'var(--bg-main, #f8fafc)',
        minHeight: '100vh',
        color: 'var(--text-primary, #0f172a)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* ===================== TOP CLIENT PRESENTATION CONTROL BAR ===================== */}
      <div
        className="presentation-control-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Layers size={17} />
            <span style={{ fontWeight: 800, fontSize: '11.5px', letterSpacing: '0.04em' }}>
              SOLUTION FLOW
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                Intelligent Logistics Solution Flow — What The End-to-End System Does
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ● LIVE NEON POSTGRESQL CONNECTED
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Understandable Storytelling Walkthrough: Ingestion → Data Quality → Business Rules → Domo AI → Email Triggers → 3D Twin
            </div>
          </div>
        </div>

        {/* Presenter Controls Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Speaker Notes Toggle */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className="btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showSpeakerNotes ? 'rgba(13, 148, 136, 0.12)' : undefined,
              borderColor: showSpeakerNotes ? 'var(--teal)' : undefined,
              color: showSpeakerNotes ? 'var(--teal)' : undefined,
              fontWeight: 600,
            }}
            title="Toggle Presenter Speaker Notes card"
          >
            <Bot size={14} />
            <span>{showSpeakerNotes ? 'Speaker Notes (ON)' : 'Speaker Notes'}</span>
          </button>

          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isPlaying ? 'rgba(2, 132, 199, 0.12)' : undefined,
              borderColor: isPlaying ? 'var(--primary)' : undefined,
              color: isPlaying ? 'var(--primary)' : undefined,
              fontWeight: 600,
            }}
            title="Auto-play slides (12s per layer)"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Auto' : 'Auto Play'}</span>
          </button>

          {/* Prev / Next Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={prevSlide}
              className="btn-secondary"
              style={{ padding: '6px 9px' }}
              title="Previous Layer (Arrow Left)"
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 800, padding: '0 6px', color: 'var(--text-primary)' }}>
              {currentSlideIndex + 1} / {STAGES.length}
            </span>
            <button
              onClick={nextSlide}
              className="btn-secondary"
              style={{ padding: '6px 9px' }}
              title="Next Layer (Arrow Right)"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="icon-btn"
            style={{ padding: '6px' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Auto-play progress bar */}
      {isPlaying && (
        <div style={{ width: '100%', height: '3px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '14px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: currentStage.color,
              transition: 'width 0.12s linear',
            }}
          />
        </div>
      )}

      {/* ===================== THE 4 STAGE / LAYER NAVIGATOR CARDS (HERO 4-LAYER ARCHITECTURE) ===================== */}
      <div
        className="stage-pipeline-navigator"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {STAGES.map((s, idx) => {
          const isActive = currentSlideIndex === idx
          const Icon = s.icon
          return (
            <div
              key={s.id}
              onClick={() => { setCurrentSlideIndex(idx); setProgress(0); setSimulatedCardIndex(0) }}
              className={`stage-card ${isActive ? 'active' : ''}`}
              style={{
                padding: '14px 14px',
                borderRadius: '12px',
                background: isActive ? 'var(--bg-card, #ffffff)' : 'rgba(255, 255, 255, 0.75)',
                border: isActive ? `2px solid ${s.color}` : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                boxShadow: isActive ? `0 6px 18px ${s.color}25` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: `${s.color}15`,
                      color: s.color,
                      letterSpacing: '0.03em',
                    }}
                  >
                    LAYER {s.num} · {s.badge}
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: `${s.color}15`,
                      color: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={15} />
                  </div>
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.35', marginBottom: '10px' }}>
                  {s.subtitle}
                </div>
              </div>

              {/* What We Are Using In This Layer - Clear Technology Stack */}
              <div
                style={{
                  padding: '7px 9px',
                  borderRadius: '7px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  WHAT WE ARE USING:
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: '1.3' }}>
                  {(s.whatWeUse || []).slice(0, 2).map((w) => w.name).join(' · ')}
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                  + {(s.whatWeUse || []).slice(2, 4).map((w) => w.name).join(' · ')}
                </span>
              </div>

              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '10%',
                    width: '80%',
                    height: '3px',
                    background: s.color,
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ===================== ACTIVE LAYER HERO BANNER ===================== */}
      <div
        className="slide-hero-banner"
        style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${currentStage.color}12 0%, rgba(255, 255, 255, 0.95) 100%)`,
          border: `1px solid ${currentStage.color}35`,
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: currentStage.color, color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                LAYER {currentStage.num} OF 4 · {currentStage.badge}
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                ● {currentStage.liveMetric}
              </span>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 3px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {currentStage.num}. {currentStage.title}: {currentStage.subtitle}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>The Core Question:</strong> {currentStage.question}
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => onNavigate?.(currentStage.navTarget)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              padding: '6px 14px',
              fontWeight: 700,
              background: currentStage.color,
              borderColor: currentStage.color,
            }}
            title={`Jump directly into live ${currentStage.navLabel}`}
          >
            <span>{currentStage.navLabel}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* ===================== WHAT WE ARE USING IN THIS LAYER (EXPLICIT TECH STACK) ===================== */}
      <div
        className="panel"
        style={{
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '16px',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={15} color={currentStage.color} />
            <b style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              What We Are Using in Layer {currentStage.num} ({currentStage.title}):
            </b>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: `${currentStage.color}15`, color: currentStage.color }}>
            5 VERIFIED STACK COMPONENTS
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {(currentStage.whatWeUse || []).map((item, wi) => (
            <div
              key={wi}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '11.5px', color: currentStage.color }}>
                  {item.name}
                </b>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                  ACTIVE
                </span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {item.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===================== PRESENTER SPEAKER NOTES (TOGGLEABLE) ===================== */}
      {showSpeakerNotes && (
        <div
          className="panel"
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%)',
            borderLeft: `4px solid ${currentStage.color}`,
            borderTop: '1px solid var(--border-color)',
            borderRight: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={15} color={currentStage.color} />
              <b style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                🎤 Presenter Script — What to Say to the Client at Layer {currentStage.num}:
              </b>
            </div>

            <button
              onClick={handleCopyScript}
              className="btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '10.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: copied ? 'rgba(16, 185, 129, 0.12)' : undefined,
                color: copied ? '#16a34a' : undefined,
              }}
              title="Copy spoken script to clipboard"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>

          <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
            “{currentStage.script}”
          </p>
        </div>
      )}

      {/* ===================== INTERACTIVE 4-STAGE FLOW SIMULATOR (HOW THE FLOW WORKS) ===================== */}
      <div className="panel" style={{ padding: '16px 18px', borderRadius: '12px', marginBottom: '16px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color={currentStage.color} />
              <b style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                Interactive Solution Flow: Trace How Layer {currentStage.num} Operates
              </b>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click each card to inspect how raw data transitions into verified operational intelligence
            </span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7' }}>
            Click card to inspect details →
          </span>
        </div>

        {/* 4 Flow Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {currentStage.flowCards.map((c, i) => {
            const isSel = simulatedCardIndex === i
            return (
              <div
                key={i}
                onClick={() => setSimulatedCardIndex(i)}
                style={{
                  padding: '11px 12px',
                  borderRadius: '9px',
                  border: isSel ? `2px solid ${currentStage.color}` : '1px solid var(--border-color)',
                  background: isSel ? `${currentStage.color}10` : 'var(--bg-subtle, #f8fafc)',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSel ? 'translateY(-2px)' : 'none',
                  boxShadow: isSel ? `0 4px 12px ${currentStage.color}20` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <b style={{ fontSize: '11.5px', color: isSel ? currentStage.color : 'var(--text-primary)' }}>
                    {c.title}
                  </b>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                    LIVE
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{c.sys}</div>
                <div style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 600, marginTop: '4px' }}>
                  ● {c.impact}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Card Deep Dive Box */}
        {currentStage.flowCards[simulatedCardIndex] && (
          <div
            style={{
              padding: '11px 15px',
              borderRadius: '8px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: currentStage.color, textTransform: 'uppercase' }}>
                Operational Step {simulatedCardIndex + 1} Deep Dive:
              </span>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                {currentStage.flowCards[simulatedCardIndex].purpose}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `${currentStage.color}20`, color: currentStage.color }}>
                {currentStage.flowCards[simulatedCardIndex].sys}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===================== IMPORTANT DETAILS FOR THE CLIENT PRESENTATION ===================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '14px', marginBottom: '16px' }}>
        {/* Left: Key Takeaways & Client Question */}
        <div
          className="panel"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* High-Impact Client Question */}
          <div
            style={{
              padding: '11px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 88, 12, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HelpCircle size={12} /> High-Impact Question to Ask the Client:
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.4' }}>
              “{currentStage.clientQuestion}”
            </div>
          </div>

          {/* 3 Core Points to Emphasize */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
              🎯 3 Important Takeaways to Say to the Client:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {currentStage.keyPoints.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle, #f8fafc)',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.35',
                  }}
                >
                  <CheckCircle2 size={13} color={currentStage.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quantifiable ROI Metrics & Objection Handling */}
        <div
          className="panel"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* 3 ROI Metric Tiles */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              📈 Quantifiable Business Impact &amp; ROI:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {currentStage.roiMetrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: currentStage.color }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Objection Handling / FAQ */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
              <span style={{ color: currentStage.color, fontWeight: 800 }}>Q:</span> {currentStage.faq.q}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <span style={{ color: '#10b981', fontWeight: 800 }}>A:</span> {currentStage.faq.a}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== BOTTOM PRESENTATION NAVIGATION FOOTER ===================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <button
          onClick={prevSlide}
          className="btn-secondary"
          disabled={currentSlideIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            padding: '6px 14px',
            opacity: currentSlideIndex === 0 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={15} />
          <span>Previous: {currentSlideIndex > 0 ? STAGES[currentSlideIndex - 1].title : 'Start'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {STAGES.map((s, i) => (
            <div
              key={i}
              onClick={() => { setCurrentSlideIndex(i); setProgress(0); setSimulatedCardIndex(0) }}
              style={{
                width: currentSlideIndex === i ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: currentSlideIndex === i ? s.color : 'var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={`Go to Layer ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            padding: '6px 16px',
            background: currentStage.color,
            borderColor: currentStage.color,
          }}
        >
          <span>Next: {currentSlideIndex < STAGES.length - 1 ? STAGES[currentSlideIndex + 1].title : 'Loop to Layer 1'}</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
