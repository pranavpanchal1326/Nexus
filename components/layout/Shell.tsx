'use client'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { useNexusStore } from '@/store/nexusStore'

export function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const mode = useNexusStore(state => state.mode)

  return (
    <QueryProvider>
      <div className="shell-root">
        <div
          className={[
            'dashboard-aurora-bg',
            mode === 'apex' ? 'mesh-apex' : 'mesh-haven'
          ].join(' ')}
          aria-hidden="true"
        />
        {children}
      </div>
    </QueryProvider>
  )
}

export default Shell
