import { formatDate, formatDateTime, formatINR, statusClassName } from '../lib/formatters'
import { navigate } from '../lib/router'
import type { DashboardData } from '../types'

type DashboardViewProps = {
  data: DashboardData
}

export function DashboardView({ data }: DashboardViewProps) {
  const totalBreakdown = data.breakdown.reduce((acc, b) => acc + b.total, 0) || 1

  return (
    <>
      <div className="metric-grid">
        {data.stats.map((stat) => (
          <article key={stat.key} className="metric">
            <div className="metric-label">{stat.label}</div>
            <div className="metric-value">
              {stat.key === 'totalBills' || stat.key === 'avgSettlementDays'
                ? stat.key === 'avgSettlementDays'
                  ? `${stat.value} days`
                  : stat.value
                : formatINR(stat.value, { compact: true })}
            </div>
            <div className="metric-helper">{stat.helper}</div>
          </article>
        ))}
      </div>

      {data.alerts.length > 0 ? (
        <div className="alert-list" style={{ marginBottom: 16 }}>
          {data.alerts.map((alert, idx) => (
            <div key={idx} className={`alert is-${alert.tone}`}>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="dashboard-grid">
        <article className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent invoices</div>
              <div className="card-subtitle">Latest activity from your billing workspace</div>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/invoices')}>
              View all
            </button>
          </div>

          {data.recentBills.length === 0 ? (
            <div className="table-empty">No invoices yet. Create one to get started.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issued</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBills.map((bill) => (
                  <tr key={bill.id} className="is-clickable" onClick={() => navigate(`/invoices/${bill.id}`)}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>{bill.customerName ?? '—'}</td>
                    <td>{formatDate(bill.issueDate)}</td>
                    <td className="text-right nowrap">{formatINR(bill.totalAmount)}</td>
                    <td><span className={`badge badge-${statusClassName(bill.status)}`}>{bill.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Status breakdown</div>
                <div className="card-subtitle">Across all invoices</div>
              </div>
            </div>

            {data.breakdown.length === 0 ? (
              <div className="table-empty">No invoices yet.</div>
            ) : (
              <div className="breakdown">
                {data.breakdown.map((row) => {
                  const pct = (row.total / totalBreakdown) * 100
                  return (
                    <div key={row.status} className="breakdown-row">
                      <span><span className={`badge badge-${statusClassName(row.status)}`}>{row.status}</span></span>
                      <div className="breakdown-bar">
                        <div className={`breakdown-fill ${statusClassName(row.status)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {row.total} · {formatINR(row.amount, { compact: true })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </article>

          <article className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent activity</div>
                <div className="card-subtitle">Status timeline</div>
              </div>
            </div>

            {data.activity.length === 0 ? (
              <div className="table-empty">No activity yet.</div>
            ) : (
              <div className="activity">
                {data.activity.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="activity-item">
                    <span className={`badge badge-${statusClassName(entry.status)}`} style={{ justifySelf: 'start' }}>
                      {entry.status}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13, fontWeight: 500 }}>{entry.title}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {entry.billNumber} · {entry.customerName}
                      </div>
                    </div>
                    <span className="activity-time">{formatDateTime(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  )
}
