'use client'
import { useState, useCallback, type FormEvent } from 'react'
import { Modal }        from '@/components/ui'
import { useAddWord }   from '@/hooks/useLexicon'
import { SPRING }       from '@/lib/motion'
import { motion }       from 'framer-motion'

interface AddWordModalProps {
  isOpen:  boolean
  onClose: () => void
}

interface WordPayload {
  word:           string
  definition:     string
  usage_example?: string
}

export function AddWordModal({ isOpen, onClose }: AddWordModalProps) {
  const [word,     setWord]     = useState('')
  const [def,      setDef]      = useState('')
  const [example,  setExample]  = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { mutateAsync: addWord, isPending } = useAddWord()

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!word.trim() || !def.trim()) return

    setFormError(null)

    try {
      const payload: WordPayload = {
        word:           word.trim(),
        definition:     def.trim(),
      }
      if (example.trim()) payload.usage_example = example.trim()
      
      await addWord(payload)
      setWord('')
      setDef('')
      setExample('')
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add word')
    }
  }, [word, def, example, addWord, onClose])

  const handleClose = () => {
    setWord('')
    setDef('')
    setExample('')
    setFormError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="ADD WORD"
      maxWidth="480px"
    >
      <form
        onSubmit={handleSubmit}
        className="add-word-form"
      >
        <div className="add-word-form__field">
          <label className="input-label">WORD</label>
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="ephemeral"
            className="input-field"
            autoFocus
            required
            aria-label="Word"
          />
        </div>

        <div className="add-word-form__field">
          <label className="input-label">DEFINITION</label>
          <textarea
            value={def}
            onChange={e => setDef(e.target.value)}
            placeholder="Lasting for a very short time"
            className="input-field add-word-form__textarea"
            required
            aria-label="Definition"
          />
        </div>

        <div className="add-word-form__field">
          <label className="input-label">
            EXAMPLE SENTENCE
            <span className="add-word-form__optional">(OPTIONAL)</span>
          </label>
          <textarea
            value={example}
            onChange={e => setExample(e.target.value)}
            placeholder="The ephemeral light of dawn was gone before anyone woke."
            className="input-field add-word-form__textarea"
            aria-label="Example sentence"
          />
        </div>

        {formError && (
          <div className="input-error">{formError}</div>
        )}

        <div className="add-word-form__actions">
          <button
            type="button"
            className="btn btn--ghost btn--md"
            onClick={handleClose}
          >
            CANCEL
          </button>
          <motion.button
            type="submit"
            disabled={!word.trim() || !def.trim() || isPending}
            className={`btn btn--signal btn--md ${
              !word.trim() || !def.trim() || isPending ? 'btn--disabled' : ''
            }`}
            {...(word.trim() && def.trim() ? { whileTap: { scale: 0.96 } } : {})}
            transition={SPRING.SNAP}
          >
            {isPending ? '...' : 'ADD TO LEXICON'}
          </motion.button>
        </div>
      </form>
    </Modal>
  )
}
