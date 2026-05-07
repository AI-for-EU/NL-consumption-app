'use client'

import dynamic from 'next/dynamic'
import VoiceAgent from '@/components/VoiceAgent'
import { useState } from 'react'

const FamilyBasket = dynamic(() => import('@/components/FamilyBasket'), { ssr: false })

export default function FamilyPage() {
  const [voiceItems, setVoiceItems] = useState<string[]>([])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Family Basket</h1>
        <p className="text-gray-500 text-sm mt-1">
          Share your shopping list with family. Everyone sees what's been added and what's already in the cart.
        </p>
      </div>

      <FamilyBasket />

      {/* Voice also works in family mode */}
      <VoiceAgent onItemsCollected={setVoiceItems} />
    </div>
  )
}
