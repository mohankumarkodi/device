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
