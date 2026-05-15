'use client'
import { useState }            from 'react'
import { PageWrapper, Button, Divider } from '@/components/ui'
import { LexiconDuel }          from '@/components/modules/LexiconDuel'
import { LexiconWordList }      from '@/components/modules/LexiconWordList'
import { AddWordModal }         from '@/components/modules/AddWordModal'

export default function LexiconPage() {
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <PageWrapper
      title="Lexicon"
      subtitle="Vocabulary and cognitive combat"
    >
      {/* Add word action */}
      <div className="lexicon-page__header">
        <Button
          variant="signal"
          size="sm"
          onClick={() => setAddModalOpen(true)}
        >
          + ADD WORD
        </Button>
      </div>

      {/* Duel interface */}
      <LexiconDuel />

      <Divider />

      {/* Word history */}
      <section className="lexicon-history">
        <h2 className="lexicon-history__title text-label">
          YOUR LEXICON
        </h2>
        <LexiconWordList />
      </section>

      {/* Add word modal */}
      <AddWordModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </PageWrapper>
  )
}
