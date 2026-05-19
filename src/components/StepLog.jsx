import StepEntry from './StepEntry.jsx'

export default function StepLog({ steps, onClear }) {
  if (steps.length === 0) return null
  return (
    <div className="card">
      <div className="card-title-row">
        <h2 className="card-title">Step Log</h2>
        <button className="btn btn--secondary btn--sm" onClick={onClear}>Clear</button>
      </div>
      <div className="step-list">
        {steps.map(step => <StepEntry key={step.id} step={step} />)}
      </div>
    </div>
  )
}
