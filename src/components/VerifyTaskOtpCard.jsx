export default function VerifyTaskOtpCard({ config, onChange, flowPhase, onRun }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning = flowPhase === 'running'

  return (
    <div className="card">
      <h2 className="card-title">Verify Task OTP</h2>
      <p className="card-desc">Step 2 (Complete Task) only runs if OTP is verified.</p>
      <div className="field-grid">
        <label className="field">
          <span>Task OTP</span>
          <input type="text" placeholder="123456" value={config.taskOtp} onChange={set('taskOtp')} disabled={isRunning} />
        </label>
      </div>

      <div className="button-row">
        <button className="btn btn--primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : '▶ Run Flow'}
        </button>
      </div>
    </div>
  )
}
