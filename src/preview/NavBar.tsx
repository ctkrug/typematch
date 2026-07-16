/**
 * Mock product nav. Deliberately dense: a wordmark in the display font next
 * to 12–14px links in the UI font is exactly where a pairing's x-height
 * mismatch shows up, and a specimen sheet never tests it.
 */
export function NavBar() {
  return (
    <nav className="mock-nav" aria-label="Meridian (preview)">
      <span className="mock-nav__brand">
        <span className="mock-nav__mark" aria-hidden="true" />
        Meridian
      </span>

      <ul className="mock-nav__links">
        <li>
          <span className="mock-nav__link mock-nav__link--current">Overview</span>
        </li>
        <li>
          <span className="mock-nav__link">Reports</span>
        </li>
        <li>
          <span className="mock-nav__link">Segments</span>
        </li>
        <li>
          <span className="mock-nav__link">
            Changelog
            <span className="mock-nav__pill">New</span>
          </span>
        </li>
      </ul>

      <div className="mock-nav__actions">
        <span className="mock-btn mock-btn--ghost mock-btn--sm">Sign in</span>
        <span className="mock-btn mock-btn--accent mock-btn--sm">Start free</span>
      </div>
    </nav>
  );
}
