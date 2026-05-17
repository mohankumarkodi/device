export default function HandlerLogoutCard({ flowPhase, onRun }) {
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Handler Logout</h2>
      <p className="card-desc">Logs out the current user from the machine.</p>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Logout →'}
        </button>
      </div>
    </div>
  )
}
