import { useState } from 'react'
import { amountInWords, formatDate, formatDateTime, formatINR, formatNumber, statusClassName } from '../lib/formatters'
import { PAYMENT_METHODS } from '../lib/constants'
import { navigate } from '../lib/router'
import { BILL_STATUS_OPTIONS, type Bill, type HistoryEntry, type UserProfile } from '../types'

type InvoiceDetailViewProps = {
  user: UserProfile
  bill: Bill
  history: HistoryEntry[]
  isSubmitting: boolean
  onUpdateStatus: (status: string, description: string, paymentMethod?: string) => Promise<void>
  onDelete: () => Promise<void>
}

export function InvoiceDetailView({ user, bill, history, isSubmitting, onUpdateStatus, onDelete }: InvoiceDetailViewProps) {
  const [statusDraft, setStatusDraft] = useState(bill.status)
  const [statusNote, setStatusNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
  const [showStatusForm, setShowStatusForm] = useState(false)

  async function applyStatus() {
    await onUpdateStatus(statusDraft, statusNote, statusDraft === 'Paid' ? paymentMethod : '')
    setStatusNote('')
    setShowStatusForm(false)
  }

  return (
    <>
      <div className="invoice-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/invoices')}>
            ← Back to invoices
          </button>
          <span className={`badge badge-${statusClassName(bill.status)}`}>{bill.status}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowStatusForm((s) => !s)}>
            Change status
          </button>
          {bill.status !== 'Paid' && bill.status !== 'Cancelled' ? (
            <button
              className="btn btn-success btn-sm"
              type="button"
              disabled={isSubmitting}
              onClick={() => onUpdateStatus('Paid', 'Marked as paid from invoice detail.', paymentMethod)}
            >
              ✓ Mark paid
            </button>
          ) : null}
          {bill.status === 'Draft' ? (
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={isSubmitting}
              onClick={() => onUpdateStatus('Sent', 'Invoice marked as sent.')}
            >
              Send invoice
            </button>
          ) : null}
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate(`/invoices/${bill.id}/edit`)}>
            Edit
          </button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button className="btn btn-danger btn-sm" type="button" disabled={isSubmitting} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {showStatusForm ? (
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Update status</div>
          </div>
          <div className="field-grid-3">
            <label className="field">
              <span className="field-label">Status</span>
              <select className="select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as typeof statusDraft)}>
                {BILL_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {statusDraft === 'Paid' ? (
              <label className="field">
                <span className="field-label">Payment method</span>
                <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span className="field-label">Note</span>
              <input className="input" type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional history note" />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowStatusForm(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={applyStatus}>
              {isSubmitting ? 'Saving…' : 'Apply status'}
            </button>
          </div>
        </article>
      ) : null}

      <article className="invoice-doc">
        <header className="invoice-doc-head">
          <div className="invoice-doc-brand">
            <strong>{user.businessName || user.fullName}</strong>
            <span>{[user.addressLine1, user.addressLine2].filter(Boolean).join(', ')}</span>
            <span>{[user.city, user.state, user.pincode].filter(Boolean).join(', ')}</span>
            {user.gstin ? <span>GSTIN: {user.gstin}</span> : null}
            {user.pan ? <span>PAN: {user.pan}</span> : null}
          </div>
          <div className="invoice-doc-meta">
            <div className="invoice-doc-title">TAX INVOICE</div>
            <div className="invoice-doc-number">{bill.billNumber}</div>
          </div>
        </header>

        <div className="invoice-parties">
          <div className="party-block">
            <div className="party-label">Bill to</div>
            <strong>{bill.customer?.name ?? '—'}</strong>
            {bill.customer ? (
              <>
                <span>{[bill.customer.addressLine1, bill.customer.addressLine2].filter(Boolean).join(', ')}</span>
                <span>{[bill.customer.city, bill.customer.state, bill.customer.pincode].filter(Boolean).join(', ')}</span>
                {bill.customer.gstin ? <span>GSTIN: {bill.customer.gstin}</span> : null}
                {bill.customer.email ? <span>{bill.customer.email}</span> : null}
                {bill.customer.phone ? <span>{bill.customer.phone}</span> : null}
              </>
            ) : null}
          </div>
          <div className="party-block">
            <div className="party-label">Place of supply</div>
            <strong>{bill.placeOfSupply || bill.customer?.state || '—'} {bill.placeOfSupplyCode ? `(${bill.placeOfSupplyCode})` : ''}</strong>
            <span>{bill.isInterState ? 'Inter-state supply (IGST)' : 'Intra-state supply (CGST + SGST)'}</span>
          </div>
        </div>

        <div className="invoice-meta-row">
          <div>
            <span>Issue date</span>
            <strong>{formatDate(bill.issueDate)}</strong>
          </div>
          <div>
            <span>Due date</span>
            <strong>{formatDate(bill.dueDate)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{bill.status}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>
              {bill.status === 'Paid' && bill.paidDate
                ? `${formatDate(bill.paidDate)}${bill.paymentMethod ? ` · ${bill.paymentMethod}` : ''}`
                : '—'}
            </strong>
          </div>
        </div>

        <table className="invoice-doc-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>#</th>
              <th>Description</th>
              <th>HSN/SAC</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Disc</th>
              <th className="text-right">Taxable</th>
              <th className="text-right">GST</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((line, idx) => (
              <tr key={line.id ?? idx}>
                <td>{idx + 1}</td>
                <td>{line.description}<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{line.unit}</div></td>
                <td>{line.hsnCode || '—'}</td>
                <td className="text-right">{formatNumber(line.quantity)}</td>
                <td className="text-right">{formatINR(line.rate)}</td>
                <td className="text-right">{line.discountPct}%</td>
                <td className="text-right">{formatINR(line.taxableValue)}</td>
                <td className="text-right">
                  {bill.isInterState
                    ? `${formatINR(line.igstAmount)} (${line.gstRate}%)`
                    : `${formatINR(line.cgstAmount + line.sgstAmount)} (${line.gstRate}%)`}
                </td>
                <td className="text-right"><strong>{formatINR(line.totalAmount)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-doc-totals">
          <div>
            <div className="invoice-doc-words">
              <strong style={{ display: 'block', color: 'var(--text)', fontStyle: 'normal', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Amount in words</strong>
              {amountInWords(bill.totalAmount)}
            </div>

            {bill.notes ? (
              <div style={{ marginTop: 16, fontSize: 12 }}>
                <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Notes</strong>
                {bill.notes}
              </div>
            ) : null}

            {bill.terms ? (
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Terms</strong>
                {bill.terms}
              </div>
            ) : null}
          </div>

          <div className="totals-card">
            <div className="totals-row muted">
              <span>Subtotal</span>
              <span>{formatINR(bill.subtotal)}</span>
            </div>
            <div className="totals-row muted">
              <span>Discount</span>
              <span>− {formatINR(bill.discountTotal)}</span>
            </div>
            <div className="totals-row divider">
              <span>Taxable</span>
              <span>{formatINR(bill.taxableTotal)}</span>
            </div>
            {bill.isInterState ? (
              <div className="totals-row"><span>IGST</span><span>{formatINR(bill.igstTotal)}</span></div>
            ) : (
              <>
                <div className="totals-row"><span>CGST</span><span>{formatINR(bill.cgstTotal)}</span></div>
                <div className="totals-row"><span>SGST</span><span>{formatINR(bill.sgstTotal)}</span></div>
              </>
            )}
            {Math.abs(bill.roundOff) > 0 ? (
              <div className="totals-row muted"><span>Round off</span><span>{formatINR(bill.roundOff)}</span></div>
            ) : null}
            <div className="totals-row grand"><span>Total</span><span>{formatINR(bill.totalAmount)}</span></div>
          </div>
        </div>

        <footer className="invoice-doc-footer">
          <div>
            <strong>Bank details</strong>
            {user.bankName ? <div>{user.bankName}</div> : null}
            {user.bankAccountNumber ? <div>A/C: {user.bankAccountNumber}</div> : null}
            {user.bankIfsc ? <div>IFSC: {user.bankIfsc}</div> : null}
            {!user.bankName && !user.bankAccountNumber ? <div>Add bank details in Settings.</div> : null}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>For {user.businessName || user.fullName}</strong>
            <div style={{ marginTop: 28, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'inline-block', minWidth: 160 }}>Authorised signatory</div>
          </div>
        </footer>
      </article>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Status history</div>
        </div>
        {history.length === 0 ? (
          <div className="table-empty">No history yet.</div>
        ) : (
          <div className="activity">
            {history.map((entry) => (
              <div key={entry.id} className="activity-item">
                <span className={`badge badge-${statusClassName(entry.status)}`} style={{ justifySelf: 'start' }}>{entry.status}</span>
                <div>
                  <strong style={{ fontSize: 13, fontWeight: 500 }}>{entry.title}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.description}</div>
                </div>
                <span className="activity-time">{formatDateTime(entry.createdAt)}<div style={{ textAlign: 'right' }}>{entry.actorName}</div></span>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  )
}
