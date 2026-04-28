import { PRODUCTS } from '@/data/products'
import { SUPERMARKET_MAP } from '@/data/supermarkets'
import { PriceAlert, Product, TickerItem } from '@/types'

let mockPrices: Record<string, Record<string, number>> = {}

function initMockPrices() {
  if (Object.keys(mockPrices).length > 0) return
  for (const product of PRODUCTS) {
    mockPrices[product.id] = {}
    for (const [smId, entry] of Object.entries(product.prices)) {
      if (entry) mockPrices[product.id][smId] = entry.price
    }
  }
}

function getCurrentPrice(productId: string, smId: string): number {
  initMockPrices()
  return mockPrices[productId]?.[smId] ?? 0
}

export function simulatePriceUpdate(): PriceAlert[] {
  initMockPrices()
  const alerts: PriceAlert[] = []
  const now = new Date().toISOString()

  // Randomly update 2-4 products
  const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 3)

  for (const product of shuffled) {
    const smIds = Object.keys(product.prices)
    if (!smIds.length) continue
    const smId = smIds[Math.floor(Math.random() * smIds.length)]
    const oldPrice = getCurrentPrice(product.id, smId)
    if (!oldPrice) continue

    // 70% chance of price drop, 30% increase
    const direction = Math.random() < 0.7 ? -1 : 1
    const changePct = (Math.random() * 0.15 + 0.03) * direction // 3–18%
    const newPrice = Math.round(Math.max(oldPrice * (1 + changePct), 0.09) * 100) / 100

    if (newPrice === oldPrice) continue
    mockPrices[product.id][smId] = newPrice

    const pctChange = ((newPrice - oldPrice) / oldPrice) * 100
    const sm = SUPERMARKET_MAP[smId]
    if (!sm) continue

    // Only alert on significant drops (>3%)
    if (pctChange < -3) {
      alerts.push({
        id: `${product.id}-${smId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        productId: product.id,
        productName: product.name,
        productEmoji: product.emoji,
        supermarketId: smId,
        supermarketName: sm.name,
        supermarketColor: sm.color,
        oldPrice,
        newPrice,
        savingsAmount: Math.round((oldPrice - newPrice) * 100) / 100,
        percentOff: Math.abs(Math.round(pctChange * 10) / 10),
        offerLabel: Math.random() > 0.5 ? 'Weekly Special' : undefined,
        category: product.category,
        timestamp: now,
        read: false,
      })
    }
  }

  return alerts
}

export function buildTickerItems(): TickerItem[] {
  initMockPrices()
  const items: TickerItem[] = []

  const selected = [...PRODUCTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12)

  for (const product of selected) {
    const smIds = Object.keys(product.prices)
    if (!smIds.length) continue
    const smId = smIds[Math.floor(Math.random() * smIds.length)]
    const current = getCurrentPrice(product.id, smId)
    const original = product.prices[smId]?.originalPrice ?? current
    const change = Math.round((current - original) * 100) / 100
    const sm = SUPERMARKET_MAP[smId]
    if (!sm) continue

    items.push({
      id: `${product.id}-${smId}`,
      supermarketShort: sm.shortName,
      supermarketColor: sm.color,
      productName: `${product.emoji} ${product.name} (${product.unitSize})`,
      price: current,
      change,
      direction: change < 0 ? 'down' : change > 0 ? 'up' : 'same',
      offerLabel: product.prices[smId]?.discountLabel,
    })
  }

  return items
}

export function getLivePrice(productId: string, smId: string): number {
  initMockPrices()
  return mockPrices[productId]?.[smId] ?? 0
}

export function getAllLivePrices(): typeof mockPrices {
  initMockPrices()
  return mockPrices
}
