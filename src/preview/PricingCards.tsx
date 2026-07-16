interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/month",
    blurb: "For side projects and the first few thousand users.",
    features: ["50k events / month", "3 saved reports", "7-day retention", "Community support"],
    cta: "Get started",
  },
  {
    name: "Team",
    price: "$24",
    cadence: "/user / month",
    blurb: "For product teams who ship weekly and argue with data.",
    features: [
      "5M events / month",
      "Unlimited reports",
      "12-month retention",
      "Slack + email alerts",
      "SSO via Google",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Scale",
    price: "$96",
    cadence: "/user / month",
    blurb: "For orgs with audit requirements and a data warehouse.",
    features: ["Unlimited events", "Warehouse sync", "SAML + SCIM", "99.99% SLA", "Named CSM"],
    cta: "Talk to sales",
  },
];

/**
 * Mock pricing table. Prices are the densest typographic test in the mock —
 * big display numerals butted against tiny UI-font cadence text, repeated
 * three times across a grid where any x-height mismatch reads as misalignment.
 */
export function PricingCards() {
  return (
    <section className="mock-pricing" aria-label="Pricing (preview)">
      <h2 className="mock-section__title">Straightforward pricing</h2>
      <p className="mock-section__lede">
        Every plan includes the full query engine. You only pay for volume and seats.
      </p>

      <div className="mock-pricing__grid">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={`mock-card${tier.featured ? " mock-card--featured" : ""}`}
          >
            {tier.featured && <span className="mock-card__badge">Most popular</span>}
            <h3 className="mock-card__name">{tier.name}</h3>
            <p className="mock-card__price">
              <span className="mock-card__amount">{tier.price}</span>
              <span className="mock-card__cadence">{tier.cadence}</span>
            </p>
            <p className="mock-card__blurb">{tier.blurb}</p>
            <ul className="mock-card__features">
              {tier.features.map((feature) => (
                <li key={feature}>
                  <span className="mock-card__check" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <span
              className={`mock-btn mock-btn--block ${
                tier.featured ? "mock-btn--accent" : "mock-btn--outline"
              }`}
            >
              {tier.cta}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
