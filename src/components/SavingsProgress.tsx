'use client'

import { useApp } from '@/context/AppContext'
import { CATEGORY_MAP } from '@/data/categories'
import { CategoryId } from '@/types'
import { TrendingDown, Calendar, Target } from 'lucide-react'

const CATEGORY_MONTHLY_BASELINE: Partial<Record<CategoryId, number>> = {
  dairy: 0.95,
  bread_bakery: 0.85,
  meat_fish: 0.82,
  fruits_veg: 0.88,
  pantry: 0.75,
  beverages: 0.80,
  frozen: 0.78,
  personal_care: 0.72,
  household: 0.70,
  snacks: 0.85,
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export default function SavingsProgress() {
  const { profile, recommendations } = useApp()
  const today = new Date()
  const dayOfMonth = today.getDate()
  const daysInMonth = getDaysInMonth(today)
  const fractionPassed = dayOfMonth / daysInMonth
  const daysLeft = daysInMonth - dayOfMonth

  const groceryBudget = profile.budget
    ? Object.values(profile.budget).reduce((a, b) => a + b, 0)
    : 0

  const lifestyleBudget = profile.lifestyleBudget
    ? Object.values(profile.lifestyleBudget).reduce((a, b) => a + b, 0)
    : 0

  const totalBudget = groceryBudget + lifestyleBudget

  // Estimated spend so far = monthly plan estimate × fraction of month passed
  const estimatedMonthlySpend = recommendations
    ? recommendations.totalMonthly + lifestyleBudget * 0.85
    : groceryBudget * 0.82 + lifestyleBudget * 0.85

  const estimatedSpentSoFar = estimatedMonthlySpend * fractionPassed
  const projectedEndOfMonth = estimatedMonthlySpend
  const savedVsBaseline = recommendations ? recommendations.totalSavings : 0
  const spendPct = totalBudget > 0 ? Math.min((estimatedSpentSoFar / totalBudget) * 100, 100) : 0
  const remaining = Math.max(totalBudget - estimatedSpentSoFar, 0)

  function barColor(pct: number) {
    if (pct < 65) return 'bg-green-500'
    if (pct < 85) return 'bg-amber-500'
    return 'bg-red-500'
  }

  function textColor(pct: number) {
    if (pct < 65) return 'text-green-600'
    if (pct < 85) return 'text-amber-600'
    return 'text-red-600'
  }

  // Per-category breakdown for groceries
  const categoryBreakdown = recommendations
    ? recommendations.recommendations.flatMap((r) =>
        r.assignedCategories.map((catId) => ({
          catId,
          monthly: r.monthlyEstimate / r.assignedCategories.length,
          budget: (profile.budget as unknown as Record<string, number>)[catId] ?? 0,
        }))
      ).slice(0, 5)
    : []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-orange-500" />
          <h2 className="font-bold text-gray-900">Savings This Month</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={12} />
          {daysLeft} days left in {today.toLocaleString('en-NL', { month: 'long' })}
        </div>
      </div>

      {/* Main progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-3xl font-bold text-gray-900">€{Math.round(estimatedSpentSoFar)}</span>
            <span className="text-gray-400 text-sm ml-1">/ €{totalBudget} budget</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${textColor(spendPct)}`}>{Math.round(spendPct)}% used</p>
            <p className="text-xs text-gray-400">€{Math.round(remaining)} remaining</p>
          </div>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor(spendPct)}`}
            style={{ width: `${spendPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>Day {dayOfMonth}</span>
          <span className="text-gray-500">Projected: €{Math.round(projectedEndOfMonth)}</span>
          <span>Day {daysInMonth}</span>
        </div>
      </div>

      {/* Savings highlight */}
      {savedVsBaseline > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <TrendingDown className="text-green-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-green-700">
              Saving €{Math.round(savedVsBaseline)}/month vs shopping only at Albert Heijn
            </p>
            <p className="text-xs text-green-600">
              That's €{Math.round(savedVsBaseline * 12)}/year — your smart shopping plan is working!
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">By category</p>
          {categoryBreakdown.map(({ catId, monthly, budget: catBudget }) => {
            const cat = CATEGORY_MAP[catId as CategoryId]
            if (!cat) return null
            const catSpent = monthly * fractionPassed
            const catPct = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 100) : 0
            return (
              <div key={catId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    {cat.icon} {cat.label}
                  </span>
                  <span className={`text-xs font-medium ${textColor(catPct)}`}>
                    €{Math.round(catSpent)} / €{catBudget}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(catPct)}`}
                    style={{ width: `${catPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalBudget === 0 && (
        <div className="text-center text-sm text-gray-400 py-2">
          Set your budget to see spending progress →{' '}
          <a href="/budget" className="text-orange-500 hover:underline">Set up budget</a>
        </div>
      )}
    </div>
  )
}
