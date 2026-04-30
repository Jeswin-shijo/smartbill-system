import { useEffect, useState, type FormEvent } from 'react'
import { INDIAN_STATES } from '../lib/constants'
import type { Customer } from '../types'

export type CustomerDraft = {
  name: string
  email: string
  phone: string
  gstin: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  stateCode: string
  pincode: string
  country: string
  notes: string
}

const empty: CustomerDraft = {
  name: '',
  email: '',
  phone: '',
  gstin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  country: 'India',
  notes: '',
}

type CustomerFormViewProps = {
  initial: Customer | null
  isSubmitting: boolean
  onSave: (draft: CustomerDraft) => Promise<void>
  onCancel: () => void
}

function fromCustomer(c: Customer): CustomerDraft {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    gstin: c.gstin,
    addressLine1: c.addressLine1,
    addressLine2: c.addressLine2,
    city: c.city,
    state: c.state,
    stateCode: c.stateCode,
    pincode: c.pincode,
    country: c.country || 'India',
    notes: c.notes,
  }
}

export function CustomerFormView({ initial, isSubmitting, onSave, onCancel }: CustomerFormViewProps) {
  const [draft, setDraft] = useState<CustomerDraft>(() => (initial ? fromCustomer(initial) : empty))

  useEffect(() => {
    setDraft(initial ? fromCustomer(initial) : empty)
  }, [initial])

  function update<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function applyState(code: string) {
    const state = INDIAN_STATES.find((s) => s.code === code)
    setDraft((prev) => ({ ...prev, stateCode: code, state: state?.name ?? prev.state }))
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
            <div className="card-title">{initial ? 'Edit customer' : 'New customer'}</div>
            <div className="card-subtitle">Used for invoice billing and GST place-of-supply.</div>
          </div>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field-label">Customer name *</span>
            <input className="input" required type="text" value={draft.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">GSTIN</span>
            <input className="input" type="text" value={draft.gstin} onChange={(e) => update('gstin', e.target.value.toUpperCase())} placeholder="29AABCL1234M1Z5" />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" value={draft.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input className="input" type="text" value={draft.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
        </div>

        <div className="field-grid" style={{ marginTop: 14 }}>
          <label className="field">
            <span className="field-label">Address line 1</span>
            <input className="input" type="text" value={draft.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Address line 2</span>
            <input className="input" type="text" value={draft.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} />
          </label>
        </div>

        <div className="field-grid-4" style={{ marginTop: 14 }}>
          <label className="field">
            <span className="field-label">City</span>
            <input className="input" type="text" value={draft.city} onChange={(e) => update('city', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">State</span>
            <select className="select" value={draft.stateCode} onChange={(e) => applyState(e.target.value)}>
              <option value="">Select state…</option>
              {INDIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Pincode</span>
            <input className="input" type="text" value={draft.pincode} onChange={(e) => update('pincode', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Country</span>
            <input className="input" type="text" value={draft.country} onChange={(e) => update('country', e.target.value)} />
          </label>
        </div>

        <label className="field" style={{ marginTop: 14 }}>
          <span className="field-label">Notes</span>
          <textarea className="textarea" value={draft.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Internal notes, contact preferences, etc." />
        </label>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </form>
    </article>
  )
}
