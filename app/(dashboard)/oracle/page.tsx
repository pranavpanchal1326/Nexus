import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect }                    from 'next/navigation'
import { OracleChat }                  from '@/components/modules/OracleChat'

interface ChatMessage {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  mode:       'apex' | 'haven'
  persona:    'commander' | 'poet'
  created_at: string
}

export default async function OraclePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch last 40 messages — chronological
  const { data: history } = await supabase
    .from('chat_history')
    .select('id, role, content, mode, persona, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40)

  const chronological = ((history ?? []) as ChatMessage[]).reverse()

  return (
    <div className="oracle-page">
      <OracleChat initialHistory={chronological} />
    </div>
  )
}
