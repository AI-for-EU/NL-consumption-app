import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  })
  return _client
}

// Convenience export — may be null when env vars are not set
export const supabase = {
  get auth() { return getSupabase()?.auth },
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export type SupabaseProfile = {
  id: string
  name: string | null
  city: string | null
  lat: number | null
  lng: number | null
  budget: Record<string, number> | null
  lifestyle_budget: Record<string, number> | null
  household_size: number
  setup_complete: boolean
  updated_at: string
}
