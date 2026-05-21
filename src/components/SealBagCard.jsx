export default function SealBagCard({ config, onChange, flowPhase, onRun }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Seal Bag</h2>
      <div className="field-grid">
        <label className="field">
          <span>Bag Code</span>
          <input type="text" placeholder="BAG001" value={config.bagCode} onChange={set('bagCode')} disabled={isRunning} />
        </label>
      </div>

      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Seal Bag →'}
        </button>
      </div>
    </div>
  )
}
