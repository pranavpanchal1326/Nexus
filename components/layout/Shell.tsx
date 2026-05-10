'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { useNexusStore } from '@/store/nexusStore'

export function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const mode = useNexusStore(state => state.mode)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="shell-root">
        {/* Dashboard Aurora Background — Mode Aware */}
        <div 
          className={[
            'dashboard-aurora-bg',
            mode === 'apex' ? 'mesh-apex' : 'mesh-haven'
          ].join(' ')} 
          aria-hidden="true" 
        />
        {children}
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default Shell
