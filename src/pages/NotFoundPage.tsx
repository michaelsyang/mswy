export default function NotFoundPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '12px',
      }}
    >
      <h1 style={{ fontSize: '3rem', color: 'var(--accent)' }}>404</h1>
      <p style={{ color: 'var(--muted)' }}>Page not found.</p>
      <a href="/">← Home</a>
    </main>
  )
}
