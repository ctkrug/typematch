/**
 * Mock marketing hero: display-font headline over UI-font body, plus the
 * small print and stat row that reveal whether the body face survives at
 * 13px next to a 56px display face.
 */
export function Hero() {
  return (
    <header className="mock-hero">
      <p className="mock-hero__eyebrow">Product analytics</p>

      <h1 className="mock-hero__title">
        Every metric your team argues about, settled in one place.
      </h1>

      <p className="mock-hero__lede">
        Meridian joins your product events to revenue, so you can see which features actually move
        retention — without waiting a week on a data team.
      </p>

      <div className="mock-hero__actions">
        <span className="mock-btn mock-btn--accent">Start free trial</span>
        <span className="mock-btn mock-btn--ghost">Book a walkthrough</span>
      </div>

      <p className="mock-hero__fine">No credit card required · 14-day trial · Cancel anytime</p>

      <dl className="mock-stats">
        <div className="mock-stat">
          <dt className="mock-stat__label">Events / day</dt>
          <dd className="mock-stat__value">1.2B</dd>
        </div>
        <div className="mock-stat">
          <dt className="mock-stat__label">Median query</dt>
          <dd className="mock-stat__value">240ms</dd>
        </div>
        <div className="mock-stat">
          <dt className="mock-stat__label">Uptime</dt>
          <dd className="mock-stat__value">99.98%</dd>
        </div>
      </dl>
    </header>
  );
}
