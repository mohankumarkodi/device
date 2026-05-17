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
