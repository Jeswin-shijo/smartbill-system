import { useEffect, useState } from 'react'
import './App.css'

type Health = {
  status: string
  service: string
  timestamp: string
}

type Stat = {
  label: string
  value: string
  change: string
}

type Bill = {
  id: string
  client: string
  amount: string
  dueDate: string
  status: string
}

type Dashboard = {
  company: {
    name: string
    plan: string
    currency: string
  }
  stats: Stat[]
  bills: Bill[]
  alerts: string[]
  generatedAt: string
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { signal })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const [healthResponse, dashboardResponse] = await Promise.all([
          fetchJson<Health>('/api/health', controller.signal),
          fetchJson<Dashboard>('/api/dashboard', controller.signal),
        ])

        setHealth(healthResponse)
        setDashboard(dashboardResponse)
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError('Unable to reach the Smart Bill backend. Start the API server and refresh.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [])

  const syncedAt = health?.timestamp ?? dashboard?.generatedAt
  const bills = dashboard?.bills ?? []
  const stats = dashboard?.stats ?? []
  const alerts = dashboard?.alerts ?? []

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="eyebrow-row">
          <span className="eyebrow">Revenue command center</span>
          <span className={`status-pill ${health?.status === 'ok' ? 'is-ok' : ''}`}>
            {health?.status === 'ok' ? 'Backend connected' : 'Waiting for backend'}
          </span>
        </div>

        <div className="hero-copy">
          <div>
            <p className="hero-kicker">{dashboard?.company.name ?? 'Smart Bill'}</p>
            <h1>Frontend and backend are now talking to each other.</h1>
            <p className="hero-text">
              This dashboard is rendered by React and populated from the Express API at
              <code>/api/dashboard</code>.
            </p>
          </div>

          <div className="summary-card">
            <p className="summary-label">Workspace</p>
            <h2>{dashboard?.company.plan ?? 'Growth'} plan</h2>
            <p>Currency: {dashboard?.company.currency ?? 'USD'}</p>
            <p>
              Last synced:{' '}
              <strong>{syncedAt ? formatDate(syncedAt) : isLoading ? 'Loading...' : 'Unavailable'}</strong>
            </p>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="stats-grid" aria-label="Billing summary">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <h2>{stat.value}</h2>
            <p className="stat-change">{stat.change}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Invoices</p>
              <h2>Recent billing activity</h2>
            </div>
            <span className="panel-meta">{bills.length} records</span>
          </div>

          <div className="bill-list">
            {isLoading && bills.length === 0 ? (
              <p className="empty-state">Loading live dashboard data...</p>
            ) : null}

            {!isLoading && bills.length === 0 ? (
              <p className="empty-state">No invoices available from the backend yet.</p>
            ) : null}

            {bills.map((bill) => (
              <div key={bill.id} className="bill-row">
                <div>
                  <p className="bill-client">{bill.client}</p>
                  <p className="bill-id">{bill.id}</p>
                </div>
                <div>
                  <p className="bill-amount">{bill.amount}</p>
                  <p className="bill-date">Due {formatDate(bill.dueDate)}</p>
                </div>
                <span className={`bill-status status-${bill.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {bill.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <aside className="side-column">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">API health</p>
                <h2>Service snapshot</h2>
              </div>
            </div>

            <dl className="health-grid">
              <div>
                <dt>Status</dt>
                <dd>{health?.status ?? (isLoading ? 'Loading' : 'Offline')}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{health?.service ?? 'Unavailable'}</dd>
              </div>
              <div>
                <dt>Endpoint</dt>
                <dd>/api/health</dd>
              </div>
            </dl>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Alerts</p>
                <h2>Follow-ups</h2>
              </div>
            </div>

            <ul className="alert-list">
              {alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </main>
  )
}

export default App
