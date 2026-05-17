export default function AssignBagCard({ config, onChange, flowPhase, onRun }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Assign Bag to Machine</h2>
      <div className="field-grid">
        <label className="field">
          <span>Bag QR Code</span>
          <input type="text" placeholder="BAG001" value={config.code} onChange={set('code')} disabled={isRunning} />
        </label>

        <label className="field">
          <span>Material Type</span>
          <input type="text" placeholder="mixed" value={config.materialType} onChange={set('materialType')} disabled={isRunning} />
        </label>
      </div>

      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Assign Bag →'}
        </button>
      </div>
    </div>
  )
}
