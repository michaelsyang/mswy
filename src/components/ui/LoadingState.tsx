export default function LoadingState() {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-base)' }}>Loading health data…</p>
    </main>
  )
}
