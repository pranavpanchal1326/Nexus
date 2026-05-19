'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignalDot } from '@/components/ui/SignalDot'

export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleAuth = async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback` 
      }
    })
  }

  const handleGithubAuth = async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback` 
      }
    })
  }

  return (
    <main className="w-full max-w-[420px] flex flex-col items-center">
      {/* Wordmark Block */}
      <div className="flex flex-col items-center mb-8">
        <span className="text-display !text-[22px] italic mb-1">NEXUS</span>
        <span className="text-caption !text-[10px] tracking-[0.08em]">
          Intelligence Operating System
        </span>
      </div>

      {/* Auth Card */}
      <div className="card w-full p-8">
        <div className="mb-7">
          <h1 className="text-heading !text-[28px] italic mb-1">Welcome back</h1>
          <p className="text-caption tracking-wider">ENTER YOUR CREDENTIALS</p>
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-caption !text-[10px] !text-secondary tracking-[0.1em] mb-1.5">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="nexus-input"
              placeholder="name@nexus.app"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-caption !text-[10px] !text-secondary tracking-[0.1em] mb-1.5">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="nexus-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-caption !text-error lowercase tracking-normal">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="nexus-btn-primary group"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <SignalDot className="w-2 h-2" />
              </div>
            ) : (
              'Enter'
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-[1px] flex-1 bg-border-subtle" />
          <span className="text-caption !text-[10px] !text-disabled tracking-[0.12em]">OR</span>
          <div className="h-[1px] flex-1 bg-border-subtle" />
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={handleGoogleAuth} className="nexus-btn-social">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            GOOGLE
          </button>
          <button onClick={handleGithubAuth} className="nexus-btn-social">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GITHUB
          </button>
        </div>

        <p className="mt-8 text-center text-caption !text-secondary lowercase tracking-normal">
          No account? →{' '}
          <Link href="/signup" className="text-primary hover:text-signal transition-colors">
            Initialize
          </Link>
        </p>
      </div>


    </main>
  )
}
