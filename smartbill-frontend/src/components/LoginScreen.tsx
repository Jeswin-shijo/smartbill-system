import { useState, type FormEvent } from 'react'

type LoginScreenProps = {
  isLoading: boolean
  errorMessage: string
  onLogin: (email: string, password: string) => Promise<void>
  onForgotPassword: () => void
}

export function LoginScreen({ isLoading, errorMessage, onLogin, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('owner@smartbill.app')
  const [password, setPassword] = useState('SmartBill@123')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onLogin(email, password)
  }

  return (
    <div className="auth-shell">
      <section className="auth-pane">
        <div className="auth-brand">
          <div className="auth-brand-mark">SB</div>
          <span>Smart Bill</span>
        </div>

        <div className="auth-headline">
          <h1>GST-ready billing for modern Indian businesses.</h1>
          <p>Send invoices, manage customers, track payments and GST collections — all from a single workspace.</p>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            CGST / SGST / IGST split applied automatically
          </div>
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            HSN/SAC codes, line-item discounts, round-off
          </div>
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Print-ready invoices with amount in words
          </div>
        </div>
      </section>

      <section className="auth-form-pane">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Smart Bill workspace.</p>
          </div>

          <div className="demo-card">
            <strong>Demo workspace</strong>
            <div>owner@smartbill.app · SmartBill@123</div>
          </div>

          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{ background: 'transparent', border: 0, color: 'var(--primary)', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 500 }}
              >
                Forgot password?
              </button>
            </span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: 6,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {errorMessage ? (
            <div className="flash is-error" style={{ marginBottom: 0 }}>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px' }}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}
