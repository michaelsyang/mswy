interface ErrorStateProps {
  message: string
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <p style={{ color: 'var(--danger)', fontSize: 'var(--text-base)' }}>{message}</p>
    </main>
  )
}
