import React from 'react'
import {
  Building2,
  Calendar,
  Clock,
  Filter,
  RotateCcw,
  Truck,
  Zap,
} from 'lucide-react'

export default function OverviewFiltersBar({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  plant,
  setPlant,
  shift = 'ALL',
  setShift,
  vehicleType,
  setVehicleType,
  onReset,
}) {
  const plants = [
    { id: 'IN-KA-01', name: 'KA-01 · Bengaluru' },
    { id: 'IN-TN-01', name: 'TN-01 · Chennai' },
  ]

  const shifts = [
    { id: 'SHIFT_A', name: 'Shift A (06:00–14:00)' },
    { id: 'SHIFT_B', name: 'Shift B (14:00–22:00)' },
    { id: 'SHIFT_C', name: 'Shift C (22:00–06:00)' },
  ]

  const vehicleTypes = [
    { id: '32FT_TRUCK', label: '10W Heavy (32FT / 25T Container)' },
    { id: '20FT_TRUCK', label: '6W Medium (20FT / 11T Container)' },
    { id: '40FT_TRAILER', label: '14W Multi-Axle (40FT Trailer / 35T)' },
    { id: '16FT_TRUCK', label: '4W Intermediate (16FT / 7T Truck)' },
    { id: 'VAN', label: 'Light Commercial (Dost / Tata Ace 2.5T)' },
  ]

  // Count active non-default filters
  let activeCount = 0
  if (startDate) activeCount++
  if (endDate) activeCount++
  if (plant && plant !== 'ALL') activeCount++
  if (shift && shift !== 'ALL') activeCount++
  if (vehicleType && vehicleType !== 'ALL') activeCount++

  // Time Window presets handler
  const applyPreset = (preset) => {
    onReset()
    if (preset === 'LATEST_DAY') {
      setStartDate('2026-10-28')
      setEndDate('2026-10-28')
    } else if (preset === 'LAST_7_DAYS') {
      setStartDate('2026-10-21')
      setEndDate('2026-10-28')
    } else if (preset === 'LAST_30_DAYS') {
      setStartDate('2026-09-28')
      setEndDate('2026-10-28')
    }
  }

  const isPresetActive = (preset) => {
    if (preset === 'ALL') return activeCount === 0
    if (preset === 'LATEST_DAY') return startDate === '2026-10-28' && endDate === '2026-10-28'
    if (preset === 'LAST_7_DAYS') return startDate === '2026-10-21' && endDate === '2026-10-28'
    if (preset === 'LAST_30_DAYS') return startDate === '2026-09-28' && endDate === '2026-10-28'
    return false
  }

  return (
    <div
      className="panel overview-filters-panel"
      style={{
        padding: '6px 12px',
        marginBottom: '10px',
        borderRadius: '10px',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        background: 'var(--bg-card, #ffffff)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {/* Time Window Quick Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: 'var(--text-muted, #64748b)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginRight: '2px',
          }}
        >
          <Zap size={12} style={{ color: '#0ea5e9' }} /> Window:
        </span>

        {[
          { id: 'ALL', label: 'All' },
          { id: 'LATEST_DAY', label: 'Today (28 Oct)' },
          { id: 'LAST_7_DAYS', label: '7 Days' },
          { id: 'LAST_30_DAYS', label: '30 Days' },
        ].map((pr) => {
          const active = isPresetActive(pr.id)
          return (
            <button
              key={pr.id}
              type="button"
              onClick={() => applyPreset(pr.id)}
              className={active ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '2px 8px',
                fontSize: '10.5px',
                fontWeight: active ? 700 : 500,
                height: '26px',
                borderRadius: '6px',
                lineHeight: '22px',
              }}
            >
              {pr.label}
            </button>
          )
        })}
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-color, #e2e8f0)', margin: '0 2px' }} />

      {/* Inline From & To Dates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          <Calendar size={11} color="#0ea5e9" /> From:
        </span>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => setStartDate(e.target.value)}
          className="filter-select"
          style={{ height: '26px', fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px', width: '115px' }}
        />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>To:</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => setEndDate(e.target.value)}
          className="filter-select"
          style={{ height: '26px', fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px', width: '115px' }}
        />
      </div>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-color, #e2e8f0)', margin: '0 2px' }} />

      {/* Inline Plant Scope */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Building2 size={11} color="#10b981" />
        <select
          value={plant || 'ALL'}
          onChange={(e) => setPlant(e.target.value)}
          className="filter-select"
          style={{ height: '26px', fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px' }}
        >
          <option value="ALL">All Plants (KA-01 / TN-01)</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Inline Shift Wise */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Clock size={11} color="#f59e0b" />
        <select
          value={shift || 'ALL'}
          onChange={(e) => setShift(e.target.value)}
          className="filter-select"
          style={{ height: '26px', fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px' }}
        >
          <option value="ALL">All Shifts (24h)</option>
          {shifts.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Inline Vehicle Type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Truck size={11} color="#8b5cf6" />
        <select
          value={vehicleType || 'ALL'}
          onChange={(e) => setVehicleType(e.target.value)}
          className="filter-select"
          style={{ height: '26px', fontSize: '10.5px', padding: '1px 6px', borderRadius: '6px' }}
        >
          <option value="ALL">All Vehicle Types</option>
          {vehicleTypes.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Right Reset Pill if active */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary"
          style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            fontSize: '10.5px',
            height: '26px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--danger-text, #ef4444)',
          }}
          title="Reset active filters"
        >
          <RotateCcw size={11} /> Reset ({activeCount})
        </button>
      )}
    </div>
  )
}
