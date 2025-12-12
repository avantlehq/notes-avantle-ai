'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>404 - Page Not Found</h2>
      <p>Could not find the requested page.</p>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Return Home
      </Link>
    </div>
  )
}