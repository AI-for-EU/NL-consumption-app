import { ConsumptionPattern, PurchaseRecord } from '@/types'

const PURCHASES_KEY = 'nl_purchase_history'

export function loadPurchases(): PurchaseRecord[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(PURCHASES_KEY) ?? '[]') } catch { return [] }
}

export function savePurchases(records: PurchaseRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(records.slice(-200)))
}

export function recordPurchase(record: PurchaseRecord) {
  const prev = loadPurchases()
  savePurchases([...prev, record])
}

export function computePatterns(): ConsumptionPattern[] {
  const purchases = loadPurchases()
  if (!purchases.length) return []

  // Group by productId
  const byProduct: Record<string, PurchaseRecord[]> = {}
  for (const p of purchases) {
    if (!byProduct[p.productId]) byProduct[p.productId] = []
    byProduct[p.productId].push(p)
  }

  const patterns: ConsumptionPattern[] = []
  const now = new Date()

  for (const [productId, records] of Object.entries(byProduct)) {
    const sorted = [...records].sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    )

    const last = sorted[sorted.length - 1]
    const lastDate = new Date(last.purchasedAt)

    // Calculate average gap between purchases
    let avgDays = 7 // default
    if (sorted.length >= 2) {
      const gaps: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        const gapMs = new Date(sorted[i].purchasedAt).getTime() - new Date(sorted[i - 1].purchasedAt).getTime()
        gaps.push(gapMs / 86400000)
      }
      avgDays = gaps.reduce((a, b) => a + b, 0) / gaps.length
    }

    const avgQty =
      sorted.reduce((s, r) => s + r.quantity, 0) / sorted.length

    const nextDate = new Date(lastDate.getTime() + avgDays * 86400000)
    const daysUntilNext = (nextDate.getTime() - now.getTime()) / 86400000

    patterns.push({
      productId,
      productName: last.productName,
      productEmoji: last.productEmoji,
      averageDaysBetweenPurchases: Math.round(avgDays),
      lastPurchasedAt: last.purchasedAt,
      lastPrice: last.pricePerUnit,
      lastSupermarketId: last.supermarketId,
      estimatedNextPurchase: nextDate.toISOString(),
      averageQuantityPerTrip: Math.round(avgQty * 10) / 10,
      urgency: daysUntilNext < 0 ? 'overdue' : daysUntilNext < 3 ? 'due-soon' : 'ok',
    })
  }

  return patterns.sort((a, b) => {
    const order = { overdue: 0, 'due-soon': 1, ok: 2 }
    return order[a.urgency] - order[b.urgency]
  })
}

export function seedDemoData() {
  const demo: PurchaseRecord[] = [
    { id: '1', productId: 'milk-full-1l',      productName: 'Full-fat Milk',   productEmoji: '🥛', quantity: 2, pricePerUnit: 0.89, supermarketId: 'lidl',  purchasedAt: daysAgo(5) },
    { id: '2', productId: 'eggs-6pk',           productName: 'Free-range Eggs', productEmoji: '🥚', quantity: 1, pricePerUnit: 1.79, supermarketId: 'lidl',  purchasedAt: daysAgo(5) },
    { id: '3', productId: 'bread-whole-wheat',  productName: 'Whole Wheat Bread',productEmoji:'🍞', quantity: 1, pricePerUnit: 1.59, supermarketId: 'lidl',  purchasedAt: daysAgo(5) },
    { id: '4', productId: 'chicken-breast-500g',productName: 'Chicken Breast',  productEmoji: '🍗', quantity: 1, pricePerUnit: 4.29, supermarketId: 'lidl',  purchasedAt: daysAgo(8) },
    { id: '5', productId: 'milk-full-1l',       productName: 'Full-fat Milk',   productEmoji: '🥛', quantity: 2, pricePerUnit: 0.85, supermarketId: 'aldi',  purchasedAt: daysAgo(12) },
    { id: '6', productId: 'eggs-6pk',           productName: 'Free-range Eggs', productEmoji: '🥚', quantity: 1, pricePerUnit: 1.69, supermarketId: 'aldi',  purchasedAt: daysAgo(12) },
    { id: '7', productId: 'bread-whole-wheat',  productName: 'Whole Wheat Bread',productEmoji:'🍞', quantity: 2, pricePerUnit: 1.49, supermarketId: 'aldi',  purchasedAt: daysAgo(12) },
    { id: '8', productId: 'cheese-gouda-500g',  productName: 'Gouda Cheese',    productEmoji: '🧀', quantity: 1, pricePerUnit: 4.29, supermarketId: 'lidl',  purchasedAt: daysAgo(15) },
    { id: '9', productId: 'pasta-spaghetti-500g',productName: 'Spaghetti',      productEmoji: '🍝', quantity: 2, pricePerUnit: 0.99, supermarketId: 'lidl',  purchasedAt: daysAgo(20) },
    { id:'10', productId: 'coffee-beans-500g',  productName: 'Arabica Coffee',  productEmoji: '☕', quantity: 1, pricePerUnit: 5.99, supermarketId: 'aldi',  purchasedAt: daysAgo(18) },
  ]
  if (loadPurchases().length === 0) savePurchases(demo)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
