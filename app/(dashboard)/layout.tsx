import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { NavRail } from '@/components/layout/NavRail'
import { IntelPanel } from '@/components/layout/IntelPanel'
import { DynamicIsland } from '@/components/layout/DynamicIsland'
import { ModeTransition } from '@/components/layout/ModeTransition'
import { ProtocolZero } from '@/components/layout/ProtocolZero'
import { DashboardShortcuts } from '@/components/layout/DashboardShortcuts'
import type { Profile } from '@/types/database'
import type { PreferredMode } from '@/hooks/useTimeMode'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, preferred_mode, cognitive_xp, current_streak, longest_streak, created_at, updated_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  return (
    <Shell>
      <ModeTransition />
      <ProtocolZero />
      <DashboardShortcuts />
      <DynamicIsland
        userId={user.id}
        preferredMode={profile?.preferred_mode ?? 'auto'}
        streak={profile?.current_streak ?? 0}
      />
      <div className="dashboard-grid">
        <NavRail user={user} profile={profile as Profile | null} />
        <main className="dashboard-main scroll-void">
          {children}
        </main>
        <IntelPanel 
          userId={user.id} 
          preferredMode={(profile?.preferred_mode ?? 'auto') as PreferredMode} 
        />
      </div>
    </Shell>
  )
}
