import dynamic from 'next/dynamic'
const SceneWrapper = dynamic(
  () => import('@/components/three/SceneWrapper').then(m => m.SceneWrapper),
  { ssr: false }
)

import { Tesseract }       from '@/components/three/Tesseract'
import { AuroraField }     from '@/components/three/AuroraField'
import { DashboardClient } from './DashboardClient'

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="dashboard-page">

      {/* Primary scene — Aurora behind Tesseract */}
      <section className="dashboard-tesseract-zone">
        <SceneWrapper
          height={480}
          showStats={process.env.NODE_ENV === 'development'}
        >
          <AuroraField zPosition={-1} planeScale={8} />
          <Tesseract   scale={1.2}    showInnerCube={true} />
        </SceneWrapper>
      </section>

      {/* Background aurora — full dashboard ambient field */}
      {/* Second SceneWrapper — aurora only, no tesseract, covers full page */}
      <div className="dashboard-aurora-bg" aria-hidden="true">
        <SceneWrapper height="100%">
          <AuroraField
            zPosition={-2}
            planeScale={12}
          />
        </SceneWrapper>
      </div>

      <DashboardClient />

    </div>
  )
}
