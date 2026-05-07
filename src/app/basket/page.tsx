'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ConsumptionWidget from '@/components/ConsumptionWidget'
import { RefreshCw, Mic, ShoppingCart } from 'lucide-react'

const BasketBuilder = dynamic(() => import('@/components/BasketBuilder'), { ssr: false })
const VoiceAgent = dynamic(() => import('@/components/VoiceAgent'), { ssr: false })

export default function BasketPage() {
  const [voiceItems, setVoiceItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'basket' | 'tracking'>('basket')

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Smart Basket</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add items manually or tap the mic to speak your list. We'll find the cheapest stores.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5 w-fit">
        <button
          onClick={() => setActiveTab('basket')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'basket' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          <ShoppingCart size={15} /> Basket
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tracking' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          <RefreshCw size={15} /> Reorder reminders
        </button>
      </div>

      {activeTab === 'basket' && (
        <BasketBuilder externalItems={voiceItems} />
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            <strong>How it works:</strong> Each time you mark items as bought, we record the purchase.
            Over time we learn your consumption patterns and remind you before you run out.
          </div>
          <ConsumptionWidget />
        </div>
      )}

      {/* Floating Voice Agent */}
      <VoiceAgent onItemsCollected={(items) => {
        setVoiceItems(items)
        setActiveTab('basket')
      }} />
    </div>
  )
}
