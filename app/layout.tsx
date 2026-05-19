import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import '@/styles/globals.css'

// ─── Font Configuration ───────────────────────────────────────────────────────

const instrumentSerif = Instrument_Serif({
  weight:   ['400'],
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-serif',
  style:    ['normal', 'italic'],
})

const geistMono = Geist_Mono({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-mono',
})

// Satoshi is not on Google Fonts — local woff2
const satoshi = localFont({
  src:     '../public/fonts/Satoshi-Variable.woff2',
  variable: '--font-sans',
  display: 'swap',
  weight:  '300 900',
})

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       'NEXUS — Intelligence Operating System',
  description: 'Cognitive and physical intelligence tracking.',
  manifest:    '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor:    '#080808',
  colorScheme:   'dark',
  width:         'device-width',
  initialScale:  1,
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geistMono.variable} ${satoshi.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Global grain overlay — sits above everything */}
        <div className="shell-grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
