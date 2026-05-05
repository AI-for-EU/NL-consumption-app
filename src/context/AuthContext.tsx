'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type AuthState = 'loading' | 'unauthenticated' | 'authenticated'

interface AuthContextValue {
  user: User | null
  session: Session | null
  authState: AuthState
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>
  verifyOTP: (phone: string, token: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInWithMicrosoft: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function normaliseNLPhone(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('06')) return '+31' + trimmed.slice(1)
  if (trimmed.startsWith('6') && trimmed.length === 9) return '+31' + trimmed
  if (trimmed.startsWith('31')) return '+' + trimmed
  return trimmed
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) { setAuthState('unauthenticated'); return }
    const sb = getSupabase()
    if (!sb) { setAuthState('unauthenticated'); return }

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setAuthState(data.session ? 'authenticated' : 'unauthenticated')
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setAuthState(session ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [configured])

  const signInWithPhone = useCallback(async (phone: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase not configured — add env vars' }
    const { error } = await sb.auth.signInWithOtp({ phone: normaliseNLPhone(phone) })
    return { error: error?.message ?? null }
  }, [])

  const verifyOTP = useCallback(async (phone: string, token: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase not configured' }
    const { error } = await sb.auth.verifyOtp({ phone: normaliseNLPhone(phone), token, type: 'sms' })
    return { error: error?.message ?? null }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase not configured' }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }, [])

  const signInWithMicrosoft = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase not configured' }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'email openid profile' },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    setUser(null); setSession(null); setAuthState('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider value={{
      user, session, authState,
      signInWithPhone, verifyOTP,
      signInWithGoogle, signInWithMicrosoft,
      signOut, isConfigured: configured,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
