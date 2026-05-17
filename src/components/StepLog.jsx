import StepEntry from './StepEntry.jsx'

export default function StepLog({ steps }) {
  if (steps.length === 0) return null
  return (
    <div className="card">
      <h2 className="card-title">Step Log</h2>
      <div className="step-list">
        {steps.map(step => <StepEntry key={step.id} step={step} />)}
      </div>
    </div>
  )
}
