export interface GeoLocation {
  lat: number
  lng: number
  city: string
  address?: string
}

export interface StoreLocation extends GeoLocation {
  storeId: string
  openHours: string
}

export type SupermarketTier = 'budget' | 'mid' | 'premium'

export interface Supermarket {
  id: string
  name: string
  shortName: string
  color: string
  bgColor: string
  textColor: string
  emoji: string
  description: string
  tier: SupermarketTier
  strengths: string[]
  website: string
  locations: StoreLocation[]
}

export type CategoryId =
  | 'dairy'
  | 'bread_bakery'
  | 'meat_fish'
  | 'fruits_veg'
  | 'pantry'
  | 'beverages'
  | 'frozen'
  | 'personal_care'
  | 'household'
  | 'snacks'

export interface Category {
  id: CategoryId
  label: string
  icon: string
  color: string
  subcategories: string[]
}

export interface PriceEntry {
  price: number
  originalPrice?: number
  discountLabel?: string
  offerEnds?: string
  lastUpdated: string
  inStock: boolean
}

export interface Product {
  id: string
  name: string
  brand: string
  category: CategoryId
  subcategory: string
  unit: string
  unitSize: string
  emoji: string
  tags: string[]
  prices: Partial<Record<string, PriceEntry>>
}

export interface UserBudget {
  dairy: number
  bread_bakery: number
  meat_fish: number
  fruits_veg: number
  pantry: number
  beverages: number
  frozen: number
  personal_care: number
  household: number
  snacks: number
  clothing: number
}

export interface LifestyleBudget {
  rent_housing: number
  eating_out: number
  travel_transport: number
  utilities: number
  entertainment: number
  healthcare: number
  subscriptions: number
  shopping_fashion: number
  education: number
  savings_goal: number
}

export interface LoyaltyProgram {
  id: string
  name: string
  storeName: string
  color: string
  bgColor: string
  textColor: string
  emoji: string
  cardColor: string
  description: string
  website: string
  appAvailable: boolean
  pointsLabel: string
  euroPer100Points: number
}

export interface LoyaltyCard {
  id: string
  programId: string
  nickname: string
  cardNumber: string
  points: number
  stampsCollected?: number
  stampsRequired?: number
  connected: boolean
  lastSynced: string
}

export interface UserProfile {
  name: string
  city: string
  location: GeoLocation | null
  budget: UserBudget
  lifestyleBudget: LifestyleBudget
  loyaltyCards: LoyaltyCard[]
  householdSize: number
  dietaryPreferences: string[]
  setupComplete: boolean
}

export interface ShoppingRecommendation {
  supermarketId: string
  supermarket: Supermarket
  assignedCategories: CategoryId[]
  topProducts: Product[]
  weeklyEstimate: number
  monthlyEstimate: number
  distanceKm: number | null
  savingsVsBaseline: number
  reasons: string[]
}

export interface RecommendationPlan {
  recommendations: ShoppingRecommendation[]
  totalMonthly: number
  totalSavings: number
  baselineMonthly: number
  generatedAt: string
}

export interface PriceAlert {
  id: string
  productId: string
  productName: string
  productEmoji: string
  supermarketId: string
  supermarketName: string
  supermarketColor: string
  oldPrice: number
  newPrice: number
  savingsAmount: number
  percentOff: number
  offerLabel?: string
  category: CategoryId
  timestamp: string
  read: boolean
}

export interface TickerItem {
  id: string
  supermarketShort: string
  supermarketColor: string
  productName: string
  price: number
  change: number
  direction: 'up' | 'down' | 'same'
  offerLabel?: string
}
