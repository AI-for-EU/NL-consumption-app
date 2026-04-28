import { LoyaltyCard, PriceAlert, UserBudget, UserProfile, LifestyleBudget } from '@/types'

const PROFILE_KEY = 'nl_budget_profile'
const ALERTS_KEY = 'nl_budget_alerts'
const LOYALTY_KEY = 'nl_loyalty_cards'

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

export const DEFAULT_LIFESTYLE_BUDGET: LifestyleBudget = {
  rent_housing: 900,
  eating_out: 100,
  travel_transport: 80,
  utilities: 150,
  entertainment: 50,
  healthcare: 30,
  subscriptions: 40,
  shopping_fashion: 80,
  education: 0,
  savings_goal: 200,
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  city: '',
  location: null,
  budget: DEFAULT_BUDGET,
  lifestyleBudget: DEFAULT_LIFESTYLE_BUDGET,
  loyaltyCards: [],
  householdSize: 2,
  dietaryPreferences: [],
  setupComplete: false,
}

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      lifestyleBudget: { ...DEFAULT_LIFESTYLE_BUDGET, ...(parsed.lifestyleBudget ?? {}) },
      loyaltyCards: parsed.loyaltyCards ?? [],
    }
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
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(-50)))
}

export function addAlerts(newAlerts: PriceAlert[]): PriceAlert[] {
  const existing = loadAlerts()
  const combined = [...existing, ...newAlerts]
  saveAlerts(combined)
  return combined
}

export function markAlertRead(id: string): void {
  const alerts = loadAlerts()
  saveAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)))
}

export function markAllRead(): void {
  saveAlerts(loadAlerts().map((a) => ({ ...a, read: true })))
}

export function loadLoyaltyCards(): LoyaltyCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOYALTY_KEY)
    return raw ? (JSON.parse(raw) as LoyaltyCard[]) : []
  } catch {
    return []
  }
}

export function saveLoyaltyCards(cards: LoyaltyCard[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOYALTY_KEY, JSON.stringify(cards))
}
