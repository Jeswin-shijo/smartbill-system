import { useMemo, useState } from 'react'
import { formatDate, formatINR, statusClassName } from '../lib/formatters'
import { navigate } from '../lib/router'
import { BILL_STATUS_OPTIONS, type Bill } from '../types'

type InvoicesViewProps = {
  bills: Bill[]
}

export function InvoicesView({ bills }: InvoicesViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bills.filter((bill) => {
      if (statusFilter !== 'All' && bill.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${bill.billNumber} ${bill.customerName ?? bill.customer?.name ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [bills, search, statusFilter])

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <input
            className="input"
            type="search"
            placeholder="Search by invoice number or customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['All', ...BILL_STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill ${statusFilter === status ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>Create your first invoice or adjust your filters.</p>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/invoices/new')} style={{ marginTop: 12 }}>
              + New invoice
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="text-right">GST</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bill) => {
                const gst = bill.cgstTotal + bill.sgstTotal + bill.igstTotal
                return (
                  <tr key={bill.id} className="is-clickable" onClick={() => navigate(`/invoices/${bill.id}`)}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>{bill.customerName ?? bill.customer?.name ?? '—'}</td>
                    <td className="nowrap">{formatDate(bill.issueDate)}</td>
                    <td className="nowrap">{formatDate(bill.dueDate)}</td>
                    <td className="text-right nowrap">{formatINR(gst)}</td>
                    <td className="text-right nowrap"><strong>{formatINR(bill.totalAmount)}</strong></td>
                    <td><span className={`badge badge-${statusClassName(bill.status)}`}>{bill.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
