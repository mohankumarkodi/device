import { buildHeaders } from '../utils/headers.js'

async function runStep({ stepId, method, url, headers, body, onStepUpdate }) {
  if (headers['displayId']) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}displayId=${encodeURIComponent(headers['displayId'])}`
  }
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

export async function verifyOtp({ deviceConfig, flowConfig, onStepUpdate }) {
  const url = `${deviceConfig.environment}/services/stakeholder/api/verify-otp`
  const headers = {
    ...buildHeaders(deviceConfig),
    schemeType: flowConfig.schemeType,
    schemeAdministratorId: deviceConfig.schemeAdminId,
  }
  const data = await runStep({
    stepId: 'verify-otp',
    method: 'POST',
    url,
    headers,
    body: { mobile: flowConfig.mobile, verificationCode: flowConfig.otpCode },
    onStepUpdate,
  })
  return data?.id_token ?? ''
}

export async function getEntityToken({ deviceConfig, flowConfig, onStepUpdate }) {
  const url = `${deviceConfig.environment}/services/collection/api/public/entity-token?formattedId=${encodeURIComponent(flowConfig.formattedId)}`
  const data = await runStep({
    stepId: 'entity-token',
    method: 'GET',
    url,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data?.id_token ?? ''
}

export async function validateAndAddItem({ deviceConfig, flowConfig, token, itemIndex, firstOrderId, onStepUpdate }) {
  const qrStepId = `validate-qr-${itemIndex}`
  const addStepId = `add-item-${itemIndex}`
  const isSoundBox = deviceConfig.appCode === 'SBX006'

  try {
    const isLoadTest = deviceConfig.environment === 'https://api.loadtest.ddrs.recykal.com'
    const usiPath = isLoadTest ? 'services/collection/api/usi-authentication' : 'services/qr-service/api/usi-authentication'
    const qrUrl = `${deviceConfig.environment}/${usiPath}?usiCode=${encodeURIComponent(flowConfig.itemQrCode)}`
    await runStep({
      stepId: qrStepId,
      method: 'GET',
      url: qrUrl,
      headers: buildHeaders(deviceConfig, token),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps([addStepId], onStepUpdate)
    throw err
  }

  const addUrl = isSoundBox
    ? `${deviceConfig.environment}/services/collection/api/center/order-item`
    : `${deviceConfig.environment}/services/collection/api/rvm/order-item`

  const body = isSoundBox
    ? { qrCode: flowConfig.itemQrCode, ...(firstOrderId != null ? { requestOrderId: firstOrderId } : {}) }
    : { qrCode: flowConfig.itemQrCode, aiDetectionType: flowConfig.aiDetectionType, itemUrl: flowConfig.itemUrl, ...(firstOrderId != null ? { requestOrderId: firstOrderId } : {}) }

  const orderData = await runStep({
    stepId: addStepId,
    method: 'POST',
    url: addUrl,
    headers: buildHeaders(deviceConfig, token),
    body,
    onStepUpdate,
  })

  return orderData?.order?.id
}

function parseRejected(str) {
  if (!str || !str.trim()) return []
  try { return JSON.parse(str) } catch { return [] }
}

function splitCodes(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

export async function runFastScanDriveIn({ deviceConfig, flowConfig, onStepUpdate }) {
  let entityData
  try {
    const url = `${deviceConfig.environment}/services/collection/api/public/entity-token?formattedId=${encodeURIComponent(flowConfig.formattedId)}`
    entityData = await runStep({
      stepId: 'entity-token',
      method: 'GET',
      url,
      headers: buildHeaders(deviceConfig),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(['drive-in'], onStepUpdate)
    throw err
  }

  const token = entityData?.id_token ?? ''
  const result = await runStep({
    stepId: 'drive-in',
    method: 'POST',
    url: `${deviceConfig.environment}/services/collection/api/order/drive-in`,
    headers: buildHeaders(deviceConfig, token),
    body: {
      entityQr: flowConfig.formattedId,
      qrCodes: splitCodes(flowConfig.qrCodes),
      rejectedDetails: parseRejected(flowConfig.rejectedDetails),
    },
    onStepUpdate,
  })

  return result
}

export async function runFastScanCounting({ deviceConfig, flowConfig, onStepUpdate }) {
  let entityData
  try {
    const url = `${deviceConfig.environment}/services/collection/api/public/entity-token?formattedId=${encodeURIComponent(flowConfig.formattedId)}`
    entityData = await runStep({
      stepId: 'entity-token',
      method: 'GET',
      url,
      headers: buildHeaders(deviceConfig),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(['counting-started', 'counting-ended'], onStepUpdate)
    throw err
  }

  const token = entityData?.id_token ?? ''

  try {
    await runStep({
      stepId: 'counting-started',
      method: 'PUT',
      url: `${deviceConfig.environment}/services/collection/api/counting/started`,
      headers: buildHeaders(deviceConfig, token),
      body: [{ bagCode: flowConfig.bagCode }],
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(['counting-ended'], onStepUpdate)
    throw err
  }

  const result = await runStep({
    stepId: 'counting-ended',
    method: 'POST',
    url: `${deviceConfig.environment}/services/collection/api/counted`,
    headers: buildHeaders(deviceConfig, token),
    body: [{
      bagCode: flowConfig.bagCode,
      totalCount: Number(flowConfig.totalCount) || 0,
      qrCodes: splitCodes(flowConfig.qrCodes),
      rejectedDetails: parseRejected(flowConfig.rejectedDetails),
    }],
    onStepUpdate,
  })
  return result
}

export async function validateScan({ deviceConfig, validateScanConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'validate-scan',
    method: 'POST',
    url: `${deviceConfig.environment}/services/collection/api/presence/validate-scan`,
    headers: buildHeaders(deviceConfig),
    body: {
      qrCode: validateScanConfig.qrCode,
      scannedAt: new Date().toISOString(),
    },
    onStepUpdate,
  })
  return data
}

export async function handlerLogin({ deviceConfig, handlerLoginConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'handler-login',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/public/handler-login?qrCode=${encodeURIComponent(handlerLoginConfig.qrCode)}`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function handlerLogout({ deviceConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'handler-logout',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/public/handler-logout`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function runVerifyTaskFlow({ deviceConfig, verifyTaskConfig, onStepUpdate }) {
  let verifyData
  try {
    verifyData = await runStep({
      stepId: 'verify-task-otp',
      method: 'GET',
      url: `${deviceConfig.environment}/services/iot/api/public/verify-task-otp?taskOtp=${encodeURIComponent(verifyTaskConfig.taskOtp)}`,
      headers: buildHeaders(deviceConfig),
      body: undefined,
      onStepUpdate,
    })
  } catch (err) {
    skipSteps(['complete-task'], onStepUpdate)
    throw err
  }

  if (!verifyData) {
    skipSteps(['complete-task'], onStepUpdate)
    return { isVerified: verifyData }
  }

  const completeData = await runStep({
    stepId: 'complete-task',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/iot/api/public/bag/complete-task`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })

  return { isVerified: verifyData, taskStatus: completeData?.taskStatus }
}

export async function updateBag({ deviceConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'update-bag',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/public/machine/update-bag`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function assignBag({ deviceConfig, assignBagConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'assign-bag',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/public/machine/assign-bag`,
    headers: buildHeaders(deviceConfig),
    body: {
      code: assignBagConfig.code,
      materialType: assignBagConfig.materialType,
    },
    onStepUpdate,
  })
  return data
}

export async function selfAssign({ deviceConfig, selfAssignConfig, onStepUpdate }) {
  const params = new URLSearchParams({
    formattedId: selfAssignConfig.formattedId,
    schemeCertificate: selfAssignConfig.schemeCertificate,
  })
  const data = await runStep({
    stepId: 'self-assign',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/iot/api/public/machine/self-assign?${params}`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function sealBag({ deviceConfig, sealBagConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'seal-bag',
    method: 'POST',
    url: `${deviceConfig.environment}/services/collection/api/public/machine/bag-seal?bagCode=${encodeURIComponent(sealBagConfig.bagCode)}`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function assignDevice({ deviceConfig, assignDeviceConfig, onStepUpdate }) {
  const data = await runStep({
    stepId: 'assign-device',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/public/center/assign-device?qrCode=${encodeURIComponent(assignDeviceConfig.qrCode)}`,
    headers: buildHeaders(deviceConfig),
    body: undefined,
    onStepUpdate,
  })
  return data
}

export async function completeOrder({ deviceConfig, token, orderId, onStepUpdate }) {
  const result = await runStep({
    stepId: 'complete-order',
    method: 'PUT',
    url: `${deviceConfig.environment}/services/collection/api/order/complete/${orderId}`,
    headers: buildHeaders(deviceConfig, token),
    body: undefined,
    onStepUpdate,
  })
  return { price: result?.totalPrice ?? result?.order?.totalPrice ?? result?.order?.price ?? result?.price }
}
