import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { computeTotals, emptyLineItem } from '../lib/calculations'
import { GST_RATES, INDIAN_STATES, ITEM_UNITS } from '../lib/constants'
import { formatINR } from '../lib/formatters'
import type { Bill, BillDraft, Customer, Item, LineItemDraft, UserProfile } from '../types'

type InvoiceFormViewProps = {
  user: UserProfile
  customers: Customer[]
  items: Item[]
  initialBill: Bill | null
  initialNumber: string
  isSubmitting: boolean
  onSave: (draft: BillDraft) => Promise<void>
  onCancel: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildInitialDraft(bill: Bill | null, initialNumber: string): BillDraft {
  if (bill) {
    return {
      billNumber: bill.billNumber,
      customerId: bill.customerId,
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      placeOfSupply: bill.placeOfSupply,
      placeOfSupplyCode: bill.placeOfSupplyCode,
      notes: bill.notes,
      terms: bill.terms,
      items: bill.items.map((line) => ({
        itemId: line.itemId,
        description: line.description,
        hsnCode: line.hsnCode,
        unit: line.unit,
        quantity: String(line.quantity),
        rate: String(line.rate),
        discountPct: String(line.discountPct),
        gstRate: String(line.gstRate),
      })),
    }
  }
  return {
    billNumber: initialNumber,
    customerId: null,
    issueDate: todayISO(),
    dueDate: plusDaysISO(15),
    placeOfSupply: '',
    placeOfSupplyCode: '',
    notes: '',
    terms: 'Payment due within 15 days. Late payments attract 1.5% interest per month.',
    items: [emptyLineItem()],
  }
}

export function InvoiceFormView({
  user,
  customers,
  items,
  initialBill,
  initialNumber,
  isSubmitting,
  onSave,
  onCancel,
}: InvoiceFormViewProps) {
  const [draft, setDraft] = useState<BillDraft>(() => buildInitialDraft(initialBill, initialNumber))

  useEffect(() => {
    setDraft(buildInitialDraft(initialBill, initialNumber))
  }, [initialBill, initialNumber])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === draft.customerId) ?? null,
    [customers, draft.customerId],
  )

  const placeOfSupplyCode = draft.placeOfSupplyCode || selectedCustomer?.stateCode || ''
  const isInterState = placeOfSupplyCode !== '' && user.stateCode !== '' && placeOfSupplyCode !== user.stateCode

  const totals = useMemo(() => computeTotals(draft.items, isInterState), [draft.items, isInterState])

  function updateLine(index: number, patch: Partial<LineItemDraft>) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }))
  }

  function addLine() {
    setDraft((prev) => ({ ...prev, items: [...prev.items, emptyLineItem()] }))
  }

  function removeLine(index: number) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }))
  }

  function applyItem(lineIndex: number, itemId: number | null) {
    if (!itemId) {
      updateLine(lineIndex, { itemId: null })
      return
    }
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    updateLine(lineIndex, {
      itemId: item.id,
      description: item.name,
      hsnCode: item.hsnCode,
      unit: item.unit,
      rate: String(item.rate),
      gstRate: String(item.gstRate),
    })
  }

  function applyCustomer(customerId: number | null) {
    setDraft((prev) => {
      const customer = customers.find((c) => c.id === customerId) ?? null
      return {
        ...prev,
        customerId,
        placeOfSupply: customer?.state ?? prev.placeOfSupply,
        placeOfSupplyCode: customer?.stateCode ?? prev.placeOfSupplyCode,
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.customerId) return
    await onSave(draft)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="invoice-form-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Invoice details</div>
                <div className="card-subtitle">Customer, dates and place of supply determine the GST split.</div>
              </div>
            </div>

            <div className="field-grid">
              <label className="field">
                <span className="field-label">Invoice number</span>
                <input
                  className="input"
                  type="text"
                  value={draft.billNumber}
                  onChange={(e) => setDraft((p) => ({ ...p, billNumber: e.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Customer</span>
                <select
                  className="select"
                  value={draft.customerId ?? ''}
                  onChange={(e) => applyCustomer(e.target.value ? Number(e.target.value) : null)}
                  required
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gstin ? `(${c.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Issue date</span>
                <input
                  className="input"
                  type="date"
                  value={draft.issueDate}
                  onChange={(e) => setDraft((p) => ({ ...p, issueDate: e.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Due date</span>
                <input
                  className="input"
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Place of supply</span>
                <select
                  className="select"
                  value={draft.placeOfSupplyCode}
                  onChange={(e) => {
                    const code = e.target.value
                    const state = INDIAN_STATES.find((s) => s.code === code)
                    setDraft((p) => ({ ...p, placeOfSupplyCode: code, placeOfSupply: state?.name ?? '' }))
                  }}
                >
                  <option value="">Use customer state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  {isInterState
                    ? 'Inter-state supply — IGST will apply'
                    : placeOfSupplyCode
                      ? 'Intra-state supply — CGST + SGST will apply'
                      : 'Select a customer to determine GST split'}
                </span>
              </label>
            </div>
          </article>

          <article className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Line items</div>
                <div className="card-subtitle">Pick from your catalog or enter a custom line.</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                + Add line
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="line-items">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Description</th>
                    <th style={{ width: '90px' }}>HSN/SAC</th>
                    <th style={{ width: '70px' }}>Unit</th>
                    <th style={{ width: '70px' }} className="text-right">Qty</th>
                    <th style={{ width: '110px' }} className="text-right">Rate</th>
                    <th style={{ width: '70px' }} className="text-right">Disc %</th>
                    <th style={{ width: '70px' }} className="text-right">GST %</th>
                    <th style={{ width: '110px' }} className="text-right">Amount</th>
                    <th style={{ width: '36px' }} />
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((line, idx) => {
                    const computed = totals.lines[idx]
                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            value={line.itemId ?? ''}
                            onChange={(e) => applyItem(idx, e.target.value ? Number(e.target.value) : null)}
                            style={{ marginBottom: 4 }}
                          >
                            <option value="">Custom item…</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>{it.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                            placeholder="Description"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={line.hsnCode}
                            onChange={(e) => updateLine(idx, { hsnCode: e.target.value })}
                            placeholder="HSN"
                          />
                        </td>
                        <td>
                          <select
                            value={line.unit}
                            onChange={(e) => updateLine(idx, { unit: e.target.value })}
                          >
                            {ITEM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                            style={{ textAlign: 'right' }}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) => updateLine(idx, { rate: e.target.value })}
                            style={{ textAlign: 'right' }}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.discountPct}
                            onChange={(e) => updateLine(idx, { discountPct: e.target.value })}
                            style={{ textAlign: 'right' }}
                          />
                        </td>
                        <td className="text-right">
                          <select
                            value={line.gstRate}
                            onChange={(e) => updateLine(idx, { gstRate: e.target.value })}
                            style={{ textAlign: 'right' }}
                          >
                            {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="text-right" style={{ paddingTop: 14 }}>
                          <strong>{formatINR(computed?.total ?? 0)}</strong>
                        </td>
                        <td className="line-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            onClick={() => removeLine(idx)}
                            disabled={draft.items.length === 1}
                            title="Remove line"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card">
            <div className="card-header">
              <div className="card-title">Notes & terms</div>
            </div>
            <div className="field-grid">
              <label className="field">
                <span className="field-label">Notes</span>
                <textarea
                  className="textarea"
                  value={draft.notes}
                  onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Visible on the invoice"
                />
              </label>
              <label className="field">
                <span className="field-label">Terms</span>
                <textarea
                  className="textarea"
                  value={draft.terms}
                  onChange={(e) => setDraft((p) => ({ ...p, terms: e.target.value }))}
                  placeholder="Payment terms and conditions"
                />
              </label>
            </div>
          </article>
        </div>

        <article className="card totals-card">
          <div className="card-header">
            <div className="card-title">Summary</div>
          </div>

          <div className="totals-row muted">
            <span>Subtotal</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="totals-row muted">
            <span>Discount</span>
            <span>− {formatINR(totals.discountTotal)}</span>
          </div>
          <div className="totals-row divider">
            <span>Taxable value</span>
            <span>{formatINR(totals.taxableTotal)}</span>
          </div>
          {isInterState ? (
            <div className="totals-row">
              <span>IGST</span>
              <span>{formatINR(totals.igstTotal)}</span>
            </div>
          ) : (
            <>
              <div className="totals-row">
                <span>CGST</span>
                <span>{formatINR(totals.cgstTotal)}</span>
              </div>
              <div className="totals-row">
                <span>SGST</span>
                <span>{formatINR(totals.sgstTotal)}</span>
              </div>
            </>
          )}
          <div className="totals-row muted">
            <span>Round off</span>
            <span>{formatINR(totals.roundOff)}</span>
          </div>
          <div className="totals-row grand">
            <span>Total (₹)</span>
            <span>{formatINR(totals.totalAmount)}</span>
          </div>

          <div className="form-actions" style={{ marginTop: 18, flexDirection: 'column-reverse', borderTop: 0, paddingTop: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ width: '100%' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !draft.customerId} style={{ width: '100%' }}>
              {isSubmitting ? 'Saving…' : initialBill ? 'Save changes' : 'Create invoice'}
            </button>
          </div>

          {customers.length === 0 ? (
            <div className="alert is-warn" style={{ marginTop: 12 }}>
              <span>You don't have any customers yet. <a href="#/customers/new">Add one first</a>.</span>
            </div>
          ) : null}

          {!user.stateCode ? (
            <div className="alert is-warn" style={{ marginTop: 12 }}>
              <span>Set your business state in <a href="#/settings">Settings</a> so GST is calculated correctly.</span>
            </div>
          ) : null}

          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            {isInterState
              ? `Inter-state: IGST applied because place of supply (${placeOfSupplyCode}) differs from your state (${user.stateCode || '—'}).`
              : `Intra-state: CGST + SGST applied because place of supply matches your state (${user.stateCode || '—'}).`}
          </div>
        </article>
      </div>
    </form>
  )
}
