'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import type { InputHTMLAttributes } from 'react'

// ─── Text Input ───────────────────────────────────────
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label rendered above input */
  label?: string
  /** Error message rendered below input */
  error?: string
  /** Helper text rendered below input */
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, style, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label !== undefined && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: error
                ? 'var(--color-error)'
                : 'var(--color-text-secondary)',
            }}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
            background: 'var(--color-surface)',
            border: `1px solid ${
              error ? 'var(--color-error)' : 'var(--color-border)'
            }`,
            borderRadius: '6px',
            padding: '10px 14px',
            height: '40px',
            width: '100%',
            outline: 'none',
            transition: 'border-color 200ms',
            caretColor: 'var(--color-signal)',
            ...style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = error
              ? 'var(--color-error)'
              : 'var(--color-signal)'
            props.onFocus?.(e)
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error
              ? 'var(--color-error)'
              : 'var(--color-border)'
            props.onBlur?.(e)
          }}
          {...props}
        />

        {(error !== undefined || hint !== undefined) && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: error
                ? 'var(--color-error)'
                : 'var(--color-text-disabled)',
            }}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  /** Minimum height in px */
  minHeight?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, minHeight = 120, style, id, ...props }, ref) => {
    const textareaId =
      id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label !== undefined && (
          <label
            htmlFor={textareaId}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: error
                ? 'var(--color-error)'
                : 'var(--color-text-secondary)',
            }}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            lineHeight: '1.65',
            letterSpacing: '0.01em',
            color: 'var(--color-text-primary)',
            background: 'var(--color-surface)',
            border: `1px solid ${
              error ? 'var(--color-error)' : 'var(--color-border)'
            }`,
            borderRadius: '8px',
            padding: '16px',
            width: '100%',
            minHeight: `${minHeight}px`,
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 200ms',
            caretColor: 'var(--color-signal)',
            ...style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = error
              ? 'var(--color-error)'
              : 'var(--color-signal)'
            props.onFocus?.(e)
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error
              ? 'var(--color-error)'
              : 'var(--color-border)'
            props.onBlur?.(e)
          }}
          {...props}
        />

        {(error !== undefined || hint !== undefined) && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: error
                ? 'var(--color-error)'
                : 'var(--color-text-disabled)',
            }}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Input
