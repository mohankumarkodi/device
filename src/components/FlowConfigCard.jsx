const SCHEME_TYPES = ['BRAND', 'NON_BRAND']
const FAST_SCAN_FLOWS = [
  { label: 'Drive-In', value: 'drive-in' },
  { label: 'Counting', value: 'counting' },
]

export default function FlowConfigCard({ config, onChange, flowPhase, appCode, onRunFlow, onVerifyOtp, onAddItem, onCompleteOrder, hasOrderId }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })
  const isRunning     = flowPhase === 'running'
  const isOtpWaiting  = flowPhase === 'otp-waiting'
  const isTokenReady  = flowPhase === 'token-ready'
  const isItemWaiting = flowPhase === 'item-waiting'
  const authLocked    = isRunning || isOtpWaiting || isTokenReady || isItemWaiting
  const isFastScan    = appCode === 'FCI007'
  const isSoundBox    = appCode === 'SBX006'
  const isOtp         = config.authMethod === 'otp'

  // Item fields visible for OTP only after token obtained; for QR always; never for Fast Scan
  const showItemFields = !isFastScan && (isTokenReady || isItemWaiting || (!isOtp && !isOtpWaiting))

  return (
    <div className="card">
      <h2 className="card-title">Flow Config</h2>
      <div className="field-grid">

        {/* ── Fast Scan (FCI007) ───────────────────────────────── */}
        {isFastScan ? (
          <>
            <label className="field">
              <span>Fast Scan Flow</span>
              <select value={config.fastScanFlow} onChange={set('fastScanFlow')} disabled={isRunning}>
                {FAST_SCAN_FLOWS.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Formatted ID (Entity QR)</span>
              <input type="text" placeholder="USR001" value={config.formattedId} onChange={set('formattedId')} disabled={isRunning} />
            </label>

            {config.fastScanFlow === 'counting' && (
              <>
                <label className="field">
                  <span>Bag Code</span>
                  <input type="text" placeholder="BAG001" value={config.bagCode} onChange={set('bagCode')} disabled={isRunning} />
                </label>

                <label className="field">
                  <span>Total Count</span>
                  <input type="number" placeholder="10" value={config.totalCount} onChange={set('totalCount')} disabled={isRunning} />
                </label>
              </>
            )}

            <label className="field field--full">
              <span>QR Codes (comma-separated)</span>
              <input type="text" placeholder="QR1, QR2, QR3" value={config.qrCodes} onChange={set('qrCodes')} disabled={isRunning} />
            </label>

            <label className="field field--full">
              <span>Rejected Details (JSON array)</span>
              <textarea
                rows={3}
                placeholder={'[{"code":"QR4","reason":"damaged"}]'}
                value={config.rejectedDetails}
                onChange={set('rejectedDetails')}
                disabled={isRunning}
              />
            </label>
          </>
        ) : (
          /* ── OTP / QR flows ──────────────────────────────────── */
          <>
            <label className="field">
              <span>Auth Method</span>
              <select value={config.authMethod} onChange={set('authMethod')} disabled={authLocked}>
                <option value="otp">OTP Flow</option>
                <option value="qr">Entity QR Scan</option>
              </select>
            </label>

            {isOtp ? (
              <>
                <label className="field">
                  <span>Scheme Type</span>
                  <select value={config.schemeType} onChange={set('schemeType')} disabled={authLocked}>
                    {SCHEME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>

                <label className="field">
                  <span>Mobile Number</span>
                  <input type="text" placeholder="9876543210" value={config.mobile} onChange={set('mobile')} disabled={authLocked} />
                </label>

                <div className="field field--btn">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={onRunFlow}
                    disabled={isRunning || isItemWaiting || isTokenReady}
                  >
                    Send OTP
                  </button>
                </div>
              </>
            ) : (
              <label className="field">
                <span>Formatted ID (Entity QR)</span>
                <input type="text" placeholder="USR001" value={config.formattedId} onChange={set('formattedId')} disabled={authLocked} />
              </label>
            )}

            {isOtpWaiting && (
              <label className="field">
                <span>Enter OTP</span>
                <input type="text" placeholder="123456" value={config.otpCode} onChange={set('otpCode')} autoFocus />
              </label>
            )}
          </>
        )}

        {/* ── Item fields (RVM / Sound Box, after auth) ────────── */}
        {showItemFields && (
          <>
            <label className="field">
              <span>USI Service</span>
              <select value={config.usiService} onChange={set('usiService')} disabled={isRunning}>
                <option value="qr-service">QR Service</option>
                <option value="collection">Collection</option>
              </select>
            </label>

            <label className="field">
              <span>Item QR Code</span>
              <input type="text" placeholder="QR-ABC123" value={config.itemQrCode} onChange={set('itemQrCode')} disabled={isRunning} />
            </label>

            {!isSoundBox && (
              <>
                <label className="field">
                  <span>AI Detection Type</span>
                  <input type="text" placeholder="PLASTIC" value={config.aiDetectionType} onChange={set('aiDetectionType')} disabled={isRunning} />
                </label>

                <label className="field field--full">
                  <span>Item URL</span>
                  <input type="text" placeholder="https://s3.example.com/item.jpg" value={config.itemUrl} onChange={set('itemUrl')} disabled={isRunning} />
                </label>
              </>
            )}
          </>
        )}

      </div>

      {/* ── Button row ───────────────────────────────────────────── */}
      <div className="button-row">
        {isOtpWaiting && (
          <button className="btn btn--primary" onClick={onVerifyOtp}>Verify OTP &rarr;</button>
        )}
        {(isTokenReady || isItemWaiting) && (
          <button className="btn btn--primary" onClick={onAddItem} disabled={isRunning}>
            + Add Item
          </button>
        )}
        {isItemWaiting && hasOrderId && (
          <button className="btn btn--secondary" onClick={onCompleteOrder} disabled={isRunning}>
            Complete Order &rarr;
          </button>
        )}
        {/* Run Flow: Fast Scan always; QR non-OTP when idle/done */}
        {(isFastScan || (!isOtp && !isOtpWaiting && !isTokenReady && !isItemWaiting)) && (
          <button className="btn btn--primary" onClick={onRunFlow} disabled={isRunning}>
            {isRunning ? 'Running…' : '▶ Run Flow'}
          </button>
        )}
      </div>
    </div>
  )
}
