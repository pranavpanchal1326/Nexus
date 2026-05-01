export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          preferred_mode: 'auto' | 'apex' | 'haven'
          cognitive_xp: number
          current_streak: number
          longest_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_mode?: 'auto' | 'apex' | 'haven'
          cognitive_xp?: number
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_mode?: 'auto' | 'apex' | 'haven'
          cognitive_xp?: number
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
      }
      journals: {
        Row: {
          id: string
          user_id: string
          content: string
          mode: 'apex' | 'haven'
          word_count: number
          ai_insight: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          mode: 'apex' | 'haven'
          word_count?: number
          ai_insight?: string | null
          created_at?: string
        }
        Update: {
          content?: string
          mode?: 'apex' | 'haven'
          word_count?: number
          ai_insight?: string | null
        }
      }
      gym_logs: {
        Row: {
          id: string
          user_id: string
          exercise: string
          sets: number
          reps: number
          weight: number | null
          unit: 'kg' | 'lbs'
          notes: string | null
          volume_delta: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise: string
          sets: number
          reps: number
          weight?: number | null
          unit?: 'kg' | 'lbs'
          notes?: string | null
          volume_delta?: number | null
          created_at?: string
        }
        Update: {
          exercise?: string
          sets?: number
          reps?: number
          weight?: number | null
          unit?: 'kg' | 'lbs'
          notes?: string | null
          volume_delta?: number | null
        }
      }
      word_lexicon: {
        Row: {
          id: string
          user_id: string
          word: string
          definition: string
          usage_example: string | null
          cognitive_xp: number
          usage_count: number
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          definition: string
          usage_example?: string | null
          cognitive_xp?: number
          usage_count?: number
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          definition?: string
          usage_example?: string | null
          cognitive_xp?: number
          usage_count?: number
          last_used_at?: string | null
        }
      }
      daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          journal_count: number
          gym_count: number
          duel_count: number
          oracle_count: number
          xp_earned: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          journal_count?: number
          gym_count?: number
          duel_count?: number
          oracle_count?: number
          xp_earned?: number
        }
        Update: {
          journal_count?: number
          gym_count?: number
          duel_count?: number
          oracle_count?: number
          xp_earned?: number
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          mode: 'apex' | 'haven'
          persona: 'commander' | 'poet'
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          mode: 'apex' | 'haven'
          persona: 'commander' | 'poet'
          model?: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience type helpers
export type Profile     = Database['public']['Tables']['profiles']['Row']
export type Journal     = Database['public']['Tables']['journals']['Row']
export type GymLog      = Database['public']['Tables']['gym_logs']['Row']
export type WordLexicon = Database['public']['Tables']['word_lexicon']['Row']
export type DailyStat   = Database['public']['Tables']['daily_stats']['Row']
export type ChatMessage = Database['public']['Tables']['chat_history']['Row']

export type ProfileInsert     = Database['public']['Tables']['profiles']['Insert']
export type JournalInsert     = Database['public']['Tables']['journals']['Insert']
export type GymLogInsert      = Database['public']['Tables']['gym_logs']['Insert']
export type WordLexiconInsert = Database['public']['Tables']['word_lexicon']['Insert']
export type ChatMessageInsert = Database['public']['Tables']['chat_history']['Insert']
