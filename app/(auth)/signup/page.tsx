'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SignalDot } from '@/components/ui/SignalDot'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }
    
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="w-full max-w-[420px] flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <span className="text-display !text-[22px] italic mb-1">NEXUS</span>
          <span className="text-caption !text-[10px] tracking-[0.08em]">
            Intelligence Operating System
          </span>
        </div>

        <div className="card w-full p-10 flex flex-col items-center text-center">
          <p className="text-caption !text-[10px] !text-secondary tracking-[0.12em] mb-4">
            VERIFICATION SENT
          </p>
          <h1 className="text-oracle !text-[17px] !not-italic">
            Check your email to activate your intelligence profile.
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full max-w-[420px] flex flex-col items-center">
      <div className="flex flex-col items-center mb-8">
        <span className="text-display !text-[22px] italic mb-1">NEXUS</span>
        <span className="text-caption !text-[10px] tracking-[0.08em]">
          Intelligence Operating System
        </span>
      </div>

      <div className="card w-full p-8">
        <div className="mb-7">
          <h1 className="text-heading !text-[28px] italic mb-1">Begin</h1>
          <p className="text-caption tracking-wider">CREATE YOUR INTELLIGENCE PROFILE</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
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

          <div className="flex flex-col">
            <label className="text-caption !text-[10px] !text-secondary tracking-[0.1em] mb-1.5">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => {
                if (confirmPassword && password !== confirmPassword) {
                  setError('Passwords do not match.')
                } else {
                  setError(null)
                }
              }}
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
              'Initialize'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-caption !text-secondary lowercase tracking-normal">
          Already initialized? →{' '}
          <Link href="/login" className="text-primary hover:text-signal transition-colors">
            Enter
          </Link>
        </p>
      </div>

      <style jsx>{`
        .nexus-input {
          background: #0D0D0D;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          height: 44px;
          padding: 0 14px;
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--color-text-primary);
          transition: all 200ms ease;
        }
        .nexus-input:focus {
          outline: none;
          border-color: rgba(232, 255, 71, 0.4);
          box-shadow: 0 0 0 3px rgba(232, 255, 71, 0.06);
        }
        .nexus-btn-primary {
          width: 100%;
          height: 48px;
          background: transparent;
          border: 1px solid rgba(232, 255, 71, 0.5);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-signal);
          transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .nexus-btn-primary:hover:not(:disabled) {
          background: rgba(232, 255, 71, 0.04);
          border-color: rgba(232, 255, 71, 0.8);
          box-shadow: 0 0 24px rgba(232, 255, 71, 0.08);
        }
        .nexus-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          animation: border-pulse 1.2s infinite;
        }
        @keyframes border-pulse {
          0%, 100% { border-color: rgba(232, 255, 71, 0.3); }
          50% { border-color: rgba(232, 255, 71, 0.8); }
        }
      `}</style>
    </main>
  )
}
