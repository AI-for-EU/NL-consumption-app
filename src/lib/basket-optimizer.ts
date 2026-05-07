import { PRODUCTS, PRODUCT_MAP } from '@/data/products'
import { SUPERMARKETS } from '@/data/supermarkets'
import { findProductId } from '@/data/productMap'
import { BasketItem, BasketOptimization, StoreBasket } from '@/types'

export function optimizeBasket(items: BasketItem[]): BasketOptimization {
  const unmatchedItems: string[] = []

  // Match items to catalog products
  type Matched = { item: BasketItem; productId: string }
  const matched: Matched[] = []

  for (const item of items.filter((i) => !i.bought)) {
    const pid = item.productId ?? findProductId(item.name)
    if (pid && PRODUCT_MAP[pid]) {
      matched.push({ item: { ...item, productId: pid }, productId: pid })
    } else {
      unmatchedItems.push(item.name)
    }
  }

  if (matched.length === 0) {
    const fallbackSm = SUPERMARKETS[0]
    const empty: StoreBasket = {
      supermarketId: fallbackSm.id,
      supermarket: fallbackSm,
      items: [],
      matchedProducts: [],
      estimatedTotal: 0,
      savings: 0,
    }
    return { singleStoreBest: empty, splitStores: [], theoreticalMin: 0, totalItems: items.length, unmatchedItems, generatedAt: new Date().toISOString() }
  }

  // Calculate theoretical min (each item from cheapest store)
  let theoreticalMin = 0
  for (const { item, productId } of matched) {
    const product = PRODUCT_MAP[productId]
    const prices = Object.values(product.prices).filter(Boolean).map((e) => e!.price)
    const minPrice = Math.min(...prices)
    theoreticalMin += minPrice * item.quantity
  }

  // Calculate cost if all purchased from a single supermarket
  const singleStoreCosts: { id: string; total: number; coverage: number }[] = []
  for (const sm of SUPERMARKETS) {
    let total = 0
    let covered = 0
    for (const { item, productId } of matched) {
      const product = PRODUCT_MAP[productId]
      const entry = product.prices[sm.id]
      if (entry?.inStock) {
        total += entry.price * item.quantity
        covered++
      } else {
        // Fill with cheapest available
        const fallback = Object.values(product.prices).filter(Boolean).sort((a, b) => a!.price - b!.price)[0]
        total += (fallback?.price ?? 0) * item.quantity
      }
    }
    singleStoreCosts.push({ id: sm.id, total, coverage: covered / matched.length })
  }
  singleStoreCosts.sort((a, b) => a.total - b.total)
  const bestSingleId = singleStoreCosts[0].id
  const bestSingleTotal = singleStoreCosts[0].total
  const worstSingleTotal = singleStoreCosts[singleStoreCosts.length - 1].total

  function buildStoreBasket(smId: string, itemsForThisStore: Matched[]): StoreBasket {
    const sm = SUPERMARKETS.find((s) => s.id === smId)!
    let total = 0
    const matchedProducts: StoreBasket['matchedProducts'] = []
    const basketItems: BasketItem[] = []

    for (const { item, productId } of itemsForThisStore) {
      const product = PRODUCT_MAP[productId]
      const entry = product.prices[smId]
      const price = entry?.price ?? 0
      total += price * item.quantity
      matchedProducts.push({ item, price })
      basketItems.push({ ...item, estimatedPrice: price, bestStoreId: smId })
    }

    return {
      supermarketId: smId,
      supermarket: sm,
      items: basketItems,
      matchedProducts,
      estimatedTotal: Math.round(total * 100) / 100,
      savings: Math.round((worstSingleTotal - total) * 100) / 100,
    }
  }

  const singleStoreBest = buildStoreBasket(bestSingleId, matched)

  // Find best 2-store split
  let best2Total = Infinity
  let best2Pair: [string, string] = ['ah', 'lidl']

  for (let i = 0; i < SUPERMARKETS.length; i++) {
    for (let j = i + 1; j < SUPERMARKETS.length; j++) {
      const smA = SUPERMARKETS[i].id
      const smB = SUPERMARKETS[j].id
      let total = 0
      for (const { item, productId } of matched) {
        const product = PRODUCT_MAP[productId]
        const pA = product.prices[smA]?.price ?? Infinity
        const pB = product.prices[smB]?.price ?? Infinity
        total += Math.min(pA, pB) * item.quantity
      }
      if (total < best2Total) { best2Total = total; best2Pair = [smA, smB] }
    }
  }

  // Assign each item to the cheaper of the 2 stores
  const storeAItems: Matched[] = []
  const storeBItems: Matched[] = []
  for (const m of matched) {
    const product = PRODUCT_MAP[m.productId]
    const pA = product.prices[best2Pair[0]]?.price ?? Infinity
    const pB = product.prices[best2Pair[1]]?.price ?? Infinity
    if (pA <= pB) storeAItems.push(m)
    else storeBItems.push(m)
  }

  const splitStores: StoreBasket[] = []
  if (storeAItems.length > 0) splitStores.push(buildStoreBasket(best2Pair[0], storeAItems))
  if (storeBItems.length > 0) splitStores.push(buildStoreBasket(best2Pair[1], storeBItems))

  return {
    singleStoreBest,
    splitStores,
    theoreticalMin: Math.round(theoreticalMin * 100) / 100,
    totalItems: items.length,
    unmatchedItems,
    generatedAt: new Date().toISOString(),
  }
}
