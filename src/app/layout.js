export const metadata = {
  title: 'PsycheSensei',
  description: 'A Philosophical Self-Discovery Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#111315', color: '#E8E8E8' }}>
        {children}
      </body>
    </html>
  )
}
