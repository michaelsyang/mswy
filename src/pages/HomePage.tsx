export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          background: '#1f6f3b',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        ✓ Live
      </span>
      <h1 style={{ fontSize: '2rem', color: 'var(--accent)' }}>mswy.xyz</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 500, lineHeight: 1.6 }}>
        Personal site — React + Vite + TypeScript.
        <br />
        <a href="/health">Health Dashboard →</a>
      </p>
    </main>
  )
}
