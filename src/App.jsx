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
      <p>Components coming soon...</p>
    </div>
  )
}
