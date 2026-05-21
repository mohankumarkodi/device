import { useState, useCallback } from 'react'
import {
  sendOtp, verifyOtp, getEntityToken,
  validateAndAddItem, completeOrder,
  runFastScanDriveIn, runFastScanCounting,
  validateScan, handlerLogin, handlerLogout, runVerifyTaskFlow, updateBag, assignBag, selfAssign, assignDevice, sealBag,
} from './api/flowRunner.js'
import DeviceConfigCard from './components/DeviceConfigCard.jsx'
import FlowConfigCard from './components/FlowConfigCard.jsx'
import UpdateBagCard from './components/UpdateBagCard.jsx'
import VerifyTaskOtpCard from './components/VerifyTaskOtpCard.jsx'
import ValidateScanCard from './components/ValidateScanCard.jsx'
import HandlerLoginCard from './components/HandlerLoginCard.jsx'
import HandlerLogoutCard from './components/HandlerLogoutCard.jsx'
import AssignBagCard from './components/AssignBagCard.jsx'
import SelfAssignCard from './components/SelfAssignCard.jsx'
import AssignDeviceCard from './components/AssignDeviceCard.jsx'
import SealBagCard from './components/SealBagCard.jsx'
import StepLog from './components/StepLog.jsx'
import SummaryCard from './components/SummaryCard.jsx'

const FLOW_MODES = [
  { id: 'device',           label: 'Device Flow'    },
  { id: 'assign-bag',       label: 'Assign Bag'     },
  { id: 'update-bag',       label: 'Update Bag %'   },
  { id: 'verify-task-otp',  label: 'Verify Task OTP'},
  { id: 'validate-scan',    label: 'Validate Scan'  },
  { id: 'handler-login',    label: 'Login'          },
  { id: 'handler-logout',   label: 'Logout'         },
  { id: 'self-assign',      label: 'Self Assign'    },
  { id: 'assign-device',   label: 'Assign Device'  },
  { id: 'seal-bag',        label: 'Seal Bag'       },
]

export default function App() {
  const [flowMode, setFlowMode] = useState('device')

  const [deviceConfig, setDeviceConfig] = useState({
    environment: 'https://dev.api.drs.recykal.com',
    displayId: '',
    appCode: 'RVM002',
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
    fastScanFlow: 'drive-in',
    qrCodes: '',
    bagCode: '',
    totalCount: '',
    rejectedDetails: '',
  })

  const [verifyTaskConfig, setVerifyTaskConfig] = useState({ taskOtp: '' })

  const [assignBagConfig, setAssignBagConfig] = useState({
    code: '',
    materialType: '',
  })

  const [validateScanConfig, setValidateScanConfig] = useState({ qrCode: '' })
  const [handlerLoginConfig, setHandlerLoginConfig] = useState({ qrCode: '' })

  const [assignDeviceConfig, setAssignDeviceConfig] = useState({ qrCode: '' })
  const [sealBagConfig, setSealBagConfig] = useState({ bagCode: '' })

  const [selfAssignConfig, setSelfAssignConfig] = useState({
    formattedId: '',
    schemeCertificate: '',
  })

  const [flowPhase, setFlowPhase] = useState('idle')
  // 'idle' | 'running' | 'otp-waiting' | 'token-ready' | 'item-waiting' | 'done'
  const [steps, setSteps] = useState([])
  const [summary, setSummary] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [firstOrderId, setFirstOrderId] = useState(null)
  const [currentOrderId, setCurrentOrderId] = useState(null)
  const [itemIndex, setItemIndex] = useState(0)

  const handleStepUpdate = useCallback(({ stepId, status, request, response }) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, request, response } : s))
  }, [])

  const switchMode = (mode) => {
    setFlowMode(mode)
    setFlowPhase('idle')
    setSteps([])
    setSummary(null)
    setAuthToken(null)
    setFirstOrderId(null)
    setCurrentOrderId(null)
    setItemIndex(0)
  }

  // ── Validate Scan ──────────────────────────────────────────────────
  const handleValidateScan = async () => {
    setSummary(null)
    setSteps([
      { id: 'validate-scan', label: 'Validate Scan', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await validateScan({ deviceConfig, validateScanConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Handler Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    setSummary(null)
    setSteps([
      { id: 'handler-login', label: 'Handler Login', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await handlerLogin({ deviceConfig, handlerLoginConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Handler Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    setSummary(null)
    setSteps([
      { id: 'handler-logout', label: 'Handler Logout', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await handlerLogout({ deviceConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Verify Task OTP ────────────────────────────────────────────────
  const handleVerifyTaskOtp = async () => {
    setSummary(null)
    setSteps([
      { id: 'verify-task-otp', label: 'Step 1 — Verify Task OTP', status: 'idle', request: null, response: null },
      { id: 'complete-task',   label: 'Step 2 — Complete Task',   status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await runVerifyTaskFlow({ deviceConfig, verifyTaskConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Update Bag ─────────────────────────────────────────────────────
  const handleUpdateBag = async () => {
    setSummary(null)
    setSteps([
      { id: 'update-bag', label: 'Update Bag Percentage', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await updateBag({ deviceConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Assign Bag ─────────────────────────────────────────────────────
  const handleAssignBag = async () => {
    setSummary(null)
    setSteps([
      { id: 'assign-bag', label: 'Assign Bag to Machine', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await assignBag({ deviceConfig, assignBagConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Self Assign ────────────────────────────────────────────────────
  const handleSelfAssign = async () => {
    setSummary(null)
    setSteps([
      { id: 'self-assign', label: 'Self Assign Machine', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await selfAssign({ deviceConfig, selfAssignConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Assign Device ──────────────────────────────────────────────────
  const handleAssignDevice = async () => {
    setSummary(null)
    setSteps([
      { id: 'assign-device', label: 'Assign Device to Center', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await assignDevice({ deviceConfig, assignDeviceConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Seal Bag ───────────────────────────────────────────────────────
  const handleSealBag = async () => {
    setSummary(null)
    setSteps([
      { id: 'seal-bag', label: 'Seal Bag', status: 'idle', request: null, response: null },
    ])
    setFlowPhase('running')
    try {
      const result = await sealBag({ deviceConfig, sealBagConfig, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, responseData: result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  // ── Device flows ───────────────────────────────────────────────────
  const appendItemSteps = (idx) => {
    setSteps(prev => [...prev,
      { id: `validate-qr-${idx}`, label: 'Validate Item QR', status: 'idle', request: null, response: null },
      { id: `add-item-${idx}`,    label: 'Add Item',          status: 'idle', request: null, response: null },
    ])
  }

  const runFirstItem = async (token) => {
    appendItemSteps(0)
    try {
      const orderId = await validateAndAddItem({ deviceConfig, flowConfig, token, itemIndex: 0, firstOrderId: null, onStepUpdate: handleStepUpdate })
      setFirstOrderId(orderId)
      setCurrentOrderId(orderId)
    } catch { /* item failed — keep token, stay in item-waiting so user can retry */ }
    setItemIndex(1)
    setFlowPhase('item-waiting')
  }

  const handleRunFlow = async () => {
    setSummary(null)
    setAuthToken(null)
    setFirstOrderId(null)
    setCurrentOrderId(null)
    setItemIndex(0)

    // ── Fast Scan (FCI007) ─────────────────────────────────────────
    if (deviceConfig.appCode === 'FCI007') {
      const isDriveIn = flowConfig.fastScanFlow === 'drive-in'
      setSteps(isDriveIn
        ? [
            { id: 'entity-token', label: 'Step 1 — Entity QR Scan', status: 'idle', request: null, response: null },
            { id: 'drive-in',     label: 'Step 2 — Drive-In',        status: 'idle', request: null, response: null },
          ]
        : [
            { id: 'entity-token',     label: 'Step 1 — Entity QR Scan',   status: 'idle', request: null, response: null },
            { id: 'counting-started', label: 'Step 2 — Counting Started', status: 'idle', request: null, response: null },
            { id: 'counting-ended',   label: 'Step 3 — Counting Ended',   status: 'idle', request: null, response: null },
          ]
      )
      setFlowPhase('running')
      try {
        const result = isDriveIn
          ? await runFastScanDriveIn({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
          : await runFastScanCounting({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setSummary({ success: true, responseData: result ?? null })
      } catch {
        setSummary({ success: false })
      }
      setFlowPhase('done')
      return
    }

    // ── OTP / QR flows (RVM, Sound Box) ───────────────────────────
    if (flowConfig.authMethod === 'otp') {
      setSteps([
        { id: 'send-otp',   label: 'Step 1.1 — Send OTP',   status: 'idle', request: null, response: null },
        { id: 'verify-otp', label: 'Step 1.2 — Verify OTP', status: 'idle', request: null, response: null },
      ])
      setFlowPhase('running')
      try {
        await sendOtp({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setFlowPhase('otp-waiting')
      } catch {
        setFlowPhase('done')
        setSummary({ success: false })
      }
    } else {
      setSteps([
        { id: 'entity-token', label: 'Step 1 — Entity QR Scan', status: 'idle', request: null, response: null },
      ])
      setFlowPhase('running')
      try {
        const token = await getEntityToken({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
        setAuthToken(token)
        await runFirstItem(token)
      } catch {
        setFlowPhase('done')
        setSummary({ success: false })
      }
    }
  }

  const handleVerifyOtp = async () => {
    setFlowPhase('running')
    try {
      const token = await verifyOtp({ deviceConfig, flowConfig, onStepUpdate: handleStepUpdate })
      setAuthToken(token)
      setFlowPhase('token-ready')
    } catch {
      setSummary({ success: false })
      setFlowPhase('done')
    }
  }

  const handleAddItem = async () => {
    const idx = itemIndex
    setItemIndex(idx + 1)
    setFlowPhase('running')
    appendItemSteps(idx)
    try {
      const orderId = await validateAndAddItem({ deviceConfig, flowConfig, token: authToken, itemIndex: idx, firstOrderId, onStepUpdate: handleStepUpdate })
      if (firstOrderId == null) setFirstOrderId(orderId)
      setCurrentOrderId(orderId)
    } catch { /* stay in item-waiting */ }
    setFlowPhase('item-waiting')
  }

  const handleCompleteOrder = async () => {
    const orderIdToComplete = firstOrderId ?? currentOrderId
    setFlowPhase('running')
    setSteps(prev => [...prev,
      { id: 'complete-order', label: 'Complete Order', status: 'idle', request: null, response: null },
    ])
    try {
      const result = await completeOrder({ deviceConfig, token: authToken, orderId: orderIdToComplete, onStepUpdate: handleStepUpdate })
      setSummary({ success: true, orderId: orderIdToComplete, token: authToken, ...result })
    } catch {
      setSummary({ success: false })
    }
    setFlowPhase('done')
  }

  const handleReset = () => {
    setFlowPhase('idle')
    setSteps([])
    setSummary(null)
    setAuthToken(null)
    setFirstOrderId(null)
    setCurrentOrderId(null)
    setItemIndex(0)
  }

  const isDeviceDisabled = flowMode === 'device'
    ? ['running', 'otp-waiting', 'token-ready', 'item-waiting'].includes(flowPhase)
    : flowPhase === 'running'

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">IoT Device Simulator</h1>
        {steps.length > 0 && flowPhase !== 'running' && (
          <button className="btn btn--secondary" onClick={handleReset}>Reset</button>
        )}
      </div>

      <div className="flow-tabs">
        {FLOW_MODES.map(({ id, label }) => (
          <button
            key={id}
            className={`tab-btn${flowMode === id ? ' tab-btn--active' : ''}`}
            onClick={() => switchMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <DeviceConfigCard config={deviceConfig} onChange={setDeviceConfig} disabled={isDeviceDisabled} />

      {flowMode === 'device' && (
        <FlowConfigCard
          config={flowConfig}
          onChange={setFlowConfig}
          flowPhase={flowPhase}
          appCode={deviceConfig.appCode}
          onRunFlow={handleRunFlow}
          onVerifyOtp={handleVerifyOtp}
          onAddItem={handleAddItem}
          onCompleteOrder={handleCompleteOrder}
          hasOrderId={!!currentOrderId}
        />
      )}

      {flowMode === 'validate-scan' && (
        <ValidateScanCard
          config={validateScanConfig}
          onChange={setValidateScanConfig}
          flowPhase={flowPhase}
          onRun={handleValidateScan}
        />
      )}

      {flowMode === 'handler-login' && (
        <HandlerLoginCard
          config={handlerLoginConfig}
          onChange={setHandlerLoginConfig}
          flowPhase={flowPhase}
          onRun={handleLogin}
        />
      )}

      {flowMode === 'handler-logout' && (
        <HandlerLogoutCard
          flowPhase={flowPhase}
          onRun={handleLogout}
        />
      )}

      {flowMode === 'verify-task-otp' && (
        <VerifyTaskOtpCard
          config={verifyTaskConfig}
          onChange={setVerifyTaskConfig}
          flowPhase={flowPhase}
          onRun={handleVerifyTaskOtp}
        />
      )}

      {flowMode === 'update-bag' && (
        <UpdateBagCard
          flowPhase={flowPhase}
          onRun={handleUpdateBag}
        />
      )}

      {flowMode === 'assign-bag' && (
        <AssignBagCard
          config={assignBagConfig}
          onChange={setAssignBagConfig}
          flowPhase={flowPhase}
          onRun={handleAssignBag}
        />
      )}

      {flowMode === 'self-assign' && (
        <SelfAssignCard
          config={selfAssignConfig}
          onChange={setSelfAssignConfig}
          flowPhase={flowPhase}
          onRun={handleSelfAssign}
        />
      )}

      {flowMode === 'assign-device' && (
        <AssignDeviceCard
          config={assignDeviceConfig}
          onChange={setAssignDeviceConfig}
          flowPhase={flowPhase}
          onRun={handleAssignDevice}
        />
      )}

      {flowMode === 'seal-bag' && (
        <SealBagCard
          config={sealBagConfig}
          onChange={setSealBagConfig}
          flowPhase={flowPhase}
          onRun={handleSealBag}
        />
      )}

      <StepLog steps={steps} onClear={() => setSteps([])} />
      <SummaryCard summary={summary} />
    </div>
  )
}
