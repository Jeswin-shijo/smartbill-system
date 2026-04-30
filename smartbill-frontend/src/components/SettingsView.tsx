import { useEffect, useState, type FormEvent } from 'react'
import { INDIAN_STATES } from '../lib/constants'
import type { UserProfile } from '../types'

export type ProfileDraft = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'email'>

type SettingsViewProps = {
  profile: UserProfile
  isSubmitting: boolean
  onSaveProfile: (draft: ProfileDraft) => Promise<void>
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

function toDraft(profile: UserProfile): ProfileDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, email: _e, ...rest } = profile
  return rest
}

export function SettingsView({ profile, isSubmitting, onSaveProfile, onChangePassword }: SettingsViewProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile))
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    setDraft(toDraft(profile))
  }, [profile])

  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function applyState(code: string) {
    const s = INDIAN_STATES.find((entry) => entry.code === code)
    setDraft((prev) => ({ ...prev, stateCode: code, state: s?.name ?? prev.state }))
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSaveProfile(draft)
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onChangePassword(currentPassword, newPassword)
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <div className="settings-grid">
      <article className="card">
        <form onSubmit={handleProfileSubmit}>
          <div className="card-header">
            <div>
              <div className="card-title">Business profile</div>
              <div className="card-subtitle">Used on every invoice you issue.</div>
            </div>
          </div>

          <div className="field-grid">
            <label className="field">
              <span className="field-label">Full name *</span>
              <input className="input" required type="text" value={draft.fullName} onChange={(e) => update('fullName', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" type="email" value={profile.email} disabled />
            </label>
            <label className="field">
              <span className="field-label">Business name</span>
              <input className="input" type="text" value={draft.businessName} onChange={(e) => update('businessName', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Phone</span>
              <input className="input" type="text" value={draft.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">GSTIN</span>
              <input className="input" type="text" value={draft.gstin} onChange={(e) => update('gstin', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
            </label>
            <label className="field">
              <span className="field-label">PAN</span>
              <input className="input" type="text" value={draft.pan} onChange={(e) => update('pan', e.target.value.toUpperCase())} placeholder="AAAAA0000A" />
            </label>
            <label className="field">
              <span className="field-label">Invoice prefix</span>
              <input className="input" type="text" value={draft.invoicePrefix} onChange={(e) => update('invoicePrefix', e.target.value.toUpperCase())} />
            </label>
            <label className="field">
              <span className="field-label">Currency</span>
              <input className="input" type="text" value={draft.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} />
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
              <span className="field-label">State *</span>
              <select className="select" value={draft.stateCode} onChange={(e) => applyState(e.target.value)} required>
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

          <div className="card-header" style={{ marginTop: 22, marginBottom: 6 }}>
            <div className="card-title">Bank details</div>
          </div>

          <div className="field-grid-3">
            <label className="field">
              <span className="field-label">Bank name</span>
              <input className="input" type="text" value={draft.bankName} onChange={(e) => update('bankName', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Account number</span>
              <input className="input" type="text" value={draft.bankAccountNumber} onChange={(e) => update('bankAccountNumber', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">IFSC</span>
              <input className="input" type="text" value={draft.bankIfsc} onChange={(e) => update('bankIfsc', e.target.value.toUpperCase())} />
            </label>
          </div>

          <label className="field" style={{ marginTop: 14 }}>
            <span className="field-label">Bio</span>
            <textarea className="textarea" value={draft.bio} onChange={(e) => update('bio', e.target.value)} />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </article>

      <article className="card">
        <form onSubmit={handlePasswordSubmit}>
          <div className="card-header">
            <div>
              <div className="card-title">Change password</div>
              <div className="card-subtitle">Use 8+ characters, mix letters and numbers.</div>
            </div>
          </div>

          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" value={profile.email} disabled />
          </label>

          <label className="field" style={{ marginTop: 12 }}>
            <span className="field-label">Current password</span>
            <input className="input" required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </label>

          <label className="field" style={{ marginTop: 12 }}>
            <span className="field-label">New password</span>
            <input className="input" required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Change password'}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
