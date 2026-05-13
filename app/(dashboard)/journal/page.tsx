import { PageWrapper }      from '@/components/ui'
import { JournalEditor }    from '@/components/modules/JournalEditor'
import { JournalList }      from '@/components/modules/JournalList'
import { Divider }          from '@/components/ui'

export default function JournalPage() {
  return (
    <PageWrapper
      title="Journal"
      subtitle="Thought committed to record"
    >
      {/* New entry editor */}
      <JournalEditor />

      <Divider className="journal-divider" />

      {/* Previous entries */}
      <section className="journal-history">
        <h2 className="journal-history__title text-label">
          PREVIOUS ENTRIES
        </h2>
        <JournalList />
      </section>
    </PageWrapper>
  )
}
