import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/modules/DashboardClient'
import type { Profile } from '@/types/database'

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, current_streak, cognitive_xp, preferred_mode')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'display_name' | 'current_streak' | 'cognitive_xp' | 'preferred_mode'> | null, error: unknown }

  return (
    <DashboardClient
      userId={user.id}
      initialStreak={profile?.current_streak ?? 0}
      initialXP={profile?.cognitive_xp ?? 0}
      displayName={profile?.display_name ?? null}
    />
  )
}
