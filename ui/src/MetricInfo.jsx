import { useState } from 'react'
import { Info } from 'lucide-react'

export default function MetricInfo({ name, formula, source, description }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="metric-info-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(o => !o)
      }}
    >
      <Info size={13} className="metric-info-icon" />
      {open && (
        <div className="metric-tooltip" onClick={(e) => e.stopPropagation()}>
          <b>{name}</b>
          <p>{description}</p>
          <div><span>Formula:</span> <code>{formula}</code></div>
          <div><span>Source:</span> <code>{source}</code></div>
        </div>
      )}
    </span>
  )
}

