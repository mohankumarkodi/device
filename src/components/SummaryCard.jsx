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
          {summary.orderId != null && (
            <div className="summary-item">
              <span className="summary-label">Order ID</span>
              <span className="summary-value">{summary.orderId}</span>
            </div>
          )}
          {summary.price != null && (
            <div className="summary-item">
              <span className="summary-label">Price</span>
              <span className="summary-value">₹{summary.price}</span>
            </div>
          )}
          {summary.voucherType != null && (
            <div className="summary-item">
              <span className="summary-label">Voucher Type</span>
              <span className="summary-value">{summary.voucherType}</span>
            </div>
          )}
          {summary.amount != null && (
            <div className="summary-item">
              <span className="summary-label">Amount</span>
              <span className="summary-value">₹{summary.amount}</span>
            </div>
          )}
          {summary.token && (
            <div className="summary-item summary-item--full">
              <span className="summary-label">Token</span>
              <span className="summary-value summary-value--token">
                {`${summary.token.slice(0, 40)}…`}
              </span>
            </div>
          )}
          {summary.responseData != null && (
            <div className="summary-item summary-item--full">
              <span className="summary-label">Response</span>
              <pre className="summary-response">{JSON.stringify(summary.responseData, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
