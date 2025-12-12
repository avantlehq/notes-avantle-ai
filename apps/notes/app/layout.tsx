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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
