/* Distinctive, on-theme hero backdrop: a monochrome radar/sonar field.
   Static concentric rings + crosshair, a slow sweep arm, and expanding
   "ping" rings — evoking detection of the moment your API breaks.
   Pure black, no gradients, fades out toward the edges. */

const RINGS = [80, 150, 230, 320, 420, 540];

export function RadarField() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex h-[720px] justify-center overflow-hidden"
      style={{
        WebkitMaskImage: "radial-gradient(60% 70% at 50% 34%, #000 30%, transparent 78%)",
        maskImage: "radial-gradient(60% 70% at 50% 34%, #000 30%, transparent 78%)",
      }}
    >
      <div className="relative mt-[-260px] h-[1120px] w-[1120px]">
        {/* Static concentric rings + crosshair */}
        <svg viewBox="0 0 1120 1120" className="absolute inset-0 h-full w-full">
          {RINGS.map((r, i) => (
            <circle
              key={r}
              cx="560"
              cy="560"
              r={r}
              fill="none"
              stroke={`rgba(255,255,255,${0.13 - i * 0.012})`}
              strokeWidth="1"
            />
          ))}
          <line x1="560" y1="20" x2="560" y2="1100" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <line x1="20" y1="560" x2="1100" y2="560" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          {/* dashed range ring for a scope feel */}
          <circle cx="560" cy="560" r="185" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 7" />
          {/* tick dots where cardinal axes cross a mid ring */}
          {[
            [560, 240],
            [880, 560],
            [560, 880],
            [240, 560],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="rgba(255,255,255,0.4)" />
          ))}
          {/* center emitter */}
          <circle cx="560" cy="560" r="4" fill="rgba(255,255,255,0.65)" />
        </svg>

        {/* Slow sweep arm */}
        <div className="radar-spin absolute inset-0">
          <div
            className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom"
            style={{ background: "linear-gradient(to top, rgba(255,255,255,0.35), transparent)" }}
          />
        </div>

        {/* Expanding ping rings */}
        <div className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2">
          <span className="radar-ping" style={{ animationDelay: "0s" }} />
          <span className="radar-ping" style={{ animationDelay: "2s" }} />
          <span className="radar-ping" style={{ animationDelay: "4s" }} />
        </div>
      </div>
    </div>
  );
}
