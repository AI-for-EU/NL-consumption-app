'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import { Suspense } from 'react'

function LoginInner() {
  const { authState } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')

  useEffect(() => {
    if (authState === 'authenticated') router.replace('/')
  }, [authState, router])

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {errorMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600 text-center shadow">
          {decodeURIComponent(errorMsg)}
        </div>
      )}
      <AuthScreen onSuccess={() => router.replace('/')} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
