'use client'

import { useState } from 'react'
import { PRODUCTS } from '@/data/products'
import { SUPERMARKETS } from '@/data/supermarkets'
import { CATEGORIES } from '@/data/categories'
import { CategoryId } from '@/types'
import { TrendingDown, Tag, Search } from 'lucide-react'

export default function PriceComparison() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'cheapest'>('name')

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }).sort((a, b) => {
    if (sortBy === 'cheapest') {
      const aMin = Math.min(...Object.values(a.prices).map((e) => e?.price ?? Infinity))
      const bMin = Math.min(...Object.values(b.prices).map((e) => e?.price ?? Infinity))
      return aMin - bMin
    }
    return a.name.localeCompare(b.name)
  })

  function getCheapestSm(product: (typeof PRODUCTS)[0]) {
    let minPrice = Infinity
    let minSmId = ''
    for (const [smId, entry] of Object.entries(product.prices)) {
      if (entry?.inStock && entry.price < minPrice) {
        minPrice = entry.price
        minSmId = smId
      }
    }
    return minSmId
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              selectedCategory === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          {(['name', 'cheapest'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                sortBy === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {s === 'name' ? 'A–Z' : 'Cheapest first'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[200px]">Product</th>
                {SUPERMARKETS.map((sm) => (
                  <th key={sm.id} className="text-center px-3 py-3 font-medium min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg leading-none">{sm.emoji}</span>
                      <span className="text-xs" style={{ color: sm.textColor }}>{sm.shortName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => {
                const cheapestSmId = getCheapestSm(product)
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{product.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-400">{product.unitSize}</div>
                        </div>
                      </div>
                    </td>
                    {SUPERMARKETS.map((sm) => {
                      const entry = product.prices[sm.id]
                      const isCheapest = sm.id === cheapestSmId
                      return (
                        <td key={sm.id} className="px-3 py-3 text-center">
                          {entry ? (
                            <div className="space-y-0.5">
                              <div
                                className={`font-semibold text-sm ${
                                  isCheapest ? 'text-green-600' : 'text-gray-700'
                                }`}
                              >
                                {isCheapest && (
                                  <TrendingDown size={10} className="inline mr-0.5 text-green-500" />
                                )}
                                €{entry.price.toFixed(2)}
                              </div>
                              {entry.originalPrice && (
                                <div className="text-xs text-gray-400 line-through">
                                  €{entry.originalPrice.toFixed(2)}
                                </div>
                              )}
                              {entry.discountLabel && (
                                <div className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 text-xs px-1 py-0.5 rounded font-medium">
                                  <Tag size={8} /> {entry.discountLabel}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {filtered.length} products shown · Prices refresh every 30s · 🟢 = cheapest
      </p>
    </div>
  )
}
