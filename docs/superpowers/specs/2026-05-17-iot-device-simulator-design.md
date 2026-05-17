# IoT Device Simulator — Design Spec
**Date:** 2026-05-17  
**Project:** device-sample  
**Status:** Approved

---

## Overview

A standalone React application that simulates an IoT device (RVM, Sound Box, or Fast Check-In scanner) making real API calls to the DRS backend. The user configures the device and flow inputs, then triggers the full 4-step collection flow with a single button. Results are displayed as a live step-by-step log plus a final summary card.

---

## Layout

Single-page, top-to-bottom flat layout. No routing.

```
┌─────────────────────────────────────────────────────┐
│  IoT Device Simulator                               │
├─────────────────────────────────────────────────────┤
│  [Device Config Card]                               │
│   Environment ▼  |  displayId  |  appCode ▼        │
│   schemeAdminId  |  X-HMAC-Signature                │
├─────────────────────────────────────────────────────┤
│  [Flow Config Card]                                 │
│   Auth Method ▼ (OTP Flow / Entity QR Scan)        │
│                                                     │
│   If OTP:  schemeType ▼ | mobile number             │
│            OTP code (phase 2 only)                  │
│   If QR:   formattedId                              │
│                                                     │
│   Item QR Code  |  AI Detection Type  |  Item URL  │
│                                                     │
│            [ ▶ Run Flow ]                           │
├─────────────────────────────────────────────────────┤
│  [Step Log]                                         │
│   ✅ Step 1.1 - Send OTP          [expand ▼]        │
│   ✅ Step 1.2 - Verify OTP        [expand ▼]        │
│   ✅ Step 2  - Validate QR        [expand ▼]        │
│   ⏳ Step 3  - Add Item                             │
│   ⬜ Step 4  - Complete Order                       │
├─────────────────────────────────────────────────────┤
│  [Final Summary Card]                               │
│   Status: ✅ Success                                │
│   Order ID: 12345  |  Price: ₹10.00                │
│   Token: eyJ...                                     │
└─────────────────────────────────────────────────────┘
```

---

## Global Headers

Every API request includes these headers:

| Header            | Value                                      |
|-------------------|--------------------------------------------|
| `displayId`       | User-configured machine identifier         |
| `Content-Type`    | `application/json`                         |
| `X-HMAC-Signature`| Manually entered by user                   |
| `Authorization`   | `Bearer <id_token>` (after auth step)      |
| `appCode`         | Selected from dropdown                     |

`appCode` options:
- `rvm-RVM002`
- `sound_box-SBX006`
- `fast_scan-FCI007`

---

## Environments

| Label       | Base URL                            |
|-------------|-------------------------------------|
| Development | `https://dev.api.drs.recykal.com`   |
| Staging     | `https://stage.api.ddrs.recykal.com`|
| UAT         | `https://uat-api.ddrs.recykal.com`  |
| Demo        | `https://demo.api.ddrs.recykal.com` |
| Production  | `https://api.ddrs.recykal.com`      |

---

## API Flow

### Auth Method: OTP Flow

**Step 1.1 — Send OTP**
- `POST {baseUrl}/services/stakeholder/api/send-otp`
- Headers: `schemeType` (BRAND/NON_BRAND), `schemeAdministratorId`
- Body: `{ mobile }`
- On success: flow pauses, user enters OTP code, clicks "Submit OTP"

**Step 1.2 — Verify OTP**
- `POST {baseUrl}/services/stakeholder/api/verify-otp`
- Headers: `schemeType`, `schemeAdministratorId`
- Body: `{ mobile, verificationCode }`
- On success: `id_token` extracted and stored in state as Bearer token

### Auth Method: Entity QR Scan

**Step 1 — Validate Entity QR**
- `GET {baseUrl}/services/collection/api/public/entity-token?formattedId={formattedId}`
- On success: `id_token` extracted and stored in state as Bearer token

---

### Step 2 — Validate Item QR Code
- `GET {baseUrl}/services/qr-service/api/usi-authentication?usiCode={itemQrCode}`
- Uses global headers including Bearer token
- On failure (400): show error message (QR claimed / not redeemable / expired / non-DRS)
- On success: proceed to Step 3

### Step 3 — Add Item
- `POST {baseUrl}/services/collection/api/rvm/order-item`
- Body: `{ qrCode, aiDetectionType, itemUrl }`
- On success: extract `order.id` and `order.price`, store for Step 4

### Step 4 — Complete Order
- `PUT {baseUrl}/services/collection/api/order/complete/{orderId}`
- On success: flow complete

---

## Step State Machine

Each step has one of these states: `idle | running | success | error | skipped`

- Steps run sequentially; each waits for the previous to succeed.
- If a step returns 4xx/5xx: mark it `error`, mark remaining steps `skipped`, stop execution.
- The raw response body (JSON) is shown in the step's expanded accordion view.

---

## OTP Two-Phase Interaction

When auth method is OTP:
1. "Run Flow" triggers Step 1.1 (send OTP) only.
2. An OTP input field appears in the Flow Config card.
3. A "Submit OTP" button replaces "Run Flow".
4. Clicking it triggers Step 1.2 and continues the rest of the flow.

---

## Final Summary Card

Appears after all steps complete (success or error). Shows:
- Overall status (success / failed at step X)
- `id_token` (truncated)
- `order.id`
- `order.price`

---

## Components

| Component          | Responsibility                                              |
|--------------------|-------------------------------------------------------------|
| `App.jsx`          | Root state, orchestrates config + flow execution           |
| `DeviceConfigCard` | env dropdown, displayId, appCode dropdown, HMAC, schemeAdminId |
| `FlowConfigCard`   | auth method dropdown, schemeType dropdown (BRAND/NON_BRAND), mobile/formattedId, qrCode, aiDetectionType, itemUrl |
| `StepLog`          | Renders list of StepEntry components                       |
| `StepEntry`        | Single step: status icon, label, collapsible req/res panel |
| `SummaryCard`      | Final token, orderId, price display                        |

---

## API Orchestration

`src/api/flowRunner.js` — the only file that knows about endpoint URLs. Exports a single async generator or callback-driven function that:
1. Accepts config + flow inputs
2. Calls each API in sequence
3. Yields/calls back with step status updates after each call

`src/utils/headers.js` — builds the global headers object from device config for any given request.

---

## Tech Stack

| Concern     | Choice                         | Reason                              |
|-------------|--------------------------------|-------------------------------------|
| Runtime     | Node 16                        | Required by user                    |
| Bundler     | Vite 4.x                       | Last Vite version supporting Node 16|
| Framework   | React 18                       | Compatible with Node 16             |
| Styling     | Plain CSS                      | No extra dependencies               |
| State       | `useState` / `useReducer`      | No external state library needed    |
| HTTP        | `fetch` (native browser API)   | No axios/axios-like dependency      |

---

## Project Structure

```
device-sample/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── components/
    │   ├── DeviceConfigCard.jsx
    │   ├── FlowConfigCard.jsx
    │   ├── StepLog.jsx
    │   ├── StepEntry.jsx
    │   └── SummaryCard.jsx
    ├── api/
    │   └── flowRunner.js
    └── utils/
        └── headers.js
```

---

## Out of Scope

- HMAC auto-generation (user enters it manually)
- Token persistence across page refreshes
- Multiple simultaneous flows
- Backend proxy / CORS handling (backend must allow the browser origin)
