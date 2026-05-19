export default function ValidateScanCard({ config, onChange, flowPhase, onRun }) {
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Validate Scan</h2>
      <p className="card-desc">Validates an entity QR scan. Current timestamp is sent automatically.</p>
      <div className="field-row">
        <label className="field-label">Entity QR Code</label>
        <input
          className="field-input"
          type="text"
          value={config.qrCode}
          onChange={e => onChange({ ...config, qrCode: e.target.value })}
          placeholder="entityQr"
          disabled={isRunning}
        />
      </div>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning || !config.qrCode}>
          {isRunning ? 'Running…' : 'Validate →'}
        </button>
      </div>
    </div>
  )
}
