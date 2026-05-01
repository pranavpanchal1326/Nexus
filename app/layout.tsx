import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

/* ─── Instrument Serif ───────────────────────────────────
   Role: Headings (.text-display, .text-heading, .text-oracle)
   Weight 400 only — confidence does not shout
   ───────────────────────────────────────────────────────── */
const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  preload: true,
})

/* ─── Geist Mono ─────────────────────────────────────────
   Role: Data, numbers, captions, inputs, Commander AI text
   Variable weight for flexibility
   ───────────────────────────────────────────────────────── */
const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: true,
})

/* ─── Satoshi ────────────────────────────────────────────
   Role: Body text, UI prose, HAVEN ambient text
   Local variable font — NOT on Google Fonts
   Zero CDN dependency in production
   ───────────────────────────────────────────────────────── */
const satoshi = localFont({
  src: '../public/fonts/Satoshi-Variable.woff2',
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: {
    default: 'NEXUS',
    template: '%s — NEXUS',
  },
  description: 'Void Intelligence OS — Engineered for 2026',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html
      lang="en"
      className={`
        ${instrumentSerif.variable}
        ${geistMono.variable}
        ${satoshi.variable}
      `.trim()}
      suppressHydrationWarning
    >
      <body className="bg-void text-primary scroll-void">
        {children}
      </body>
    </html>
  )
}
