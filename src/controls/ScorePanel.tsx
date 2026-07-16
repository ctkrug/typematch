import { WARN_THRESHOLD, type PairingScore } from "../scoring/score";

export interface ScorePanelProps {
  score: PairingScore | null;
}

/** A ring whose sweep encodes the score — drawn in SVG, no chart library. */
function ScoreRing({ score, level }: { score: number; level: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <svg className="score__ring" viewBox="0 0 64 64" role="presentation" data-level={level}>
      <circle className="score__ring-track" cx="32" cy="32" r={radius} />
      <circle
        className="score__ring-fill"
        cx="32"
        cy="32"
        r={radius}
        strokeDasharray={`${filled} ${circumference - filled}`}
        // Start the sweep at 12 o'clock instead of 3.
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

export function ScorePanel({ score }: ScorePanelProps) {
  if (!score) {
    return (
      <section className="score score--empty" aria-label="Readability score">
        <p className="score__empty-text">
          Score unavailable — the preview colors couldn&rsquo;t be read.
        </p>
      </section>
    );
  }

  const isWarning = score.overall < WARN_THRESHOLD;

  return (
    <section className="score" aria-label="Readability score" data-level={score.level}>
      <header className="score__head">
        <ScoreRing score={score.overall} level={score.level} />

        <div className="score__headline">
          <p className="score__number">
            <span className="score__value">{score.overall}</span>
            <span className="score__outof">/100</span>
          </p>
          <p className="score__caption">
            {isWarning && (
              <span className="score__warn-icon" aria-hidden="true">
                !
              </span>
            )}
            {isWarning ? "Needs work" : score.level === "good" ? "Solid pairing" : "Workable"}
          </p>
        </div>
      </header>

      {/* Announced on change so the score isn't visual-only. */}
      <p className="score__live" role="status" aria-live="polite">
        Readability score {score.overall} out of 100. {isWarning ? "Needs work." : "Passing."}
      </p>

      <ul className="score__factors">
        {score.factors.map((factor) => (
          <li className="factor" key={factor.id} data-level={factor.level}>
            <div className="factor__head">
              <span className="factor__label">{factor.label}</span>
              <span className="factor__readout">{factor.readout}</span>
            </div>
            <div
              className="factor__meter"
              role="meter"
              aria-valuenow={Math.round(factor.score)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={factor.label}
            >
              <span className="factor__meter-fill" style={{ width: `${factor.score}%` }} />
            </div>
            <p className="factor__verdict">{factor.verdict}</p>
          </li>
        ))}
      </ul>

      {!score.measured && (
        <p className="score__note">
          Only contrast could be measured here — this browser doesn&rsquo;t expose the glyph metrics
          the legibility factors need.
        </p>
      )}
    </section>
  );
}
