'use client'

import { useState, useEffect } from 'react'
import { LOYALTY_PROGRAMS } from '@/data/loyaltyPrograms'
import { LoyaltyCard } from '@/types'
import { loadLoyaltyCards, saveLoyaltyCards } from '@/lib/storage'
import { CreditCard, Plus, RefreshCw, X, Check, Star, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

export default function LoyaltyCards() {
  const [cards, setCards] = useState<LoyaltyCard[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)
  const [newCardNumber, setNewCardNumber] = useState('')
  const [newPoints, setNewPoints] = useState('')
  const [syncing, setSyncing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { setCards(loadLoyaltyCards()) }, [])

  function save(updated: LoyaltyCard[]) {
    setCards(updated)
    saveLoyaltyCards(updated)
  }

  function addCard(programId: string) {
    if (!newCardNumber.trim()) return
    const newCard: LoyaltyCard = {
      id: `${programId}-${Date.now()}`,
      programId,
      nickname: '',
      cardNumber: newCardNumber.trim(),
      points: parseInt(newPoints) || 0,
      connected: true,
      lastSynced: new Date().toISOString(),
    }
    save([...cards, newCard])
    setAddingId(null)
    setNewCardNumber('')
    setNewPoints('')
  }

  function removeCard(cardId: string) {
    save(cards.filter((c) => c.id !== cardId))
  }

  function simulateSync(cardId: string) {
    setSyncing(cardId)
    setTimeout(() => {
      const bonus = Math.floor(Math.random() * 150) + 20
      save(
        cards.map((c) =>
          c.id === cardId
            ? { ...c, points: c.points + bonus, lastSynced: new Date().toISOString() }
            : c
        )
      )
      setSyncing(null)
    }, 1500)
  }

  function updatePoints(cardId: string, delta: number) {
    save(cards.map((c) => c.id === cardId ? { ...c, points: Math.max(0, c.points + delta) } : c))
  }

  const connectedPrograms = new Set(cards.map((c) => c.programId))
  const totalValueEuros = cards.reduce((sum, card) => {
    const program = LOYALTY_PROGRAMS.find((p) => p.id === card.programId)
    if (!program) return sum
    return sum + (card.points / 100) * program.euroPer100Points
  }, 0)

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      {cards.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <p className="text-indigo-100 text-sm">Total loyalty value across all cards</p>
          <p className="text-4xl font-bold mt-1">€{totalValueEuros.toFixed(2)}</p>
          <div className="flex items-center gap-3 mt-3 text-sm text-indigo-200">
            <span>{cards.length} card{cards.length !== 1 ? 's' : ''} connected</span>
            <span>·</span>
            <span>{cards.reduce((s, c) => s + c.points, 0).toLocaleString()} total points</span>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="space-y-3">
        {LOYALTY_PROGRAMS.map((program) => {
          const myCards = cards.filter((c) => c.programId === program.id)
          const isAdding = addingId === program.id
          const isExpanded = expanded === program.id

          return (
            <div key={program.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Program header */}
              <div className="flex items-center gap-3 p-4">
                {/* Card artwork */}
                <div
                  className="w-14 h-9 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0"
                  style={{ background: program.cardColor }}
                >
                  {program.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{program.storeName}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: program.color + '22', color: program.color }}
                    >
                      {program.name}
                    </span>
                    {program.appAvailable && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">📱 App</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{program.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {myCards.length > 0 ? (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : program.id)}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-xl"
                    >
                      <Check size={12} /> Connected
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setAddingId(program.id); setNewCardNumber(''); setNewPoints('') }}
                      className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition"
                    >
                      <Plus size={12} /> Add card
                    </button>
                  )}
                </div>
              </div>

              {/* Add card form */}
              {isAdding && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3 bg-orange-50/30">
                  <p className="text-sm font-medium text-gray-700">Connect your {program.storeName} {program.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Card number (e.g. 1234 5678 9012)"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <input
                      type="number"
                      placeholder={`Current ${program.pointsLabel} (optional)`}
                      value={newPoints}
                      onChange={(e) => setNewPoints(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addCard(program.id)}
                      disabled={!newCardNumber.trim()}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Connect Card
                    </button>
                    <button
                      onClick={() => setAddingId(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <ExternalLink size={10} />
                    <a href={program.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-500">
                      Find your card details at {program.website.replace('https://', '')}
                    </a>
                  </p>
                </div>
              )}

              {/* Connected card details */}
              {isExpanded && myCards.map((card) => {
                const program = LOYALTY_PROGRAMS.find((p) => p.id === card.programId)!
                const valueEuros = (card.points / 100) * program.euroPer100Points
                const isSyncing = syncing === card.id

                return (
                  <div key={card.id} className="px-4 pb-4 border-t border-gray-50 pt-3 bg-green-50/20">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Card number</p>
                        <p className="font-mono text-sm font-medium text-gray-700">
                          {card.cardNumber.replace(/(.{4})/g, '$1 ').trim().replace(/(\S+ \S+ \S+) /, '$1 ·· ')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="text-gray-300 hover:text-red-400 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Points display */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400">{program.pointsLabel}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xl font-bold" style={{ color: program.color }}>
                            {card.points.toLocaleString()}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => updatePoints(card.id, 10)} className="text-gray-300 hover:text-green-500 text-xs leading-none">▲</button>
                            <button onClick={() => updatePoints(card.id, -10)} className="text-gray-300 hover:text-red-400 text-xs leading-none">▼</button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400">Est. value</p>
                        <p className="text-xl font-bold text-green-600 mt-1">€{valueEuros.toFixed(2)}</p>
                        {program.euroPer100Points > 0 && (
                          <p className="text-xs text-gray-400">€{program.euroPer100Points}/100 pts</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Last synced: {new Date(card.lastSynced).toLocaleDateString('nl-NL')}
                      </p>
                      <button
                        onClick={() => simulateSync(card.id)}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-600 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing…' : 'Sync points'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Points rate info */}
              {!isAdding && !isExpanded && program.euroPer100Points > 0 && (
                <div className="px-4 pb-3 flex items-center gap-1.5">
                  <Star size={11} className="text-yellow-400" />
                  <span className="text-xs text-gray-400">
                    €{program.euroPer100Points} value per 100 {program.pointsLabel.toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {cards.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
          <strong>Tip:</strong> Add your loyalty cards above to see all your points in one place.
          Never lose track of AH Bonus punten, Jumbo Extra's spaarzegels, or Etos punten again!
        </div>
      )}
    </div>
  )
}
