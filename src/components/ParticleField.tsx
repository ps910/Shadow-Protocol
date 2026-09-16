/**
 * ParticleField — CSS-only animated particle background
 * Creates a premium floating-particles effect with multiple layers
 * for parallax depth. No canvas or WebGL needed.
 */
export function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      <div className="particle-layer particle-layer-1">
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={`p1-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 25}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.15 + Math.random() * 0.35,
            }}
          />
        ))}
      </div>
      <div className="particle-layer particle-layer-2">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={`p2-${i}`}
            className="particle particle-glow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 30}s`,
              animationDuration: `${25 + Math.random() * 35}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              opacity: 0.08 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>
      <div className="particle-layer particle-layer-3">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={`p3-${i}`}
            className="particle particle-large"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${30 + Math.random() * 40}s`,
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`,
              opacity: 0.04 + Math.random() * 0.1,
            }}
          />
        ))}
      </div>
      {/* Ambient aurora glow blobs */}
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
    </div>
  );
}
