'use client'

import { useState, useEffect } from 'react'
import { ConsumptionPattern } from '@/types'
import { computePatterns, seedDemoData } from '@/lib/consumption-tracker'
import { PRODUCT_MAP } from '@/data/products'
import { SUPERMARKET_MAP } from '@/data/supermarkets'
import { formatDistanceToNow, format } from 'date-fns'
import { Bell, TrendingDown, TrendingUp, RefreshCw, Clock } from 'lucide-react'

export default function ConsumptionWidget() {
  const [patterns, setPatterns] = useState<ConsumptionPattern[]>([])

  useEffect(() => {
    seedDemoData()
    setPatterns(computePatterns())
  }, [])

  if (patterns.length === 0) return null

  const overdue  = patterns.filter((p) => p.urgency === 'overdue')
  const dueSoon  = patterns.filter((p) => p.urgency === 'due-soon')
  const ok       = patterns.filter((p) => p.urgency === 'ok')

  return (
    <div className="space-y-3">
      {/* Urgent items */}
      {[...overdue, ...dueSoon].length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
            <Bell size={15} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">
              {overdue.length > 0 ? `${overdue.length} overdue` : ''}{overdue.length > 0 && dueSoon.length > 0 ? ' · ' : ''}{dueSoon.length > 0 ? `${dueSoon.length} due soon` : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {[...overdue, ...dueSoon].map((p) => (
              <PatternRow key={p.productId} pattern={p} />
            ))}
          </div>
        </div>
      )}

      {/* OK items */}
      {ok.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upcoming purchases</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ok.slice(0, 5).map((p) => (
              <PatternRow key={p.productId} pattern={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PatternRow({ pattern }: { pattern: ConsumptionPattern }) {
  const product = PRODUCT_MAP[pattern.productId]
  const lastSm = SUPERMARKET_MAP[pattern.lastSupermarketId]
  const nextDate = new Date(pattern.estimatedNextPurchase)
  const isOverdue = pattern.urgency === 'overdue'
  const isDueSoon = pattern.urgency === 'due-soon'

  // Price trend vs current cheapest
  const currentMin = product
    ? Math.min(...Object.values(product.prices).filter(Boolean).map((e) => e!.price))
    : null
  const priceDiff = currentMin !== null ? currentMin - pattern.lastPrice : 0
  const priceUp = priceDiff > 0.01
  const priceDown = priceDiff < -0.01

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 ${
        isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-amber-50' : 'bg-gray-50'
      }`}>
        {pattern.productEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{pattern.productName}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
            isOverdue  ? 'bg-red-100 text-red-600' :
            isDueSoon  ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {isOverdue
              ? `${Math.abs(Math.round((nextDate.getTime() - Date.now()) / 86400000))}d overdue`
              : isDueSoon
              ? `Due in ${Math.round((nextDate.getTime() - Date.now()) / 86400000)}d`
              : `Due ${format(nextDate, 'd MMM')}`
            }
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">
            Every ~{pattern.averageDaysBetweenPurchases}d · last: {lastSm?.shortName ?? '?'}
          </span>
          {currentMin !== null && (
            <span className={`text-xs flex items-center gap-0.5 font-medium ${
              priceDown ? 'text-green-600' : priceUp ? 'text-red-500' : 'text-gray-400'
            }`}>
              {priceDown && <TrendingDown size={11} />}
              {priceUp && <TrendingUp size={11} />}
              €{currentMin.toFixed(2)} now
              {priceDown && ` (${Math.abs(priceDiff).toFixed(2)} cheaper!)`}
              {priceUp && ` (${priceDiff.toFixed(2)} more)`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
