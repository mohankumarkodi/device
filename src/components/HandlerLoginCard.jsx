export default function HandlerLoginCard({ config, onChange, flowPhase, onRun }) {
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Handler Login</h2>
      <p className="card-desc">Logs in a handler to the machine using an entity QR code.</p>
      <div className="field-row">
        <label className="field-label">Entity QR Code</label>
        <input
          className="field-input"
          type="text"
          value={config.qrCode}
          onChange={e => onChange({ ...config, qrCode: e.target.value })}
          placeholder="ENTITY_QR"
          disabled={isRunning}
        />
      </div>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning || !config.qrCode}>
          {isRunning ? 'Running…' : 'Login →'}
        </button>
      </div>
    </div>
  )
}
