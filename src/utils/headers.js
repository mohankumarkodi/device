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
