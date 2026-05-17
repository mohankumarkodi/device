# IoT Device Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React app that simulates an IoT device calling the DRS collection API, executing a 4-step flow (auth → validate QR → add item → complete order) with a live step log and final summary.

**Architecture:** Single-page React app with no routing. State lives in `App.jsx`. `flowRunner.js` owns all API call logic and reports progress via callbacks. Components are pure presentational — they receive props and emit events.

**Tech Stack:** React 18, Vite 4.x, plain CSS, native `fetch`, vitest 0.34 (Node 16-compatible)

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | deps, scripts, Node engine constraint |
| `vite.config.js` | Vite + vitest config |
| `index.html` | HTML entry point |
| `src/main.jsx` | React DOM mount |
| `src/App.jsx` | Root state, flow orchestration, renders all cards |
| `src/App.css` | Global layout + card styles |
| `src/utils/headers.js` | Builds global headers object from device config |
| `src/api/flowRunner.js` | All API calls; exports `sendOtp`, `runOtpFlow`, `runQrFlow` |
| `src/components/DeviceConfigCard.jsx` | env, displayId, appCode, schemeAdminId, HMAC inputs |
| `src/components/FlowConfigCard.jsx` | auth method, schemeType, mobile/formattedId, OTP input, item fields, Run button |
| `src/components/StepLog.jsx` | Renders list of StepEntry |
| `src/components/StepEntry.jsx` | One step row: status icon + collapsible request/response |
| `src/components/SummaryCard.jsx` | Final token, orderId, price display |
| `src/__tests__/headers.test.js` | Unit tests for headers.js |
| `src/__tests__/flowRunner.test.js` | Unit tests for flowRunner.js (mocked fetch) |

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "iot-device-simulator",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=16"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.5.0",
    "vitest": "^0.34.0",
    "jsdom": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IoT Device Simulator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors. Verify Node version with `node --version` — must be 16.x.

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite prints a local URL (e.g. `http://localhost:5173`). The browser shows a blank page (no errors in console). Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json vite.config.js index.html src/main.jsx
git commit -m "feat: scaffold iot device simulator with vite 4 + react 18"
```

---

## Task 2: Implement `headers.js` (TDD)

**Files:**
- Create: `src/utils/headers.js`
- Create: `src/__tests__/headers.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/headers.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildHeaders } from '../utils/headers.js'

const baseConfig = {
  displayId: 'MCH00001',
  appCode: 'rvm-RVM002',
  hmacSignature: 'abc123',
}

describe('buildHeaders', () => {
  it('includes required global headers without token', () => {
    const headers = buildHeaders(baseConfig)
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['displayId']).toBe('MCH00001')
    expect(headers['appCode']).toBe('rvm-RVM002')
    expect(headers['X-HMAC-Signature']).toBe('abc123')
    expect(headers['Authorization']).toBeUndefined()
  })

  it('includes Authorization header when token is provided', () => {
    const headers = buildHeaders(baseConfig, 'mytoken')
    expect(headers['Authorization']).toBe('Bearer mytoken')
  })

  it('omits Authorization header when token is empty string', () => {
    const headers = buildHeaders(baseConfig, '')
    expect(headers['Authorization']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../utils/headers.js'`

- [ ] **Step 3: Implement `src/utils/headers.js`**

```js
export function buildHeaders(deviceConfig, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'displayId': deviceConfig.displayId,
    'X-HMAC-Signature': deviceConfig.hmacSignature,
    'appCode': deviceConfig.appCode,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm test
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/headers.js src/__tests__/headers.test.js
git commit -m "feat: add headers utility with tests"
```

---

## Task 3: Implement `flowRunner.js` (TDD)

**Files:**
- Create: `src/api/flowRunner.js`
- Create: `src/__tests__/flowRunner.test.js`

### Context

`flowRunner.js` exports three async functions:

- `sendOtp({ deviceConfig, flowConfig, onStepUpdate })` — Step 1.1 only. Throws on failure after marking step as `error`.
- `runOtpFlow({ deviceConfig, flowConfig, onStepUpdate })` — Steps 1.2 → 2 → 3 → 4. Returns `{ token, orderId, price }`. On failure marks remaining steps as `skipped`.
- `runQrFlow({ deviceConfig, flowConfig, onStepUpdate })` — Steps 1 → 2 → 3 → 4. Returns `{ token, orderId, price }`. On failure marks remaining steps as `skipped`.

Each function calls `onStepUpdate({ stepId, status, request, response })` at start (`running`) and end (`success` or `error`) of each step.

`response` shape: `{ status: <HTTP status>, data: <parsed JSON or null> }`
`request` shape: `{ url, headers, body: <object or null> }`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/flowRunner.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendOtp, runOtpFlow, runQrFlow } from '../api/flowRunner.js'

const deviceConfig = {
  environment: 'https://dev.api.drs.recykal.com',
  displayId: 'MCH00001',
  appCode: 'rvm-RVM002',
  hmacSignature: 'sig',
  schemeAdminId: '42',
}

const flowConfig = {
  schemeType: 'BRAND',
  mobile: '9876543210',
  otpCode: '123456',
  formattedId: 'USR001',
  itemQrCode: 'QR-ABC',
  aiDetectionType: 'PLASTIC',
  itemUrl: 'https://s3.example.com/item.jpg',
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
})

// --- sendOtp ---

describe('sendOtp', () => {
  it('calls send-otp endpoint and marks step success', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ statusCode: 200 }),
    })

    const updates = []
    await sendOtp({ deviceConfig, flowConfig, onStepUpdate: (u) => updates.push(u) })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://dev.api.drs.recykal.com/services/stakeholder/api/send-otp',
      expect.objectContaining({ method: 'POST' })
    )
    expect(updates[0]).toMatchObject({ stepId: 'send-otp', status: 'running' })
    expect(updates[1]).toMatchObject({ stepId: 'send-otp', status: 'success' })
  })

  it('marks step as error and throws when fetch fails', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'bad request' }),
    })

    const updates = []
    await expect(
      sendOtp({ deviceConfig, flowConfig, onStepUpdate: (u) => updates.push(u) })
    ).rejects.toThrow()

    expect(updates[1]).toMatchObject({ stepId: 'send-otp', status: 'error' })
  })
})

// --- runOtpFlow ---

describe('runOtpFlow', () => {
  it('runs steps 1.2 → 2 → 3 → 4 and returns token, orderId, price', async () => {
    // verify-otp → { id_token }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ id_token: 'tok123' }),
    })
    // validate-qr → { status: 'VALID' }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ status: 'VALID' }),
    })
    // add-item → { order: { id: 99, price: 5.0 } }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ order: { id: 99, price: 5.0 } }),
    })
    // complete-order → 200
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({}),
    })

    const updates = []
    const result = await runOtpFlow({
      deviceConfig, flowConfig,
      onStepUpdate: (u) => updates.push(u),
    })

    expect(result).toEqual({ token: 'tok123', orderId: 99, price: 5.0 })
    const stepIds = updates.map((u) => u.stepId)
    expect(stepIds).toContain('verify-otp')
    expect(stepIds).toContain('validate-qr')
    expect(stepIds).toContain('add-item')
    expect(stepIds).toContain('complete-order')
  })

  it('marks remaining steps as skipped when verify-otp fails', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 401,
      json: async () => ({ message: 'invalid otp' }),
    })

    const updates = []
    await expect(
      runOtpFlow({ deviceConfig, flowConfig, onStepUpdate: (u) => updates.push(u) })
    ).rejects.toThrow()

    const skipped = updates.filter((u) => u.status === 'skipped').map((u) => u.stepId)
    expect(skipped).toContain('validate-qr')
    expect(skipped).toContain('add-item')
    expect(skipped).toContain('complete-order')
  })
})

// --- runQrFlow ---

describe('runQrFlow', () => {
  it('runs steps 1 → 2 → 3 → 4 and returns token, orderId, price', async () => {
    // entity-token → { id_token }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ id_token: 'qrtok' }),
    })
    // validate-qr
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ status: 'VALID' }),
    })
    // add-item
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ order: { id: 77, price: 10.0 } }),
    })
    // complete-order
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({}),
    })

    const updates = []
    const result = await runQrFlow({
      deviceConfig, flowConfig,
      onStepUpdate: (u) => updates.push(u),
    })

    expect(result).toEqual({ token: 'qrtok', orderId: 77, price: 10.0 })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../api/flowRunner.js'`

- [ ] **Step 3: Implement `src/api/flowRunner.js`**

```js
import { buildHeaders } from '../utils/headers.js'

async function runStep({ stepId, method, url, headers, body, onStepUpdate }) {
  const request = { url, headers, body: body ?? null }
  onStepUpdate({ stepId, status: 'running', request, response: null })

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    onStepUpdate({ stepId, status: 'error', request, response: { error: err.message } })
    throw err
  }

  let data = null
  try { data = await res.json() } catch { /* empty body */ }

  const response = { status: res.status, data }

  if (!res.ok) {
    onStepUpdate({ stepId, status: 'error', request, response })
    throw new Error(`${stepId} failed: ${res.status}`)
  }

  onStepUpdate({ stepId, status: 'success', request, response })
  return data
}

function skipSteps(stepIds, onStepUpdate) {
  for (const stepId of stepIds) {
    onStepUpdate({ stepId, status: 'skipped', request: null, response: null })
  }
}

export async function sendOtp({ deviceConfig, flowConfig, onStepUpdate }) {
  const url = `${deviceConfig.environment}/services/stakeholder/api/send-otp`
  const headers = {
    ...buildHeaders(deviceConfig),
    schemeType: flowConfig.schemeType,
    schemeAdministratorId: deviceConfig.schemeAdminId,
  }
  await runStep({
    stepId: 'send-otp',
    method: 'POST',
    url,
    headers,
    body: { mobile: flowConfig.mobile },
    onStepUpdate,
  })
}

export async function runOtpFlow({ deviceConfig, flowConfig, onStepUpdate }) {
  const remainingAfterVerify = ['validate-qr', 'add-item', 'complete-order']
  const remainingAfterQr = ['add-item', 'complete-order']
  const remainingAfterAdd = ['complete-order']

  // Step 1.2 — verify OTP
  let verifyData
  try {
    const verifyUrl = `${deviceConfig.environment}/services/stakeholder/api/verify-otp`
    const verifyHeaders = {
      ...buildHeaders(deviceConfig),
      schemeType: flowConfig.schemeType,
      schemeAdministratorId: deviceConfig.schemeAdminId,
    }
    verifyData = await runStep({
      stepId: 'verify-otp',
      method: 'POST',
      url: verifyUrl,
      headers: verifyHeaders,
      body: { mobile: flowConfig.mobile, verificationCode: flowConfig.otpCode },
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(remainingAfterVerify, onStepUpdate)
    throw err
  }

  const token = verifyData?.id_token ?? ''
  return runSharedSteps({ deviceConfig, flowConfig, token, onStepUpdate, remainingAfterQr, remainingAfterAdd })
}

export async function runQrFlow({ deviceConfig, flowConfig, onStepUpdate }) {
  const remainingAfterEntity = ['validate-qr', 'add-item', 'complete-order']
  const remainingAfterQr = ['add-item', 'complete-order']
  const remainingAfterAdd = ['complete-order']

  // Step 1 — entity token
  let entityData
  try {
    const entityUrl = `${deviceConfig.environment}/services/collection/api/public/entity-token?formattedId=${encodeURIComponent(flowConfig.formattedId)}`
    entityData = await runStep({
      stepId: 'entity-token',
      method: 'GET',
      url: entityUrl,
      headers: buildHeaders(deviceConfig),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(remainingAfterEntity, onStepUpdate)
    throw err
  }

  const token = entityData?.id_token ?? ''
  return runSharedSteps({ deviceConfig, flowConfig, token, onStepUpdate, remainingAfterQr, remainingAfterAdd })
}

async function runSharedSteps({ deviceConfig, flowConfig, token, onStepUpdate, remainingAfterQr, remainingAfterAdd }) {
  // Step 2 — validate item QR
  try {
    const qrUrl = `${deviceConfig.environment}/services/qr-service/api/usi-authentication?usiCode=${encodeURIComponent(flowConfig.itemQrCode)}`
    await runStep({
      stepId: 'validate-qr',
      method: 'GET',
      url: qrUrl,
      headers: buildHeaders(deviceConfig, token),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(remainingAfterQr, onStepUpdate)
    throw err
  }

  // Step 3 — add item
  let orderData
  try {
    const addUrl = `${deviceConfig.environment}/services/collection/api/rvm/order-item`
    orderData = await runStep({
      stepId: 'add-item',
      method: 'POST',
      url: addUrl,
      headers: buildHeaders(deviceConfig, token),
      body: {
        qrCode: flowConfig.itemQrCode,
        aiDetectionType: flowConfig.aiDetectionType,
        itemUrl: flowConfig.itemUrl,
      },
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(remainingAfterAdd, onStepUpdate)
    throw err
  }

  const orderId = orderData?.order?.id
  const price = orderData?.order?.price

  // Step 4 — complete order
  await runStep({
    stepId: 'complete-order',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/order/complete/${orderId}`,
    headers: buildHeaders(deviceConfig, token),
    body: undefined,
    onStepUpdate,
  })

  return { token, orderId, price }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: All tests PASS (headers tests + flowRunner tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/flowRunner.js src/__tests__/flowRunner.test.js
git commit -m "feat: add flowRunner with OTP and QR flow orchestration"
```

---

## Task 4: Build `App.jsx` state skeleton

**Files:**
- Create: `src/App.jsx`

- [ ] **Step 1: Create `src/App.jsx` with state and handlers**

```jsx
import { useState, useCallback } from 'react'
import { sendOtp, runOtpFlow, runQrFlow } from './api/flowRunner.js'

const OTP_STEPS = [
  { id: 'send-otp',       label: 'Step 1.1 — Send OTP',       status: 'idle', request: null, response: null },
  { id: 'verify-otp',     label: 'Step 1.2 — Verify OTP',     status: 'idle', request: null, response: null },
  { id: 'validate-qr',    label: 'Step 2 — Validate Item QR', status: 'idle', request: null, response: null },
  { id: 'add-item',       label: 'Step 3 — Add Item',          status: 'idle', request: null, response: null },
  { id: 'complete-order', label: 'Step 4 — Complete Order',    status: 'idle', request: null, response: null },
]

const QR_STEPS = [
  { id: 'entity-token',   label: 'Step 1 — Entity QR Scan',   status: 'idle', request: null, response: null },
  { id: 'validate-qr',    label: 'Step 2 — Validate Item QR', status: 'idle', request: null, response: null },
  { id: 'add-item',       label: 'Step 3 — Add Item',          status: 'idle', request: null, response: null },
  { id: 'complete-order', label: 'Step 4 — Complete Order',    status: 'idle', request: null, response: null },
]

export default function App() {
  const [deviceConfig, setDeviceConfig] = useState({
    environment: 'https://dev.api.drs.recykal.com',
    displayId: '',
    appCode: 'rvm-RVM002',
    schemeAdminId: '',
    hmacSignature: '',
  })

  const [flowConfig, setFlowConfig] = useState({
    authMethod: 'otp',
    schemeType: 'BRAND',
    mobile: '',
    otpCode: '',
    formattedId: '',
    itemQrCode: '',
    aiDetectionType: '',
    itemUrl: '',
  })

  // 'idle' | 'otp-waiting' | 'running' | 'done'
  const [flowPhase, setFlowPhase] = useState('idle')
  const [steps, setSteps] = useState([])
  const [summary, setSummary] = useState(null)

  const handleStepUpdate = useCallback(({ stepId, status, request, response }) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, request, response } : s))
  }, [])

  const handleRunFlow = async () => {
    setSummary(null)
    if (flowConfig.authMethod === 'otp') {
      setSteps(OTP_STEPS.map(s => ({ ...s })))
      setFlowPhase('running')
      try {
        await sendOtp({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setFlowPhase('otp-waiting')
      } catch {
        setFlowPhase('done')
        setSummary({ success: false })
      }
    } else {
      setSteps(QR_STEPS.map(s => ({ ...s })))
      setFlowPhase('running')
      try {
        const result = await runQrFlow({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setSummary({ success: true, ...result })
      } catch {
        setSummary({ success: false })
      }
      setFlowPhase('done')
    }
  }

  const handleSubmitOtp = async () => {
    setFlowPhase('running')
    try {
      const result = await runOtpFlow({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, ...result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  return (
    <div className="app">
      <h1 className="app-title">IoT Device Simulator</h1>
      <p>Device Config and Flow cards go here</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/App.css` (minimal stub)**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #f0f2f5;
  color: #1a1a2e;
}

.app {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 16px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 20px;
}
```

- [ ] **Step 3: Start dev server and verify no errors**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: page renders "IoT Device Simulator" heading. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: add App root with state shape and flow handlers"
```

---

## Task 5: `DeviceConfigCard.jsx`

**Files:**
- Create: `src/components/DeviceConfigCard.jsx`

- [ ] **Step 1: Create the component**

```jsx
const ENVIRONMENTS = [
  { label: 'Development', value: 'https://dev.api.drs.recykal.com' },
  { label: 'Staging',     value: 'https://stage.api.ddrs.recykal.com' },
  { label: 'UAT',         value: 'https://uat-api.ddrs.recykal.com' },
  { label: 'Demo',        value: 'https://demo.api.ddrs.recykal.com' },
  { label: 'Production',  value: 'https://api.ddrs.recykal.com' },
]

const APP_CODES = [
  { label: 'RVM (RVM002)',        value: 'rvm-RVM002' },
  { label: 'Sound Box (SBX006)', value: 'sound_box-SBX006' },
  { label: 'Fast Scan (FCI007)', value: 'fast_scan-FCI007' },
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
          <input
            type="text"
            placeholder="MCH00001"
            value={config.displayId}
            onChange={set('displayId')}
            disabled={disabled}
          />
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
          <input
            type="text"
            placeholder="42"
            value={config.schemeAdminId}
            onChange={set('schemeAdminId')}
            disabled={disabled}
          />
        </label>

        <label className="field field--full">
          <span>X-HMAC-Signature</span>
          <input
            type="text"
            placeholder="Enter HMAC signature"
            value={config.hmacSignature}
            onChange={set('hmacSignature')}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DeviceConfigCard.jsx
git commit -m "feat: add DeviceConfigCard component"
```

---

## Task 6: `FlowConfigCard.jsx`

**Files:**
- Create: `src/components/FlowConfigCard.jsx`

- [ ] **Step 1: Create the component**

```jsx
const SCHEME_TYPES = ['BRAND', 'NON_BRAND']

export default function FlowConfigCard({
  config,
  onChange,
  flowPhase,
  onRunFlow,
  onSubmitOtp,
}) {
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
          <select
            value={config.authMethod}
            onChange={set('authMethod')}
            disabled={isRunning || isOtpWaiting}
          >
            <option value="otp">OTP Flow</option>
            <option value="qr">Entity QR Scan</option>
          </select>
        </label>

        {config.authMethod === 'otp' && (
          <>
            <label className="field">
              <span>Scheme Type</span>
              <select
                value={config.schemeType}
                onChange={set('schemeType')}
                disabled={isRunning || isOtpWaiting}
              >
                {SCHEME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Mobile Number</span>
              <input
                type="text"
                placeholder="9876543210"
                value={config.mobile}
                onChange={set('mobile')}
                disabled={isRunning || isOtpWaiting}
              />
            </label>
          </>
        )}

        {config.authMethod === 'qr' && (
          <label className="field">
            <span>Formatted ID (Entity QR)</span>
            <input
              type="text"
              placeholder="USR001"
              value={config.formattedId}
              onChange={set('formattedId')}
              disabled={isRunning}
            />
          </label>
        )}

        <label className="field">
          <span>Item QR Code</span>
          <input
            type="text"
            placeholder="QR-ABC123"
            value={config.itemQrCode}
            onChange={set('itemQrCode')}
            disabled={isRunning}
          />
        </label>

        <label className="field">
          <span>AI Detection Type</span>
          <input
            type="text"
            placeholder="PLASTIC"
            value={config.aiDetectionType}
            onChange={set('aiDetectionType')}
            disabled={isRunning}
          />
        </label>

        <label className="field field--full">
          <span>Item URL</span>
          <input
            type="text"
            placeholder="https://s3.example.com/item.jpg"
            value={config.itemUrl}
            onChange={set('itemUrl')}
            disabled={isRunning}
          />
        </label>

        {isOtpWaiting && (
          <label className="field">
            <span>Enter OTP</span>
            <input
              type="text"
              placeholder="123456"
              value={config.otpCode}
              onChange={set('otpCode')}
              autoFocus
            />
          </label>
        )}
      </div>

      <div className="button-row">
        {isOtpWaiting ? (
          <button className="btn btn--primary" onClick={onSubmitOtp}>
            Submit OTP →
          </button>
        ) : (
          <button
            className="btn btn--primary"
            onClick={onRunFlow}
            disabled={isRunning || isDone}
          >
            {isRunning ? 'Running…' : '▶ Run Flow'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FlowConfigCard.jsx
git commit -m "feat: add FlowConfigCard with OTP phase handling"
```

---

## Task 7: `StepEntry.jsx` and `StepLog.jsx`

**Files:**
- Create: `src/components/StepEntry.jsx`
- Create: `src/components/StepLog.jsx`

- [ ] **Step 1: Create `src/components/StepEntry.jsx`**

```jsx
import { useState } from 'react'

const STATUS_ICON = {
  idle:    '⬜',
  running: '⏳',
  success: '✅',
  error:   '❌',
  skipped: '⏭️',
}

export default function StepEntry({ step }) {
  const [open, setOpen] = useState(false)
  const hasDetail = step.request !== null || step.response !== null

  return (
    <div className={`step-entry step-entry--${step.status}`}>
      <div className="step-header" onClick={() => hasDetail && setOpen(o => !o)}>
        <span className="step-icon">{STATUS_ICON[step.status]}</span>
        <span className="step-label">{step.label}</span>
        {hasDetail && (
          <span className="step-toggle">{open ? '▲' : '▼'}</span>
        )}
      </div>

      {open && hasDetail && (
        <div className="step-detail">
          {step.request && (
            <div className="step-section">
              <div className="step-section-title">Request</div>
              <pre>{JSON.stringify(step.request, null, 2)}</pre>
            </div>
          )}
          {step.response && (
            <div className="step-section">
              <div className="step-section-title">Response</div>
              <pre>{JSON.stringify(step.response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/StepLog.jsx`**

```jsx
import StepEntry from './StepEntry.jsx'

export default function StepLog({ steps }) {
  if (steps.length === 0) return null

  return (
    <div className="card">
      <h2 className="card-title">Step Log</h2>
      <div className="step-list">
        {steps.map(step => (
          <StepEntry key={step.id} step={step} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StepEntry.jsx src/components/StepLog.jsx
git commit -m "feat: add StepEntry and StepLog components"
```

---

## Task 8: `SummaryCard.jsx`

**Files:**
- Create: `src/components/SummaryCard.jsx`

- [ ] **Step 1: Create the component**

```jsx
export default function SummaryCard({ summary }) {
  if (!summary) return null

  return (
    <div className={`card summary-card summary-card--${summary.success ? 'success' : 'error'}`}>
      <h2 className="card-title">Summary</h2>
      <div className="summary-status">
        {summary.success ? '✅ Flow completed successfully' : '❌ Flow failed'}
      </div>
      {summary.success && (
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Order ID</span>
            <span className="summary-value">{summary.orderId ?? '—'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Price</span>
            <span className="summary-value">
              {summary.price !== undefined ? `₹${summary.price}` : '—'}
            </span>
          </div>
          <div className="summary-item summary-item--full">
            <span className="summary-label">Token</span>
            <span className="summary-value summary-value--token">
              {summary.token ? `${summary.token.slice(0, 40)}…` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SummaryCard.jsx
git commit -m "feat: add SummaryCard component"
```

---

## Task 9: Wire `App.jsx` and complete styling

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

- [ ] **Step 1: Replace `src/App.jsx` with fully wired version**

```jsx
import { useState, useCallback } from 'react'
import { sendOtp, runOtpFlow, runQrFlow } from './api/flowRunner.js'
import DeviceConfigCard from './components/DeviceConfigCard.jsx'
import FlowConfigCard from './components/FlowConfigCard.jsx'
import StepLog from './components/StepLog.jsx'
import SummaryCard from './components/SummaryCard.jsx'

const OTP_STEPS = [
  { id: 'send-otp',       label: 'Step 1.1 — Send OTP',       status: 'idle', request: null, response: null },
  { id: 'verify-otp',     label: 'Step 1.2 — Verify OTP',     status: 'idle', request: null, response: null },
  { id: 'validate-qr',    label: 'Step 2 — Validate Item QR', status: 'idle', request: null, response: null },
  { id: 'add-item',       label: 'Step 3 — Add Item',          status: 'idle', request: null, response: null },
  { id: 'complete-order', label: 'Step 4 — Complete Order',    status: 'idle', request: null, response: null },
]

const QR_STEPS = [
  { id: 'entity-token',   label: 'Step 1 — Entity QR Scan',   status: 'idle', request: null, response: null },
  { id: 'validate-qr',    label: 'Step 2 — Validate Item QR', status: 'idle', request: null, response: null },
  { id: 'add-item',       label: 'Step 3 — Add Item',          status: 'idle', request: null, response: null },
  { id: 'complete-order', label: 'Step 4 — Complete Order',    status: 'idle', request: null, response: null },
]

export default function App() {
  const [deviceConfig, setDeviceConfig] = useState({
    environment: 'https://dev.api.drs.recykal.com',
    displayId: '',
    appCode: 'rvm-RVM002',
    schemeAdminId: '',
    hmacSignature: '',
  })

  const [flowConfig, setFlowConfig] = useState({
    authMethod: 'otp',
    schemeType: 'BRAND',
    mobile: '',
    otpCode: '',
    formattedId: '',
    itemQrCode: '',
    aiDetectionType: '',
    itemUrl: '',
  })

  const [flowPhase, setFlowPhase] = useState('idle')
  const [steps, setSteps] = useState([])
  const [summary, setSummary] = useState(null)

  const handleStepUpdate = useCallback(({ stepId, status, request, response }) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, request, response } : s))
  }, [])

  const handleRunFlow = async () => {
    setSummary(null)
    if (flowConfig.authMethod === 'otp') {
      setSteps(OTP_STEPS.map(s => ({ ...s })))
      setFlowPhase('running')
      try {
        await sendOtp({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setFlowPhase('otp-waiting')
      } catch {
        setFlowPhase('done')
        setSummary({ success: false })
      }
    } else {
      setSteps(QR_STEPS.map(s => ({ ...s })))
      setFlowPhase('running')
      try {
        const result = await runQrFlow({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setSummary({ success: true, ...result })
      } catch {
        setSummary({ success: false })
      }
      setFlowPhase('done')
    }
  }

  const handleSubmitOtp = async () => {
    setFlowPhase('running')
    try {
      const result = await runOtpFlow({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, ...result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  const handleReset = () => {
    setFlowPhase('idle')
    setSteps([])
    setSummary(null)
  }

  const isDeviceDisabled = flowPhase === 'running' || flowPhase === 'otp-waiting'

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">IoT Device Simulator</h1>
        {flowPhase === 'done' && (
          <button className="btn btn--secondary" onClick={handleReset}>Reset</button>
        )}
      </div>

      <DeviceConfigCard
        config={deviceConfig}
        onChange={setDeviceConfig}
        disabled={isDeviceDisabled}
      />

      <FlowConfigCard
        config={flowConfig}
        onChange={setFlowConfig}
        flowPhase={flowPhase}
        onRunFlow={handleRunFlow}
        onSubmitOtp={handleSubmitOtp}
      />

      <StepLog steps={steps} />

      <SummaryCard summary={summary} />
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/App.css` with complete styles**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f0f2f5;
  color: #1a1a2e;
  font-size: 14px;
}

.app {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
}

/* Cards */
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 14px;
  color: #374151;
}

/* Field grid */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field span {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.field--full {
  grid-column: 1 / -1;
}

input, select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  width: 100%;
}

input:focus, select:focus {
  border-color: #6366f1;
}

input:disabled, select:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

/* Buttons */
.button-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 9px 20px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #6366f1;
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn--secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn--secondary:hover {
  background: #d1d5db;
}

/* Step log */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-entry {
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  overflow: hidden;
}

.step-entry--success { border-color: #d1fae5; }
.step-entry--error   { border-color: #fee2e2; }
.step-entry--running { border-color: #e0e7ff; }
.step-entry--skipped { opacity: 0.5; }

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  background: #fafafa;
}

.step-entry--success .step-header { background: #f0fdf4; }
.step-entry--error   .step-header { background: #fff1f2; }
.step-entry--running .step-header { background: #eef2ff; }

.step-icon { font-size: 16px; }

.step-label {
  flex: 1;
  font-weight: 500;
  font-size: 13px;
}

.step-toggle {
  font-size: 11px;
  color: #9ca3af;
}

.step-detail {
  padding: 12px 14px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.step-detail pre {
  font-size: 11px;
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Summary card */
.summary-card--success { border-left: 4px solid #10b981; }
.summary-card--error   { border-left: 4px solid #ef4444; }

.summary-status {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.summary-item--full {
  grid-column: 1 / -1;
}

.summary-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
}

.summary-value--token {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  color: #374151;
}

@media (max-width: 600px) {
  .field-grid, .summary-grid {
    grid-template-columns: 1fr;
  }
  .field--full, .summary-item--full {
    grid-column: 1;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: wire all components and complete styling"
```

---

## Task 10: Run all tests and manual verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS. Output will show tests from `headers.test.js` and `flowRunner.test.js`.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: Vite starts. Open `http://localhost:5173`.

- [ ] **Step 3: Manual verification checklist**

Check each of the following:

1. **Device Config card** renders with correct dropdowns (5 environments, 3 appCode options).
2. **Flow Config — OTP mode**: select "OTP Flow" → fields `schemeType`, `mobile` appear. `formattedId` is hidden.
3. **Flow Config — QR mode**: select "Entity QR Scan" → `formattedId` appears. `schemeType` and `mobile` are hidden.
4. **Run Flow button** is present. Clicking it with empty fields sends the first API call (check network tab — it should show a request to the correct base URL).
5. **OTP mode - two phase**: after clicking Run Flow, step log shows "Send OTP" as running/success, and an OTP input appears in the Flow Config card with a "Submit OTP →" button.
6. **Step log**: each step entry shows the correct icon and is expandable to show request/response JSON.
7. **Summary card** appears after the flow completes or fails.
8. **Reset button** appears after flow ends, clicking it clears the log and summary and re-enables the "Run Flow" button.
9. On mobile width (< 600px), form fields stack to single column.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification complete — iot device simulator ready"
```

---

## Spec Coverage Checklist

| Spec Requirement | Covered By |
|-----------------|------------|
| Environment dropdown (5 options) | Task 5 - DeviceConfigCard |
| displayId, appCode, schemeAdminId, HMAC inputs | Task 5 - DeviceConfigCard |
| Auth method dropdown (OTP / QR) | Task 6 - FlowConfigCard |
| schemeType dropdown (BRAND/NON_BRAND) | Task 6 - FlowConfigCard |
| OTP two-phase interaction | Task 6 - FlowConfigCard + Task 9 - App.jsx |
| Item QR, aiDetectionType, itemUrl inputs | Task 6 - FlowConfigCard |
| Single "Run Flow" button | Task 6 - FlowConfigCard |
| Step-by-step log with status icons | Task 7 - StepLog + StepEntry |
| Collapsible request/response per step | Task 7 - StepEntry |
| step states: idle/running/success/error/skipped | Task 3 - flowRunner.js |
| Skip remaining steps on failure | Task 3 - flowRunner.js |
| Final summary card (orderId, price, token) | Task 8 - SummaryCard |
| Global headers (displayId, HMAC, appCode, Auth) | Task 2 - headers.js |
| All 5 API endpoints correct URLs | Task 3 - flowRunner.js |
| Node 16 / Vite 4 compatibility | Task 1 - package.json |
