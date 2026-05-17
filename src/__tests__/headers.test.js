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
