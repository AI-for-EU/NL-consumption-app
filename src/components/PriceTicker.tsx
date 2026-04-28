'use client'

import { useApp } from '@/context/AppContext'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

export default function PriceTicker() {
  const { tickerItems } = useApp()

  if (!tickerItems.length) return null

  // Duplicate for seamless looping
  const doubled = [...tickerItems, ...tickerItems]

  return (
    <div className="bg-gray-900 text-white overflow-hidden relative h-9 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-center gap-8 whitespace-nowrap animate-[ticker_60s_linear_infinite]"
        style={{ animation: 'ticker 60s linear infinite' }}
      >
        {doubled.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex items-center gap-2 text-xs">
            <span
              className="font-bold text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: item.supermarketColor + '33', color: item.supermarketColor }}
            >
              {item.supermarketShort}
            </span>
            <span className="text-gray-200">{item.productName}</span>
            <span
              className={`font-semibold ${
                item.direction === 'down'
                  ? 'text-green-400'
                  : item.direction === 'up'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              €{item.price.toFixed(2)}
            </span>
            {item.direction === 'down' && (
              <TrendingDown size={12} className="text-green-400" />
            )}
            {item.direction === 'up' && (
              <TrendingUp size={12} className="text-red-400" />
            )}
            {item.direction === 'same' && (
              <Minus size={12} className="text-gray-400" />
            )}
            {item.offerLabel && (
              <span className="text-yellow-400 text-xs">★ {item.offerLabel}</span>
            )}
            <span className="text-gray-600 mx-2">|</span>
          </div>
        ))}
      </div>
    </div>
  )
}
