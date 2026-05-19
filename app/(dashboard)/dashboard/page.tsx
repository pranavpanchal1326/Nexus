import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/modules/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('display_name, current_streak, cognitive_xp, preferred_mode')
    .eq('id', user.id)
    .single()) as unknown as { data: any }

  return (
    <DashboardClient
      userId={user.id}
      initialStreak={profile?.current_streak ?? 0}
      initialXP={profile?.cognitive_xp ?? 0}
      displayName={profile?.display_name ?? null}
    />
  )
}
