import { PageWrapper }   from '@/components/ui'
import { GymTracker }    from '@/components/modules/GymTracker'
import { GymHistory }    from '@/components/modules/GymHistory'
import { Divider }       from '@/components/ui'

export default function GymPage() {
  return (
    <PageWrapper
      title="Gym"
      subtitle="Physical output tracked"
    >
      <GymTracker />
      <Divider className="gym-divider" />
      <section className="gym-history-section">
        <h2 className="gym-history-section__title text-label">
          HISTORY
        </h2>
        <GymHistory />
      </section>
    </PageWrapper>
  )
}
