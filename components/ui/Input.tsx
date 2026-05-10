'use client'
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, className, id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'input-field',
            error     ? 'input-field--error'    : '',
            className ?? '',
          ].filter(Boolean).join(' ')}
          {...props}
        />
        {/* Error — static, no animation — urgency needs no motion */}
        {error && (
          <span className="input-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span className="input-hint">{hint}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:   string
  error?:   string
  hint?:    string
  minHeight?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, minHeight, className, id, style, ...props }, ref) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="input-group">
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'input-field',
            error     ? 'input-field--error'    : '',
            className ?? '',
          ].filter(Boolean).join(' ')}
          style={{ 
            height: 'auto', 
            minHeight: minHeight ?? 120, 
            paddingTop: '12px',
            paddingBottom: '12px',
            resize: 'vertical',
            ...style 
          }}
          {...props}
        />
        {error && (
          <span className="input-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span className="input-hint">{hint}</span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
