import { useMemo, useState } from 'react'
import { formatINR } from '../lib/formatters'
import { navigate } from '../lib/router'
import type { Item } from '../types'

type ItemsViewProps = {
  items: Item[]
  isSubmitting: boolean
  onDelete: (itemId: number) => Promise<void>
}

export function ItemsView({ items, isSubmitting, onDelete }: ItemsViewProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => `${i.name} ${i.hsnCode}`.toLowerCase().includes(q))
  }, [items, search])

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <input
            className="input"
            type="search"
            placeholder="Search items by name or HSN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No items yet</h3>
            <p>Add products and services to your catalog for faster invoicing.</p>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/items/new')} style={{ marginTop: 12 }}>
              + Add item
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>HSN/SAC</th>
                <th>Type</th>
                <th>Unit</th>
                <th className="text-right">Rate</th>
                <th className="text-right">GST</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description ? (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description}</div>
                    ) : null}
                  </td>
                  <td>{item.hsnCode || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                  <td>{item.unit}</td>
                  <td className="text-right nowrap">{formatINR(item.rate)}</td>
                  <td className="text-right">{item.gstRate}%</td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate(`/items/${item.id}/edit`)}>Edit</button>
                    <button className="btn btn-danger btn-sm" type="button" disabled={isSubmitting} onClick={() => onDelete(item.id)}>Delete</button>
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
