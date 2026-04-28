import { PRODUCTS } from '@/data/products'
import { SUPERMARKETS } from '@/data/supermarkets'
import { CategoryId, GeoLocation, RecommendationPlan, ShoppingRecommendation, UserBudget } from '@/types'
import { nearestStore } from './geolocation'

const CATEGORY_WEEKLY_BASKETS: Record<CategoryId, string[]> = {
  dairy:        ['milk-full-1l', 'butter-250g', 'eggs-6pk', 'cheese-gouda-500g', 'yogurt-greek-500g'],
  bread_bakery: ['bread-whole-wheat', 'beschuit-pack', 'croissants-4pk'],
  meat_fish:    ['chicken-breast-500g', 'beef-mince-500g', 'deli-ham-150g', 'tuna-canned-185g', 'salmon-fillet-300g'],
  fruits_veg:   ['apples-1kg', 'bananas-1kg', 'tomatoes-500g', 'cucumber-1pcs', 'broccoli-1pcs'],
  pantry:       ['pasta-spaghetti-500g', 'rice-basmati-1kg', 'tomato-sauce-500ml', 'olive-oil-500ml', 'cornflakes-500g'],
  beverages:    ['oj-1l', 'coffee-beans-500g', 'water-sparkling-1-5l'],
  frozen:       ['frozen-pizza-400g', 'frozen-fries-1kg'],
  personal_care:['shampoo-400ml', 'toothpaste-100ml'],
  household:    ['laundry-1-5l', 'toilet-paper-8pk'],
  snacks:       ['stroopwafels-8pk', 'chips-200g'],
}

// Weekly multiplier: how many times per month do we buy each basket item
const CATEGORY_MONTHLY_FREQ: Record<CategoryId, number> = {
  dairy: 4,
  bread_bakery: 4,
  meat_fish: 3,
  fruits_veg: 4,
  pantry: 1.5,
  beverages: 2,
  frozen: 2,
  personal_care: 0.5,
  household: 0.5,
  snacks: 2,
}

function cheapestSupermarketForCategory(categoryId: CategoryId): { id: string; monthlyCost: number } {
  const productIds = CATEGORY_WEEKLY_BASKETS[categoryId] ?? []
  const freq = CATEGORY_MONTHLY_FREQ[categoryId] ?? 1

  const supermarketCosts: Record<string, number> = {}
  for (const smId of SUPERMARKETS.map((s) => s.id)) {
    let total = 0
    let covered = 0
    for (const pid of productIds) {
      const product = PRODUCTS.find((p) => p.id === pid)
      if (!product) continue
      const entry = product.prices[smId]
      if (entry?.inStock) {
        total += entry.price
        covered++
      }
    }
    // Only consider supermarkets covering at least 60% of the basket
    if (covered / productIds.length >= 0.6) {
      supermarketCosts[smId] = (total / covered) * productIds.length * freq
    }
  }

  const best = Object.entries(supermarketCosts).sort((a, b) => a[1] - b[1])[0]
  return best ? { id: best[0], monthlyCost: best[1] } : { id: 'ah', monthlyCost: 0 }
}

function premiumSupermarketCostForCategory(categoryId: CategoryId): number {
  const productIds = CATEGORY_WEEKLY_BASKETS[categoryId] ?? []
  const freq = CATEGORY_MONTHLY_FREQ[categoryId] ?? 1
  const premiumSm = 'ah'
  let total = 0
  let covered = 0
  for (const pid of productIds) {
    const product = PRODUCTS.find((p) => p.id === pid)
    if (!product) continue
    const entry = product.prices[premiumSm]
    if (entry?.inStock) {
      total += entry.price
      covered++
    }
  }
  if (covered === 0) return 0
  return (total / covered) * productIds.length * freq
}

export function generateRecommendations(
  budget: UserBudget,
  location: GeoLocation | null
): RecommendationPlan {
  const categories = Object.keys(CATEGORY_WEEKLY_BASKETS) as CategoryId[]

  // Find cheapest supermarket per category
  const categoryAssignments: Record<CategoryId, string> = {} as Record<CategoryId, string>
  const categoryCosts: Record<CategoryId, number> = {} as Record<CategoryId, number>

  for (const cat of categories) {
    const result = cheapestSupermarketForCategory(cat)
    categoryAssignments[cat] = result.id
    categoryCosts[cat] = result.monthlyCost
  }

  // Group categories by supermarket
  const smCategories: Record<string, CategoryId[]> = {}
  for (const [cat, smId] of Object.entries(categoryAssignments)) {
    if (!smCategories[smId]) smCategories[smId] = []
    smCategories[smId].push(cat as CategoryId)
  }

  // Build recommendation objects
  const recommendations: ShoppingRecommendation[] = []
  let totalMonthly = 0
  let baselineMonthly = 0

  for (const cat of categories) {
    baselineMonthly += premiumSupermarketCostForCategory(cat)
  }

  for (const [smId, cats] of Object.entries(smCategories)) {
    const supermarket = SUPERMARKETS.find((s) => s.id === smId)
    if (!supermarket) continue

    const monthlyEstimate = cats.reduce((sum, cat) => sum + categoryCosts[cat], 0)
    const baselineForCats = cats.reduce(
      (sum, cat) => sum + premiumSupermarketCostForCategory(cat),
      0
    )
    const savings = baselineForCats - monthlyEstimate

    let distanceKm: number | null = null
    if (location) {
      const nearestResult = nearestStore(location, supermarket)
      distanceKm = nearestResult?.distanceKm ?? null
    }

    const topProductIds = cats
      .flatMap((c) => CATEGORY_WEEKLY_BASKETS[c] ?? [])
      .slice(0, 5)
    const topProducts = topProductIds
      .map((pid) => PRODUCTS.find((p) => p.id === pid))
      .filter(Boolean) as (typeof PRODUCTS)[0][]

    const reasons = buildReasons(supermarket, cats, savings)

    recommendations.push({
      supermarketId: smId,
      supermarket,
      assignedCategories: cats,
      topProducts,
      weeklyEstimate: Math.round((monthlyEstimate / 4) * 100) / 100,
      monthlyEstimate: Math.round(monthlyEstimate * 100) / 100,
      distanceKm,
      savingsVsBaseline: Math.round(savings * 100) / 100,
      reasons,
    })

    totalMonthly += monthlyEstimate
  }

  // Sort: most assigned categories first
  recommendations.sort((a, b) => b.assignedCategories.length - a.assignedCategories.length)

  return {
    recommendations,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalSavings: Math.round((baselineMonthly - totalMonthly) * 100) / 100,
    baselineMonthly: Math.round(baselineMonthly * 100) / 100,
    generatedAt: new Date().toISOString(),
  }
}

function buildReasons(
  supermarket: (typeof SUPERMARKETS)[0],
  cats: CategoryId[],
  savings: number
): string[] {
  const reasons: string[] = []
  const catLabels: Record<CategoryId, string> = {
    dairy: 'dairy',
    bread_bakery: 'bakery items',
    meat_fish: 'meat & fish',
    fruits_veg: 'fresh produce',
    pantry: 'pantry staples',
    beverages: 'beverages',
    frozen: 'frozen foods',
    personal_care: 'personal care',
    household: 'household items',
    snacks: 'snacks',
  }

  if (savings > 0) {
    reasons.push(`Save ~€${savings.toFixed(0)}/month vs Albert Heijn`)
  }
  for (const strength of supermarket.strengths.slice(0, 2)) {
    const map: Record<string, string> = {
      fresh_produce: 'Excellent fresh produce quality',
      deli: 'Great deli & specialty cheese selection',
      organic: 'Wide organic range',
      meat: 'High-quality meat counter',
      bakery: 'Fresh in-store bakery',
      family_packs: 'Great family-size packs',
      own_brand: 'Strong budget own-brand range',
      weekly_offers: 'Rotating weekly specials',
      price: 'Consistently lowest prices',
      fish: 'Outstanding fresh fish counter',
      seafood: 'Great seafood selection',
      urban: 'Convenient city-centre locations',
    }
    if (map[strength]) reasons.push(map[strength])
  }
  if (cats.length > 0) {
    const catStr = cats.map((c) => catLabels[c]).join(', ')
    reasons.push(`Best value for: ${catStr}`)
  }
  return reasons.slice(0, 3)
}
