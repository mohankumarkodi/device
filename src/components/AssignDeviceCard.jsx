export default function AssignDeviceCard({ config, onChange, flowPhase, onRun }) {
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Assign Device to Center</h2>
      <p className="card-desc">Assigns this device to a center using a QR code.</p>
      <div className="field-row">
        <label className="field-label">QR Code</label>
        <input
          className="field-input"
          type="text"
          value={config.qrCode}
          onChange={e => onChange({ ...config, qrCode: e.target.value })}
          placeholder="COP0A1B2C3D4E"
          disabled={isRunning}
        />
      </div>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning || !config.qrCode}>
          {isRunning ? 'Running…' : 'Assign Device →'}
        </button>
      </div>
    </div>
  )
}
