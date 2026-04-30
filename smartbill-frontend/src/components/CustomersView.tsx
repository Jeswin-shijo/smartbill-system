import { useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import type { Customer } from '../types'

type CustomersViewProps = {
  customers: Customer[]
  isSubmitting: boolean
  onDelete: (customerId: number) => Promise<void>
}

export function CustomersView({ customers, isSubmitting, onDelete }: CustomersViewProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => `${c.name} ${c.gstin} ${c.email}`.toLowerCase().includes(q))
  }, [customers, search])

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <input
            className="input"
            type="search"
            placeholder="Search customers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No customers yet</h3>
            <p>Add your first customer to start invoicing.</p>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/customers/new')} style={{ marginTop: 12 }}>
              + Add customer
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>Contact</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                    {customer.notes ? (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{customer.notes}</div>
                    ) : null}
                  </td>
                  <td className="nowrap">{customer.gstin || '—'}</td>
                  <td>{customer.state ? `${customer.state} (${customer.stateCode || '—'})` : '—'}</td>
                  <td>
                    {customer.email ? <div style={{ fontSize: 12 }}>{customer.email}</div> : null}
                    {customer.phone ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{customer.phone}</div> : null}
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onDelete(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
