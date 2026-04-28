import { PriceAlert, UserBudget, UserProfile } from '@/types'

const PROFILE_KEY = 'nl_budget_profile'
const ALERTS_KEY = 'nl_budget_alerts'

export const DEFAULT_BUDGET: UserBudget = {
  dairy: 40,
  bread_bakery: 25,
  meat_fish: 60,
  fruits_veg: 35,
  pantry: 30,
  beverages: 25,
  frozen: 20,
  personal_care: 15,
  household: 20,
  snacks: 15,
  clothing: 50,
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  city: '',
  location: null,
  budget: DEFAULT_BUDGET,
  householdSize: 2,
  dietaryPreferences: [],
  setupComplete: false,
}

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function loadAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ALERTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PriceAlert[]
  } catch {
    return []
  }
}

export function saveAlerts(alerts: PriceAlert[]): void {
  if (typeof window === 'undefined') return
  // Keep last 50 alerts
  const trimmed = alerts.slice(-50)
  localStorage.setItem(ALERTS_KEY, JSON.stringify(trimmed))
}

export function addAlerts(newAlerts: PriceAlert[]): PriceAlert[] {
  const existing = loadAlerts()
  const combined = [...existing, ...newAlerts]
  saveAlerts(combined)
  return combined
}

export function markAlertRead(id: string): void {
  const alerts = loadAlerts()
  const updated = alerts.map((a) => (a.id === id ? { ...a, read: true } : a))
  saveAlerts(updated)
}

export function markAllRead(): void {
  const alerts = loadAlerts()
  saveAlerts(alerts.map((a) => ({ ...a, read: true })))
}
