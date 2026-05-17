export default function UpdateBagCard({ flowPhase, onRun }) {
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Update Bag Percentage</h2>
      <p className="card-desc">Signals that the bag is 65% filled. No additional input required.</p>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Update Bag →'}
        </button>
      </div>
    </div>
  )
}
