export default function SelfAssignCard({ config, onChange, flowPhase, onRun }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Self Assign</h2>
      <div className="field-grid">
        <label className="field">
          <span>Formatted ID (User QR)</span>
          <input type="text" placeholder="USR001" value={config.formattedId} onChange={set('formattedId')} disabled={isRunning} />
        </label>

        <label className="field">
          <span>Scheme Certificate</span>
          <input type="text" placeholder="CERT001" value={config.schemeCertificate} onChange={set('schemeCertificate')} disabled={isRunning} />
        </label>
      </div>

      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Self Assign →'}
        </button>
      </div>
    </div>
  )
}
