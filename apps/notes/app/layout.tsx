import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Notes - Avantle AI',
  description: 'AI-powered note-taking application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
