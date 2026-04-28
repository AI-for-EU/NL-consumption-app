'use client'

import { useApp } from '@/context/AppContext'
import { CATEGORY_MAP } from '@/data/categories'
import { CategoryId } from '@/types'
import { TrendingDown, MapPin, RefreshCw, ShoppingBag, Euro, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Recommendations() {
  const { recommendations, refreshRecommendations, isGenerating, profile } = useApp()

  if (!profile.setupComplete) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
        <div className="text-4xl">🛒</div>
        <h3 className="font-bold text-gray-900 text-xl">Set up your budget first</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Tell us your monthly budget and we'll create a personalised shopping plan across Dutch supermarkets.
        </p>
        <Link
          href="/budget"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition"
        >
          Set Up Budget
        </Link>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-500">Optimising your shopping plan...</p>
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
        <AlertCircle className="mx-auto text-gray-400" size={32} />
        <p className="text-gray-500">No recommendations yet.</p>
        <button
          onClick={refreshRecommendations}
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition text-sm"
        >
          <RefreshCw size={16} /> Generate Plan
        </button>
      </div>
    )
  }

  const { recommendations: recs, totalMonthly, totalSavings, baselineMonthly } = recommendations
  const savingsPct = baselineMonthly > 0 ? Math.round((totalSavings / baselineMonthly) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-xl">
              Your Optimal Shopping Plan
              {profile.city && <span className="font-normal text-orange-200"> · {profile.city}</span>}
            </h2>
            <p className="text-orange-100 text-sm mt-1">
              Shop at {recs.length} supermarket{recs.length !== 1 ? 's' : ''} for maximum savings
            </p>
          </div>
          <button
            onClick={refreshRecommendations}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">Monthly total</p>
            <p className="font-bold text-2xl">€{totalMonthly.toFixed(0)}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">Monthly savings</p>
            <p className="font-bold text-2xl text-green-300">€{totalSavings.toFixed(0)}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">vs shopping only at AH</p>
            <p className="font-bold text-2xl text-green-300">{savingsPct}% off</p>
          </div>
        </div>
      </div>

      {/* Per-supermarket cards */}
      <div className="space-y-4">
        {recs.map((rec) => {
          const sm = rec.supermarket
          return (
            <div
              key={rec.supermarketId}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: sm.bgColor }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow"
                    style={{ backgroundColor: sm.color }}
                  >
                    {sm.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{sm.name}</h3>
                    <div className="flex items-center gap-3 text-xs mt-0.5">
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: sm.color + '22', color: sm.textColor }}
                      >
                        {sm.tier}
                      </span>
                      {rec.distanceKm !== null && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <MapPin size={11} /> {rec.distanceKm}km away
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">€{rec.monthlyEstimate.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">/month</p>
                  {rec.savingsVsBaseline > 0 && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-0.5 justify-end mt-0.5">
                      <TrendingDown size={11} /> save €{rec.savingsVsBaseline.toFixed(0)}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Categories assigned */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Buy here</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.assignedCategories.map((catId) => {
                      const cat = CATEGORY_MAP[catId]
                      return cat ? (
                        <span
                          key={catId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                          style={{ backgroundColor: cat.color + '18', color: cat.color }}
                        >
                          {cat.icon} {cat.label}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>

                {/* Top products */}
                {rec.topProducts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Example items</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.topProducts.map((p) => {
                        const priceEntry = p.prices[rec.supermarketId]
                        return (
                          <span key={p.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs">
                            <span>{p.emoji}</span>
                            <span className="text-gray-700 font-medium">{p.name}</span>
                            {priceEntry && (
                              <span className="text-gray-400">€{priceEntry.price.toFixed(2)}</span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Reasons */}
                <div className="flex flex-wrap gap-2">
                  {rec.reasons.map((r, i) => (
                    <span key={i} className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <ShoppingBag size={10} className="text-gray-400" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 flex gap-3">
        <Euro size={20} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
          <strong>Pro tip:</strong> Visit Lidl and Aldi on weekday mornings for the freshest bakery items and the best weekly specials.
          AH Bonus card gives extra savings on selected products — worth activating for regular shoppers.
        </div>
      </div>
    </div>
  )
}
