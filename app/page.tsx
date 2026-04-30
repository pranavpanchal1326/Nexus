export default function Home(): React.JSX.Element {
  return (
    <main style={{ padding: '48px', minHeight: '100dvh' }} className="bg-void">
      <h1 className="text-display" style={{ marginBottom: '24px' }}>
        NEXUS
      </h1>
      <p className="text-heading" style={{ marginBottom: '40px' }}>
        Void Intelligence OS
      </p>

      <div className="card" style={{ padding: '32px', maxWidth: '480px', marginBottom: '24px' }}>
        <p className="text-caption" style={{ marginBottom: '12px' }}>
          System Status
        </p>
        <p className="text-body">Design system loaded. Tailwind 4 active.</p>
        <p className="text-data" style={{ marginTop: '12px' }}>
          v2.0.0 — 2026
        </p>
      </div>

      <div
        className="card card--signal"
        style={{ padding: '32px', maxWidth: '480px', marginBottom: '24px' }}
      >
        <p className="text-caption" style={{ marginBottom: '12px' }}>
          Oracle
        </p>
        <p className="text-oracle">Intelligence is not a feature. It is the nervous system.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div
          className="animate-signal-pulse"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-signal)',
          }}
        />
        <span className="text-caption">AI Active</span>
      </div>
    </main>
  )
}
