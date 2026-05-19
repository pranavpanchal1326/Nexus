'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SignalDot } from '@/components/ui/SignalDot'

export default function SignupPage(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
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
              onBlur={(): void => {
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


    </main>
  )
}
