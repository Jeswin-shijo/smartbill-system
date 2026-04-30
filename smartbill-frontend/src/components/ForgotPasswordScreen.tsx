import { useState, type FormEvent } from 'react'
import { ApiError, apiRequest } from '../lib/api'

type ForgotPasswordScreenProps = {
  onBackToLogin: () => void
  onResetSuccess: (email: string) => void
}

type Step = 'request' | 'verify'

export function ForgotPasswordScreen({ onBackToLogin, onResetSuccess }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setInfo('')
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      })
      setInfo(res.message)
      setStep('verify')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to send reset code.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setInfo('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        },
      })
      setInfo(res.message)
      setTimeout(() => onResetSuccess(email.trim().toLowerCase()), 800)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-pane">
        <div className="auth-brand">
          <div className="auth-brand-mark">SB</div>
          <span>Smart Bill</span>
        </div>

        <div className="auth-headline">
          <h1>Reset your password.</h1>
          <p>We'll email a 6-digit code to your registered address. Enter it on the next step along with your new password.</p>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Codes expire in 15 minutes
          </div>
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            One active code per account
          </div>
          <div className="auth-feature">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Codes are securely hashed at rest
          </div>
        </div>
      </section>

      <section className="auth-form-pane">
        {step === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <div className="auth-form-header">
              <h2>Forgot password</h2>
              <p>Enter your email and we'll send a verification code.</p>
            </div>

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </label>

            {error ? (
              <div className="flash is-error" style={{ marginBottom: 0 }}>
                <span>{error}</span>
              </div>
            ) : null}

            <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px' }}>
              {isLoading ? 'Sending code…' : 'Send code'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-form-header">
              <h2>Enter code & new password</h2>
              <p>Code sent to <strong>{email}</strong>. Check your inbox (or backend logs in dev).</p>
            </div>

            {info ? (
              <div className="flash is-success" style={{ marginBottom: 0 }}>
                <span>{info}</span>
              </div>
            ) : null}

            <label className="field">
              <span className="field-label">6-digit code</span>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                style={{ letterSpacing: '0.4em', fontSize: 16, textAlign: 'center' }}
              />
            </label>

            <label className="field">
              <span className="field-label">New password</span>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
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
              <span className="field-hint">Minimum 8 characters</span>
            </label>

            <label className="field">
              <span className="field-label">Confirm new password</span>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {error ? (
              <div className="flash is-error" style={{ marginBottom: 0 }}>
                <span>{error}</span>
              </div>
            ) : null}

            <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px' }}>
              {isLoading ? 'Resetting password…' : 'Reset password'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button
                type="button"
                onClick={() => { setStep('request'); setCode(''); setError(''); setInfo('') }}
                className="btn btn-ghost btn-sm"
              >
                ← Use a different email
              </button>
              <button
                type="button"
                onClick={onBackToLogin}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
