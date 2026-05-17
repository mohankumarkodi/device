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
            <span className="summary-value">{summary.price !== undefined ? `₹${summary.price}` : '—'}</span>
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
