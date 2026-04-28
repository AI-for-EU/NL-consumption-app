'use client'

import { useState, useEffect, useRef } from 'react'
import { PRODUCTS } from '@/data/products'
import { SUPERMARKETS } from '@/data/supermarkets'
import { CATEGORY_MAP } from '@/data/categories'
import { Product } from '@/types'
import { Search, X, TrendingDown, Clock, SlidersHorizontal } from 'lucide-react'

const RECENT_KEY = 'nl_recent_searches'

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(term: string) {
  if (typeof window === 'undefined') return
  const prev = getRecent().filter((s) => s !== term)
  localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, 8)))
}

export default function SearchProducts() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRecent(getRecent())
    inputRef.current?.focus()
  }, [])

  function doSearch(term: string) {
    const q = term.trim().toLowerCase()
    setQuery(term)
    setSearched(true)
    if (!q) { setResults([]); setSearched(false); return }
    saveRecent(term.trim())
    setRecent(getRecent())
    const found = PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        CATEGORY_MAP[p.category]?.label.toLowerCase().includes(q)
    )
    setResults(found)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setSearched(false)
    inputRef.current?.focus()
  }

  function getCheapestEntry(product: Product) {
    let minPrice = Infinity
    let minSmId = ''
    for (const [smId, entry] of Object.entries(product.prices)) {
      if (entry?.inStock && entry.price < minPrice) {
        minPrice = entry.price
        minSmId = smId
      }
    }
    return { smId: minSmId, price: minPrice === Infinity ? null : minPrice }
  }

  function getMostExpensive(product: Product) {
    return Math.max(...Object.values(product.prices).filter(Boolean).map((e) => e!.price))
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => doSearch(e.target.value)}
          placeholder="Search milk, broccoli, shampoo, Albert Heijn..."
          className="w-full pl-11 pr-11 py-4 bg-white border border-gray-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Recent searches */}
      {!searched && recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                onClick={() => doSearch(term)}
                className="flex items-center gap-1.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-gray-700 hover:text-orange-600 text-sm px-3 py-1.5 rounded-xl transition"
              >
                <Search size={12} /> {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick categories */}
      {!searched && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Browse by category</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(CATEGORY_MAP).map((cat) => (
              <button
                key={cat.id}
                onClick={() => doSearch(cat.label)}
                className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-orange-200 bg-gray-50 hover:bg-orange-50 transition text-left"
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-2">
          <div className="text-4xl">🔍</div>
          <p className="font-semibold text-gray-700">No products found for "{query}"</p>
          <p className="text-sm text-gray-400">Try searching for milk, cheese, chicken, pasta…</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 px-1">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>
          <div className="space-y-3">
            {results.map((product) => {
              const { smId: cheapSmId, price: cheapPrice } = getCheapestEntry(product)
              const maxPrice = getMostExpensive(product)
              const cheapSm = SUPERMARKETS.find((s) => s.id === cheapSmId)
              const savings = cheapPrice !== null ? Math.round((maxPrice - cheapPrice) * 100) / 100 : 0
              const cat = CATEGORY_MAP[product.category]

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Product header */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100">
                      {product.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: cat?.color + '18', color: cat?.color }}
                        >
                          {cat?.icon} {cat?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{product.unitSize} · {product.subcategory}</p>
                    </div>
                    {cheapSm && cheapPrice !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Best price</p>
                        <p className="font-bold text-green-600 text-lg">€{cheapPrice.toFixed(2)}</p>
                        <p className="text-xs font-medium" style={{ color: cheapSm.color }}>
                          {cheapSm.shortName}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Price grid */}
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                      {SUPERMARKETS.map((sm) => {
                        const entry = product.prices[sm.id]
                        const isCheapest = sm.id === cheapSmId
                        return (
                          <div
                            key={sm.id}
                            className={`rounded-xl p-2 text-center border transition-all ${
                              isCheapest
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-100 bg-gray-50'
                            }`}
                          >
                            <div className="text-sm mb-0.5">{sm.emoji}</div>
                            <div className="text-xs font-medium text-gray-500 mb-1">{sm.shortName}</div>
                            {entry ? (
                              <>
                                <div className={`text-sm font-bold ${isCheapest ? 'text-green-600' : 'text-gray-700'}`}>
                                  €{entry.price.toFixed(2)}
                                </div>
                                {entry.discountLabel && (
                                  <div className="text-[10px] text-red-500 font-medium mt-0.5">{entry.discountLabel}</div>
                                )}
                                {isCheapest && <TrendingDown size={10} className="text-green-500 mx-auto mt-0.5" />}
                              </>
                            ) : (
                              <div className="text-xs text-gray-300">—</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {savings > 0 && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
                        <TrendingDown size={12} />
                        Buy at <strong>{cheapSm?.name}</strong> and save €{savings.toFixed(2)} vs most expensive option
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
