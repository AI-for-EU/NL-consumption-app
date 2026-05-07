'use client'

import { useState, useEffect, useRef } from 'react'
import { BasketItem, ShoppingBasket, StoreBasket } from '@/types'
import { optimizeBasket } from '@/lib/basket-optimizer'
import { findProductId, parseQuantityAndItem } from '@/data/productMap'
import { PRODUCT_MAP } from '@/data/products'
import { SUPERMARKETS } from '@/data/supermarkets'
import { recordPurchase } from '@/lib/consumption-tracker'
import { Plus, X, Check, ShoppingCart, Zap, TrendingDown, RefreshCw, MapPin, ExternalLink, AlertCircle, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const BASKET_KEY = 'nl_current_basket'

function loadBasket(): ShoppingBasket | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(BASKET_KEY) ?? 'null') } catch { return null }
}
function saveBasket(b: ShoppingBasket) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BASKET_KEY, JSON.stringify(b))
}
function newBasket(): ShoppingBasket {
  return { id: Date.now().toString(), name: 'My Shopping List', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
}

interface Props { externalItems?: string[] }

export default function BasketBuilder({ externalItems }: Props) {
  const [basket, setBasket] = useState<ShoppingBasket>(newBasket)
  const [input, setInput] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [view, setView] = useState<'list' | 'optimized'>('list')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = loadBasket()
    if (saved) setBasket(saved)
  }, [])

  // Accept items from voice agent
  useEffect(() => {
    if (!externalItems?.length) return
    setBasket((prev) => {
      const next = addItemsToBasket(prev, externalItems)
      saveBasket(next)
      return next
    })
    if (externalItems.length > 0) setView('list')
  }, [externalItems])

  function update(b: ShoppingBasket) {
    const next = { ...b, updatedAt: new Date().toISOString() }
    setBasket(next); saveBasket(next)
  }

  function addItemsToBasket(b: ShoppingBasket, inputs: string[]): ShoppingBasket {
    const newItems: BasketItem[] = []
    for (const raw of inputs) {
      const { quantity, unit, name } = parseQuantityAndItem(raw)
      const productId = findProductId(name) ?? undefined
      const product = productId ? PRODUCT_MAP[productId] : null
      const existing = b.items.find((i) => i.name === name || i.productId === productId)
      if (existing) {
        existing.quantity += quantity
        continue
      }
      newItems.push({
        id: Date.now().toString() + Math.random(),
        name,
        quantity,
        unit: unit === 'x' ? (product ? product.unit.replace('per ', '') : 'x') : unit,
        productId: productId ?? undefined,
        addedBy: 'You',
        addedAt: new Date().toISOString(),
        bought: false,
        estimatedPrice: product ? Math.min(...Object.values(product.prices).filter(Boolean).map((e) => e!.price)) : undefined,
      })
    }
    return { ...b, items: [...b.items, ...newItems] }
  }

  function handleAdd() {
    if (!input.trim()) return
    const updated = addItemsToBasket(basket, [input.trim()])
    update(updated)
    setInput('')
    inputRef.current?.focus()
  }

  function removeItem(id: string) {
    update({ ...basket, items: basket.items.filter((i) => i.id !== id) })
  }

  function toggleBought(id: string) {
    update({
      ...basket,
      items: basket.items.map((i) =>
        i.id === id
          ? { ...i, bought: !i.bought, boughtAt: !i.bought ? new Date().toISOString() : undefined }
          : i
      ),
    })
  }

  function clearBought() {
    // Record bought items to consumption history
    const bought = basket.items.filter((i) => i.bought && i.productId)
    for (const item of bought) {
      const product = PRODUCT_MAP[item.productId!]
      if (product) {
        recordPurchase({
          id: Date.now().toString() + item.id,
          productId: item.productId!,
          productName: item.name,
          productEmoji: product.emoji,
          quantity: item.quantity,
          pricePerUnit: item.estimatedPrice ?? 0,
          supermarketId: item.bestStoreId ?? 'ah',
          purchasedAt: new Date().toISOString(),
        })
      }
    }
    update({ ...basket, items: basket.items.filter((i) => !i.bought) })
  }

  function handleOptimize() {
    setOptimizing(true)
    setTimeout(() => {
      const opt = optimizeBasket(basket.items)
      update({ ...basket, optimization: opt })
      setView('optimized')
      setOptimizing(false)
    }, 700)
  }

  function clearAll() {
    const empty = newBasket()
    setBasket(empty); saveBasket(empty); setView('list')
  }

  const activeItems = basket.items.filter((i) => !i.bought)
  const boughtItems = basket.items.filter((i) => i.bought)
  const opt = basket.optimization

  return (
    <div className="space-y-4">
      {/* Add item input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Type an item: '2L milk', '500g chicken', 'brood'…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-1.5"
          >
            <Plus size={16} /> Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 pl-1">
          Supports Dutch & English: milk/melk, kip/chicken, brood/bread, etc.
        </p>
      </div>

      {/* View toggle + actions */}
      {basket.items.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['list', 'optimized'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {v === 'list' ? '📋 List' : '⚡ Optimised'}
              </button>
            ))}
          </div>
          <button
            onClick={handleOptimize}
            disabled={optimizing || activeItems.length === 0}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            {optimizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {optimizing ? 'Optimising…' : 'Optimise basket'}
          </button>
          {boughtItems.length > 0 && (
            <button onClick={clearBought} className="flex items-center gap-1 text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl hover:bg-green-100 transition">
              <Check size={14} /> Done shopping ({boughtItems.length})
            </button>
          )}
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition ml-auto">
            <Trash2 size={12} /> Clear all
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-3">
          {basket.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
              <div className="text-5xl">🛒</div>
              <p className="font-semibold text-gray-700">Your basket is empty</p>
              <p className="text-sm text-gray-400">Type items above or use the voice button 🎤 to add by speaking</p>
            </div>
          ) : (
            <>
              {activeItems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {activeItems.map((item) => (
                    <BasketItemRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
                  ))}
                </div>
              )}
              {boughtItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">In basket ✓</p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 opacity-60">
                    {boughtItems.map((item) => (
                      <BasketItemRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* OPTIMISED VIEW */}
      {view === 'optimized' && opt && (
        <div className="space-y-4">
          {/* Headline savings */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <p className="text-green-100 text-sm">Basket optimised for {opt.totalItems} items</p>
            <p className="text-3xl font-bold mt-1">
              €{(opt.splitStores.length > 0
                ? opt.splitStores.reduce((s, st) => s + st.estimatedTotal, 0)
                : opt.singleStoreBest.estimatedTotal
              ).toFixed(2)}
            </p>
            {opt.splitStores.length > 0 && (
              <p className="text-green-200 text-sm mt-1">
                vs €{opt.singleStoreBest.estimatedTotal.toFixed(2)} from {opt.singleStoreBest.supermarket.name} only
                {' '}· save €{(opt.singleStoreBest.estimatedTotal - opt.splitStores.reduce((s, st) => s + st.estimatedTotal, 0)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Option A: Best split */}
          {opt.splitStores.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <TrendingDown size={14} className="text-green-500" /> Best split (recommended)
              </p>
              {opt.splitStores.map((sb) => (
                <StoreBasketCard key={sb.supermarketId} sb={sb} onMarkBought={(ids) => ids.forEach(toggleBought)} />
              ))}
            </div>
          )}

          {/* Option B: Single store */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Or — buy everything at one store</p>
            <StoreBasketCard sb={opt.singleStoreBest} onMarkBought={(ids) => ids.forEach(toggleBought)} />
          </div>

          {/* Unmatched items */}
          {opt.unmatchedItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-1">
                <AlertCircle size={14} /> {opt.unmatchedItems.length} items not in price database
              </div>
              <p className="text-xs text-amber-600">
                {opt.unmatchedItems.join(', ')} — prices not available, buy at any store
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BasketItemRow({ item, onToggle, onRemove }: {
  item: BasketItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const product = item.productId ? PRODUCT_MAP[item.productId] : null
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${item.bought ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          item.bought ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-orange-400'
        }`}
      >
        {item.bought && <Check size={12} className="text-white" />}
      </button>

      <div className="text-xl shrink-0">{product?.emoji ?? '🛒'}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium text-gray-900 capitalize ${item.bought ? 'line-through' : ''}`}>
            {item.name}
          </span>
          <span className="text-xs text-gray-400">×{item.quantity}{item.unit !== 'x' ? ' ' + item.unit : ''}</span>
        </div>
        {item.estimatedPrice && !item.bought && (
          <p className="text-xs text-gray-400">
            ~€{(item.estimatedPrice * item.quantity).toFixed(2)}
            {item.bestStoreId && ` · ${SUPERMARKETS.find((s) => s.id === item.bestStoreId)?.shortName}`}
          </p>
        )}
        <p className="text-xs text-gray-300">added by {item.addedBy}</p>
      </div>

      <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 transition shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}

function StoreBasketCard({ sb, onMarkBought }: { sb: StoreBasket; onMarkBought: (ids: string[]) => void }) {
  const sm = sb.supermarket
  const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(sm.name + ' supermarkt')}/@52.0,5.3,10z`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: sm.bgColor }}>
        <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: sm.color }}>
          {sm.emoji}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{sm.name}</p>
          <p className="text-xs text-gray-500">{sb.items.length} items</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">€{sb.estimatedTotal.toFixed(2)}</p>
          {sb.savings > 0 && <p className="text-xs text-green-600">save €{sb.savings.toFixed(2)}</p>}
        </div>
      </div>

      <div className="px-4 py-3 space-y-1">
        {sb.items.map((item) => {
          const mp = sb.matchedProducts.find((m) => m.item.id === item.id)
          return (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">·</span>
              <span className="flex-1 text-gray-700 capitalize">{item.name}</span>
              <span className="text-gray-400 text-xs">×{item.quantity}</span>
              {mp && <span className="text-gray-600 font-medium">€{(mp.price * item.quantity).toFixed(2)}</span>}
            </div>
          )
        })}
      </div>

      <div className="px-4 pb-3 flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
        >
          <MapPin size={12} /> Get directions
        </a>
        <button
          onClick={() => onMarkBought(sb.items.map((i) => i.id))}
          className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl hover:bg-green-100 transition"
        >
          <Check size={12} /> Mark all bought
        </button>
      </div>
    </div>
  )
}
