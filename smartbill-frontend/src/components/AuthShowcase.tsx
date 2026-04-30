import { BrandMark } from './BrandMark'

type AuthShowcaseProps = {
  badge: string
  title: string
  description: string
  features: string[]
  panelTitle: string
  panelDescription: string
}

export function AuthShowcase({
  badge,
  title,
  description,
  features,
  panelTitle,
  panelDescription,
}: AuthShowcaseProps) {
  return (
    <section className="auth-pane">
      <div className="auth-pane-top">
        <div className="auth-brand">
          <BrandMark size={54} className="auth-brand-mark" />
          <div className="auth-brand-copy">
            <span className="auth-brand-name">Smart Bill</span>
            <span className="auth-brand-tag">GST billing, made faster</span>
          </div>
        </div>
        <span className="auth-badge">{badge}</span>
      </div>

      <div className="auth-pane-body">
        <div className="auth-headline">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-visual-card">
          <div className="auth-visual-mark-wrap">
            <BrandMark size={96} className="auth-visual-mark" />
          </div>
          <div className="auth-visual-copy">
            <strong>{panelTitle}</strong>
            <span>{panelDescription}</span>
          </div>
        </div>
      </div>

      <div className="auth-features">
        {features.map((feature) => (
          <div className="auth-feature" key={feature}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {feature}
          </div>
        ))}
      </div>
    </section>
  )
}
