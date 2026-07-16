/**
 * Mock signup form.
 *
 * The hardest test in the mock: 12px labels, 15px input text, 12px helper and
 * error copy, and a disabled button all stacked within a few pixels of each
 * other. If a pairing has no discernible label/input hierarchy, it fails here
 * and nowhere else — which is the entire reason this tool exists.
 *
 * Inputs are readonly presentational stand-ins: the mock is a picture of a
 * product, not a working form, and real inputs would put ~6 dead fields into
 * the tab order ahead of the tool's own controls.
 */
export function SignupForm() {
  return (
    <section className="mock-signup" aria-label="Sign-up form (preview)">
      <div className="mock-signup__copy">
        <h2 className="mock-section__title">Start your trial</h2>
        <p className="mock-section__lede">
          Connect a source and you&rsquo;ll have your first funnel inside ten minutes.
        </p>
        <ul className="mock-signup__points">
          <li>
            <span className="mock-card__check" aria-hidden="true" />
            Import from Segment, Snowflake, or a plain webhook
          </li>
          <li>
            <span className="mock-card__check" aria-hidden="true" />
            Your data stays in your region
          </li>
          <li>
            <span className="mock-card__check" aria-hidden="true" />
            SOC 2 Type II, audited annually
          </li>
        </ul>
      </div>

      <form className="mock-form" onSubmit={(event) => event.preventDefault()}>
        <div className="mock-field">
          <span className="mock-label">Full name</span>
          <span className="mock-input">Ada Lovelace</span>
        </div>

        <div className="mock-field">
          <span className="mock-label">Work email</span>
          <span className="mock-input">ada@meridian.io</span>
          <span className="mock-help">We&rsquo;ll send a verification link.</span>
        </div>

        <div className="mock-field">
          <span className="mock-label">Password</span>
          <span className="mock-input mock-input--invalid">••••••</span>
          <span className="mock-error" role="presentation">
            Use at least 8 characters, including a number.
          </span>
        </div>

        <div className="mock-field">
          <span className="mock-label">Team size</span>
          <span className="mock-input mock-input--select">
            11&ndash;50 people
            <span className="mock-input__caret" aria-hidden="true" />
          </span>
        </div>

        <label className="mock-check">
          <span className="mock-check__box" aria-hidden="true" />
          <span className="mock-check__text">
            Email me product updates. No more than once a month.
          </span>
        </label>

        <span className="mock-btn mock-btn--accent mock-btn--block">Create account</span>
        <span className="mock-btn mock-btn--block mock-btn--disabled" aria-disabled="true">
          Continue with SSO
        </span>

        <p className="mock-form__fine">
          By continuing you agree to the <span className="mock-link">Terms</span> and{" "}
          <span className="mock-link">Privacy Policy</span>.
        </p>
      </form>
    </section>
  );
}
