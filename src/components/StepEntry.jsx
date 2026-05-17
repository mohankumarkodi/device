import { useState } from 'react'

const STATUS_ICON = {
  idle:    '⬜',
  running: '⏳',
  success: '✅',
  error:   '❌',
  skipped: '⏭️',
}

export default function StepEntry({ step }) {
  const [open, setOpen] = useState(false)
  const hasDetail = step.request !== null || step.response !== null

  return (
    <div className={`step-entry step-entry--${step.status}`}>
      <div className="step-header" onClick={() => hasDetail && setOpen(o => !o)}>
        <span className="step-icon">{STATUS_ICON[step.status]}</span>
        <span className="step-label">{step.label}</span>
        {hasDetail && <span className="step-toggle">{open ? '▲' : '▼'}</span>}
      </div>
      {open && hasDetail && (
        <div className="step-detail">
          {step.request && (
            <div className="step-section">
              <div className="step-section-title">Request</div>
              <pre>{JSON.stringify(step.request, null, 2)}</pre>
            </div>
          )}
          {step.response && (
            <div className="step-section">
              <div className="step-section-title">Response</div>
              <pre>{JSON.stringify(step.response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
