'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PriceAlert, RecommendationPlan, TickerItem, UserProfile } from '@/types'
import { addAlerts, DEFAULT_PROFILE, loadAlerts, loadProfile, markAlertRead, markAllRead, saveProfile } from '@/lib/storage'
import { buildTickerItems, simulatePriceUpdate } from '@/lib/price-tracker'
import { generateRecommendations } from '@/lib/recommendation-engine'

interface AppContextValue {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
  alerts: PriceAlert[]
  unreadCount: number
  markRead: (id: string) => void
  markAllAlertsRead: () => void
  tickerItems: TickerItem[]
  recommendations: RecommendationPlan | null
  refreshRecommendations: () => void
  isGenerating: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = loadProfile()
    setProfile(saved)
    setAlerts(loadAlerts())
    setTickerItems(buildTickerItems())

    if (saved.setupComplete) {
      setRecommendations(generateRecommendations(saved.budget, saved.location))
    }
  }, [])

  // Price ticker & alert simulation every 30 seconds
  useEffect(() => {
    tickerIntervalRef.current = setInterval(() => {
      setTickerItems(buildTickerItems())
      const newAlerts = simulatePriceUpdate()
      if (newAlerts.length > 0) {
        setAlerts((prev) => {
          const combined = addAlerts(newAlerts)
          return combined
        })
        // Browser notification if permission granted
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          for (const alert of newAlerts) {
            new Notification(`Price Drop! ${alert.productName}`, {
              body: `${alert.supermarketName}: €${alert.oldPrice} → €${alert.newPrice} (${alert.percentOff}% off)`,
              icon: '/favicon.ico',
            })
          }
        }
      }
    }, 30000)

    return () => {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current)
    }
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      saveProfile(next)
      return next
    })
  }, [])

  const refreshRecommendations = useCallback(() => {
    setIsGenerating(true)
    // Small delay to show spinner
    setTimeout(() => {
      setProfile((prev) => {
        const plan = generateRecommendations(prev.budget, prev.location)
        setRecommendations(plan)
        setIsGenerating(false)
        return prev
      })
    }, 600)
  }, [])

  const markRead = useCallback((id: string) => {
    markAlertRead(id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }, [])

  const markAllAlertsRead = useCallback(() => {
    markAllRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  }, [])

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        alerts,
        unreadCount,
        markRead,
        markAllAlertsRead,
        tickerItems,
        recommendations,
        refreshRecommendations,
        isGenerating,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
