const SCHEME_TYPES = ['BRAND', 'NON_BRAND']

export default function FlowConfigCard({ config, onChange, flowPhase, onRunFlow, onSubmitOtp }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning = flowPhase === 'running'
  const isOtpWaiting = flowPhase === 'otp-waiting'
  const isDone = flowPhase === 'done'

  return (
    <div className="card">
      <h2 className="card-title">Flow Config</h2>
      <div className="field-grid">
        <label className="field">
          <span>Auth Method</span>
          <select value={config.authMethod} onChange={set('authMethod')} disabled={isRunning || isOtpWaiting}>
            <option value="otp">OTP Flow</option>
            <option value="qr">Entity QR Scan</option>
          </select>
        </label>

        {config.authMethod === 'otp' && (
          <>
            <label className="field">
              <span>Scheme Type</span>
              <select value={config.schemeType} onChange={set('schemeType')} disabled={isRunning || isOtpWaiting}>
                {SCHEME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Mobile Number</span>
              <input type="text" placeholder="9876543210" value={config.mobile} onChange={set('mobile')} disabled={isRunning || isOtpWaiting} />
            </label>
          </>
        )}

        {config.authMethod === 'qr' && (
          <label className="field">
            <span>Formatted ID (Entity QR)</span>
            <input type="text" placeholder="USR001" value={config.formattedId} onChange={set('formattedId')} disabled={isRunning} />
          </label>
        )}

        <label className="field">
          <span>Item QR Code</span>
          <input type="text" placeholder="QR-ABC123" value={config.itemQrCode} onChange={set('itemQrCode')} disabled={isRunning} />
        </label>

        <label className="field">
          <span>AI Detection Type</span>
          <input type="text" placeholder="PLASTIC" value={config.aiDetectionType} onChange={set('aiDetectionType')} disabled={isRunning} />
        </label>

        <label className="field field--full">
          <span>Item URL</span>
          <input type="text" placeholder="https://s3.example.com/item.jpg" value={config.itemUrl} onChange={set('itemUrl')} disabled={isRunning} />
        </label>

        {isOtpWaiting && (
          <label className="field">
            <span>Enter OTP</span>
            <input type="text" placeholder="123456" value={config.otpCode} onChange={set('otpCode')} autoFocus />
          </label>
        )}
      </div>

      <div className="button-row">
        {isOtpWaiting ? (
          <button className="btn btn--primary" onClick={onSubmitOtp}>Submit OTP &rarr;</button>
        ) : (
          <button className="btn btn--primary" onClick={onRunFlow} disabled={isRunning || isDone}>
            {isRunning ? 'Running…' : '▶ Run Flow'}
          </button>
        )}
      </div>
    </div>
  )
}
