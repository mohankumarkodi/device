const ENVIRONMENTS = [
  { label: 'Development', value: 'https://dev.api.drs.recykal.com' },
  { label: 'Staging',     value: 'https://stage.api.ddrs.recykal.com' },
  { label: 'UAT',         value: 'https://uat-api.ddrs.recykal.com' },
  { label: 'Demo',        value: 'https://demo.api.ddrs.recykal.com' },
  { label: 'Production',  value: 'https://api.ddrs.recykal.com' },
]

const APP_CODES = [
  { label: 'RVM',       value: 'RVM002' },
  { label: 'Sound Box', value: 'SBX006' },
  { label: 'Fast Scan', value: 'FCI007' },
]

export default function DeviceConfigCard({ config, onChange, disabled }) {
  const set = (field) => (e) => onChange({ ...config, [field]: e.target.value })

  return (
    <div className="card">
      <h2 className="card-title">Device Config</h2>
      <div className="field-grid">
        <label className="field">
          <span>Environment</span>
          <select value={config.environment} onChange={set('environment')} disabled={disabled}>
            {ENVIRONMENTS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Display ID</span>
          <input type="text" placeholder="MCH00001" value={config.displayId} onChange={set('displayId')} disabled={disabled} />
        </label>

        <label className="field">
          <span>App Code</span>
          <select value={config.appCode} onChange={set('appCode')} disabled={disabled}>
            {APP_CODES.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Scheme Admin ID</span>
          <input type="text" placeholder="42" value={config.schemeAdminId} onChange={set('schemeAdminId')} disabled={disabled} />
        </label>

        <label className="field field--full">
          <span>X-HMAC-Signature</span>
          <input type="text" placeholder="Enter HMAC signature" value={config.hmacSignature} onChange={set('hmacSignature')} disabled={disabled} />
        </label>
      </div>
    </div>
  )
}
