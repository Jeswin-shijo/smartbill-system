import { useEffect, useState, type FormEvent } from 'react'
import { GST_RATES, ITEM_TYPES, ITEM_UNITS } from '../lib/constants'
import type { Item } from '../types'

export type ItemDraft = {
  name: string
  description: string
  hsnCode: string
  unit: string
  rate: string
  gstRate: string
  type: 'product' | 'service'
}

const empty: ItemDraft = {
  name: '',
  description: '',
  hsnCode: '',
  unit: 'pcs',
  rate: '0',
  gstRate: '18',
  type: 'service',
}

type ItemFormViewProps = {
  initial: Item | null
  isSubmitting: boolean
  onSave: (draft: ItemDraft) => Promise<void>
  onCancel: () => void
}

function fromItem(item: Item): ItemDraft {
  return {
    name: item.name,
    description: item.description,
    hsnCode: item.hsnCode,
    unit: item.unit,
    rate: String(item.rate),
    gstRate: String(item.gstRate),
    type: item.type,
  }
}

export function ItemFormView({ initial, isSubmitting, onSave, onCancel }: ItemFormViewProps) {
  const [draft, setDraft] = useState<ItemDraft>(() => (initial ? fromItem(initial) : empty))

  useEffect(() => {
    setDraft(initial ? fromItem(initial) : empty)
  }, [initial])

  function update<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(draft)
  }

  return (
    <article className="card">
      <form onSubmit={handleSubmit}>
        <div className="card-header">
          <div>
            <div className="card-title">{initial ? 'Edit item' : 'New item'}</div>
            <div className="card-subtitle">Reusable products and services for your invoices.</div>
          </div>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field-label">Name *</span>
            <input className="input" required type="text" value={draft.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">HSN / SAC code</span>
            <input className="input" type="text" value={draft.hsnCode} onChange={(e) => update('hsnCode', e.target.value)} />
          </label>
        </div>

        <div className="field-grid-4" style={{ marginTop: 14 }}>
          <label className="field">
            <span className="field-label">Type</span>
            <select className="select" value={draft.type} onChange={(e) => update('type', e.target.value as 'product' | 'service')}>
              {ITEM_TYPES.map((t) => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Unit</span>
            <select className="select" value={draft.unit} onChange={(e) => update('unit', e.target.value)}>
              {ITEM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Rate (₹)</span>
            <input className="input" required type="number" min="0" step="0.01" value={draft.rate} onChange={(e) => update('rate', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">GST rate</span>
            <select className="select" value={draft.gstRate} onChange={(e) => update('gstRate', e.target.value)}>
              {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </label>
        </div>

        <label className="field" style={{ marginTop: 14 }}>
          <span className="field-label">Description</span>
          <textarea className="textarea" value={draft.description} onChange={(e) => update('description', e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </article>
  )
}
