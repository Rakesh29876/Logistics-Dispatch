import { useState } from 'react'

/* 1. Interactive SVG Donut / Ring Chart */
export function DonutChart({ title, subtitle, slices = [], centerValue, centerLabel, onSliceClick, style }) {
  const [hovered, setHovered] = useState(null)
  const total = slices.reduce((acc, s) => acc + Number(s.value || 0), 0) || 1
  const r = 56
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div className="panel-heading" style={{ marginBottom: '12px' }}>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        {onSliceClick && <span className="kpi-drill-tag">Click slice to inspect →</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
          <svg viewBox="0 0 150 150" width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="75" cy="75" r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="18" />
            {slices.map((s, idx) => {
              const val = Number(s.value || 0)
              const len = (val / total) * c
              const dashArray = `${len} ${c - len}`
              const dashOffset = -offset
              offset += len
              const isHov = hovered === idx
              return (
                <circle
                  key={idx}
                  cx="75"
                  cy="75"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isHov ? 22 : 18}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'stroke-width 0.15s' }}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSliceClick?.(s, idx)}
                />
              )
            })}
          </svg>
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center'
            }}
          >
            <b style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {hovered !== null ? Number(slices[hovered].value).toLocaleString('en-IN') : centerValue}
            </b>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', maxWidth: '85px' }}>
              {hovered !== null ? slices[hovered].label : centerLabel}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          {slices.map((s, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSliceClick?.(s, idx)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 9px', borderRadius: '7px', cursor: onSliceClick ? 'pointer' : 'default', fontSize: '11.5px',
                backgroundColor: hovered === idx ? 'var(--bg-subtle)' : 'transparent',
                transition: 'background-color 0.15s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <i style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, display: 'inline-block' }} />
                {s.label}
              </span>
              <b style={{ color: 'var(--text-primary)' }}>
                {Number(s.value || 0).toLocaleString('en-IN')} ({((Number(s.value || 0) / total) * 100).toFixed(1)}%)
              </b>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* 2. Radial Gauge Meter */
export function RadialGauge({ title, value = 0, subtitle, color = '#0d9488', max = 100, suffix = '%', onClick }) {
  const num = Math.max(0, Math.min(max, Number(value || 0)))
  const r = 42
  const halfC = Math.PI * r
  const fillLen = (num / max) * halfC

  return (
    <div
      className={`panel ${onClick ? 'clickable-card' : ''}`}
      style={{
        textAlign: 'center',
        padding: '6px 8px 7px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-subtle, #f8fafc)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>{title}</div>
      <svg viewBox="0 0 120 62" width="118" height="60" style={{ display: 'block', margin: '0 auto' }}>
        <path
          d="M 18 52 A 42 42 0 0 1 102 52"
          fill="none"
          stroke="var(--bg-subtle, #e2e8f0)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 18 52 A 42 42 0 0 1 102 52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fillLen} ${halfC}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="60" y="47" textAnchor="middle" fill="var(--text-primary)" fontSize="15" fontWeight="800">
          {Number(value || 0).toFixed(1)}{suffix}
        </text>
      </svg>
      <div style={{ fontSize: '9.5px', color: 'var(--text-light)', marginTop: '1px', lineHeight: 1.2 }}>{subtitle}</div>
      {onClick && <div className="kpi-drill-tag" style={{ marginTop: '3px', fontSize: '9px' }}>Click to view vehicles →</div>}
    </div>
  )
}

/* 3. Dual-Series SVG Area & Line Trend Chart with Interactive Tooltip & Click Drilldown */
export function AreaTrendChart({
  title,
  subtitle,
  data = [],
  xKey = 'day',
  seriesA = { key: 'shipments', label: 'Primary', color: '#0ea5e9' },
  seriesB = { key: 'delayed', label: 'Secondary', color: '#ef4444' },
  unit = '',
  onPointClick,
  w = 960,
  h = 210,
  style,
  children,
}) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const padL = 36
  const padR = 14
  const padT = h < 150 ? 10 : 16
  const padB = h < 150 ? 20 : 28

  if (!data.length) {
    return (
      <div className={title ? 'panel' : ''} style={style}>
        {title && <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>}
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No trend points available.</div>
      </div>
    )
  }

  const maxVal = Math.max(
    1,
    ...data.map(d => Math.max(Number(d[seriesA.key] || 0), Number(d[seriesB.key] || 0)))
  )
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW

  const ptsA = data.map((d, i) => [padL + i * stepX, padT + innerH - (Number(d[seriesA.key] || 0) / maxVal) * innerH])
  const ptsB = data.map((d, i) => [padL + i * stepX, padT + innerH - (Number(d[seriesB.key] || 0) / maxVal) * innerH])

  const pathA = ptsA.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const areaA = `${pathA} L ${ptsA[ptsA.length - 1][0].toFixed(1)} ${padT + innerH} L ${ptsA[0][0].toFixed(1)} ${padT + innerH} Z`
  const pathB = ptsB.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  const gradId = `grad-${seriesA.key}-${seriesB.key}`.replace(/[^a-zA-Z0-9]/g, '')

  return (
    <div className={title ? 'panel' : ''} style={{ width: '100%', ...style }}>
      {(title || subtitle) && (
        <div className="panel-heading" style={{ marginBottom: '8px' }}>
          <div><h3>{title}</h3><p>{subtitle}</p></div>
          <span className="legend">
            <i style={{ background: seriesA.color }} /> {seriesA.label}
            <i style={{ background: seriesB.color }} /> {seriesB.label}
            {onPointClick && <span className="kpi-drill-tag" style={{ marginLeft: '8px' }}>Click day →</span>}
          </span>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesA.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={seriesA.color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {(h < 150 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map((frac, gi) => {
            const y = padT + innerH * (1 - frac)
            return (
              <g key={gi}>
                <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-light)">
                  {Math.round(maxVal * frac)}
                </text>
              </g>
            )
          })}

          <path d={areaA} fill={`url(#${gradId})`} />
          <path d={pathA} fill="none" stroke={seriesA.color} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={pathB} fill="none" stroke={seriesB.color} strokeWidth="2.2" strokeDasharray="5 3" strokeLinejoin="round" />

          {data.map((d, i) => {
            const stepDiv = w <= 700 ? 5 : 7
            const showLabel = data.length <= 10 || i % Math.ceil(data.length / stepDiv) === 0 || i === data.length - 1
            return (
              <g key={i}>
                {showLabel && (
                  <text x={ptsA[i][0]} y={h - 4} textAnchor="middle" fontSize={h < 150 ? "8" : "8.5"} fill="var(--text-muted)">
                    {d[xKey]}
                  </text>
                )}
                <circle cx={ptsA[i][0]} cy={ptsA[i][1]} r={hoverIdx === i ? 5.5 : 2.8} fill={seriesA.color} />
                <circle cx={ptsB[i][0]} cy={ptsB[i][1]} r={hoverIdx === i ? 5.5 : 2.6} fill={seriesB.color} />
                <rect
                  x={ptsA[i][0] - stepX / 2}
                  y={padT}
                  width={Math.max(12, stepX)}
                  height={innerH}
                  fill="transparent"
                  style={{ cursor: onPointClick ? 'pointer' : 'crosshair' }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => onPointClick?.(d, i)}
                />
              </g>
            )
          })}

          {hoverIdx !== null && (
            <line
              x1={ptsA[hoverIdx][0]}
              x2={ptsA[hoverIdx][0]}
              y1={padT}
              y2={padT + innerH}
              stroke="var(--text-light)"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {hoverIdx !== null && data[hoverIdx] && (
          <div
            style={{
              position: 'absolute', top: '8px', right: '12px', pointerEvents: 'none',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '7px 11px', fontSize: '10.5px', boxShadow: 'var(--shadow-md)'
            }}
          >
            <b style={{ display: 'block', marginBottom: '3px' }}>{data[hoverIdx][xKey]}</b>
            <div style={{ color: seriesA.color }}>{seriesA.label}: <b>{data[hoverIdx][seriesA.key]}{unit}</b></div>
            <div style={{ color: seriesB.color }}>{seriesB.label}: <b>{data[hoverIdx][seriesB.key]}{unit}</b></div>
            {onPointClick && <div style={{ fontSize: '9px', color: 'var(--teal)', marginTop: '3px' }}>Click to inspect dispatches →</div>}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

/* 4. Interactive Carrier / Vehicle Matrix Bubble Chart */
export function CarrierBubbleChart({ title, subtitle, carriers = [], onBubbleClick }) {
  const [hov, setHov] = useState(null)
  const w = 480
  const h = 210
  const padL = 44
  const padB = 30
  const padT = 18
  const padR = 24

  if (!carriers.length) return null

  const maxLoad = Math.max(1, ...carriers.map(c => Number(c.shipments || c.journeys || c.loads || 1)))
  const minDelay = Math.max(0, Math.min(...carriers.map(c => Number(c.delay_pct || 0))) - 3)
  const maxDelay = Math.max(minDelay + 5, ...carriers.map(c => Number(c.delay_pct || 0)) + 3)
  const minUtil = Math.max(0, Math.min(...carriers.map(c => Number(c.utilization_pct || c.avg_utilization_pct || 70))) - 2)
  const maxUtil = Math.max(minUtil + 4, ...carriers.map(c => Number(c.utilization_pct || c.avg_utilization_pct || 80)) + 2)

  const colors = ['#0ea5e9', '#0d9488', '#8b5cf6', '#f97316']

  return (
    <div className="panel">
      <div className="panel-heading" style={{ marginBottom: '6px' }}>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        {onBubbleClick && <span className="kpi-drill-tag">Click carrier →</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1={padL} x2={w - padR} y1={h - padB} y2={h - padB} stroke="var(--border-color)" />
          <line x1={padL} x2={padL} y1={padT} y2={h - padB} stroke="var(--border-color)" />

          <text x={(padL + w - padR) / 2} y={h - 6} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)">
            Avg Vehicle Utilization (%) →
          </text>
          <text
            x="13" y={(padT + h - padB) / 2} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)"
            transform={`rotate(-90 13 ${(padT + h - padB) / 2})`}
          >
            Delay Rate (%) ↑
          </text>

          {carriers.map((c, i) => {
            const util = Number(c.utilization_pct || c.avg_utilization_pct || 75)
            const delay = Number(c.delay_pct || 32)
            const loads = Number(c.shipments || c.journeys || c.loads || 100)
            const cx = padL + ((util - minUtil) / (maxUtil - minUtil)) * (w - padL - padR)
            const cy = h - padB - ((delay - minDelay) / (maxDelay - minDelay)) * (h - padT - padB)
            const rad = 12 + (loads / maxLoad) * 14
            const label = c.carrier || c.vehicle_type
            return (
              <g
                key={label}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHov({ ...c, label })}
                onMouseLeave={() => setHov(null)}
                onClick={() => onBubbleClick?.(c, label)}
              >
                <circle
                  cx={cx} cy={cy} r={hov?.label === label ? rad + 3 : rad}
                  fill={colors[i % colors.length]} fillOpacity="0.28"
                  stroke={colors[i % colors.length]} strokeWidth="2.5"
                />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)">
                  {label}
                </text>
              </g>
            )
          })}
        </svg>

        {hov && (
          <div style={{
            position: 'absolute', top: '6px', right: '10px', pointerEvents: 'none',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '8px', padding: '8px 12px', fontSize: '10.5px', boxShadow: 'var(--shadow-md)'
          }}>
            <b>{hov.label}</b>
            <div>Loads: <b>{hov.shipments || hov.journeys || hov.loads}</b></div>
            <div>Delay Rate: <b>{hov.delay_pct}%</b></div>
            <div>Utilization: <b>{hov.utilization_pct || hov.avg_utilization_pct}%</b></div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

/* 5. Warehouse Stock Stacked Composition Bar */
export function StockCompositionBar({ warehouse }) {
  if (!warehouse) return null
  const onHand = Number(warehouse.on_hand_qty || 0) || 1
  const net = Number(warehouse.net_available_qty || 0)
  const alloc = Number(warehouse.allocated_qty || 0)
  const blocked = Number(warehouse.blocked_qty || 0)
  const hold = Number(warehouse.quality_hold_qty || 0)

  const segs = [
    { label: 'Net Available', val: net, color: '#0d9488' },
    { label: 'Allocated', val: alloc, color: '#0ea5e9' },
    { label: 'Quality Hold', val: hold, color: '#f59e0b' },
    { label: 'Blocked', val: blocked, color: '#ef4444' },
  ]

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', height: '12px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
        {segs.map(s => (
          <div
            key={s.label}
            style={{ width: `${(s.val / onHand) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.val.toLocaleString('en-IN')} units`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
        {segs.map(s => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, display: 'inline-block' }} />
            {s.label}: <b style={{ color: 'var(--text-primary)' }}>{((s.val / onHand) * 100).toFixed(1)}%</b>
          </span>
        ))}
      </div>
    </div>
  )
}
