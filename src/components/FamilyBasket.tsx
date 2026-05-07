'use client'

import { useState, useEffect, useCallback } from 'react'
import { FamilyRoom, ShoppingBasket } from '@/types'
import {
  createFamilyRoom, joinFamilyRoom, loadRoom, saveRoom,
  getMyRoomCode, leaveRoom, subscribeToRoom, encodeShareURL,
  randomMemberEmoji, generateDeviceId
} from '@/lib/family-sync'
import { optimizeBasket } from '@/lib/basket-optimizer'
import { Plus, X, Check, Users, Copy, Share2, LogOut, QrCode, Zap, RefreshCw, ExternalLink } from 'lucide-react'
import { parseQuantityAndItem, findProductId } from '@/data/productMap'
import { PRODUCT_MAP } from '@/data/products'
import { BasketItem } from '@/types'

export default function FamilyBasket() {
  const [room, setRoom] = useState<FamilyRoom | null>(null)
  const [mode, setMode] = useState<'landing' | 'create' | 'join' | 'room'>('landing')
  const [myName, setMyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [view, setView] = useState<'list' | 'optimized'>('list')

  const myEmoji = useCallback(() => randomMemberEmoji(), [])
  const myDeviceId = typeof window !== 'undefined' ? generateDeviceId() : ''

  useEffect(() => {
    const code = getMyRoomCode()
    if (code) {
      const existing = loadRoom(code)
      if (existing) { setRoom(existing); setMode('room'); return }
    }
  }, [])

  useEffect(() => {
    if (!room) return
    const unsub = subscribeToRoom(room.code, (updated) => setRoom(updated))
    return unsub
  }, [room?.code])

  function handleCreate() {
    if (!myName.trim()) return
    const emptyBasket: ShoppingBasket = {
      id: Date.now().toString(), name: `${myName}'s Family List`,
      items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const newRoom = createFamilyRoom(myName.trim(), myEmoji(), emptyBasket)
    setRoom(newRoom); setMode('room')
  }

  function handleJoin() {
    if (!myName.trim() || !joinCode.trim()) return
    const joined = joinFamilyRoom(joinCode.trim().toUpperCase(), myName.trim(), myEmoji())
    if (joined) { setRoom(joined); setMode('room') }
    else alert('Room not found. Check the code and try again.')
  }

  function handleLeave() {
    leaveRoom(); setRoom(null); setMode('landing')
  }

  function addItem() {
    if (!input.trim() || !room) return
    const myMember = room.members.find((m) => m.deviceId === myDeviceId)
    const { quantity, unit, name } = parseQuantityAndItem(input.trim())
    const productId = findProductId(name) ?? undefined
    const product = productId ? PRODUCT_MAP[productId] : null
    const newItem: BasketItem = {
      id: Date.now().toString(),
      name,
      quantity,
      unit: unit === 'x' ? (product?.unit.replace('per ', '') ?? 'x') : unit,
      productId,
      addedBy: myMember?.name ?? 'Unknown',
      addedAt: new Date().toISOString(),
      bought: false,
      estimatedPrice: product ? Math.min(...Object.values(product.prices).filter(Boolean).map((e) => e!.price)) : undefined,
    }
    const updated: FamilyRoom = {
      ...room,
      basket: { ...room.basket, items: [...room.basket.items, newItem] },
    }
    saveRoom(updated); setRoom(updated); setInput('')
  }

  function toggleBought(itemId: string) {
    if (!room) return
    const myMember = room.members.find((m) => m.deviceId === myDeviceId)
    const updated: FamilyRoom = {
      ...room,
      basket: {
        ...room.basket,
        items: room.basket.items.map((i) =>
          i.id === itemId
            ? { ...i, bought: !i.bought, boughtBy: !i.bought ? (myMember?.name ?? 'Someone') : undefined, boughtAt: !i.bought ? new Date().toISOString() : undefined }
            : i
        ),
      },
    }
    saveRoom(updated); setRoom(updated)
  }

  function removeItem(itemId: string) {
    if (!room) return
    const updated: FamilyRoom = { ...room, basket: { ...room.basket, items: room.basket.items.filter((i) => i.id !== itemId) } }
    saveRoom(updated); setRoom(updated)
  }

  function handleOptimize() {
    if (!room) return
    setOptimizing(true)
    setTimeout(() => {
      const opt = optimizeBasket(room.basket.items)
      const updated: FamilyRoom = { ...room, basket: { ...room.basket, optimization: opt } }
      saveRoom(updated); setRoom(updated); setView('optimized'); setOptimizing(false)
    }, 700)
  }

  function copyCode() {
    if (!room) return
    navigator.clipboard.writeText(room.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function shareLink() {
    if (!room) return
    const url = encodeShareURL(room)
    if (navigator.share) {
      navigator.share({ title: 'Join my family shopping list', text: `Join with code ${room.code}`, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── LANDING ──────────────────────────────────────────────────────────────
  if (mode === 'landing') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center">
          <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-bold">Family Shopping List</h2>
          <p className="text-indigo-200 text-sm mt-1">
            Share your basket with family so everyone can add items and see what's already in the cart
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setMode('create')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:border-indigo-200 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">✨</div>
            <p className="font-bold text-gray-900">Create a family list</p>
            <p className="text-sm text-gray-500 mt-1">Start a shared basket and invite your family</p>
          </button>
          <button
            onClick={() => setMode('join')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:border-indigo-200 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">🔗</div>
            <p className="font-bold text-gray-900">Join a family list</p>
            <p className="text-sm text-gray-500 mt-1">Enter a 6-character code to join an existing list</p>
          </button>
        </div>
      </div>
    )
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (mode === 'create') {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">Create family list</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
          <input type="text" value={myName} onChange={(e) => setMyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Jan" autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={handleCreate} disabled={!myName.trim()}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition">
          Create & get sharing code
        </button>
        <button onClick={() => setMode('landing')} className="w-full text-sm text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )
  }

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (mode === 'join') {
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">Join family list</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
          <input type="text" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="e.g. Emma"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">6-character code</label>
          <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="e.g. KRAM42" maxLength={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase" />
        </div>
        <button onClick={handleJoin} disabled={!myName.trim() || joinCode.length < 6}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition">
          Join list
        </button>
        <button onClick={() => setMode('landing')} className="w-full text-sm text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )
  }

  // ── ROOM ──────────────────────────────────────────────────────────────────
  if (!room) return null
  const activeItems = room.basket.items.filter((i) => !i.bought)
  const boughtItems = room.basket.items.filter((i) => i.bought)
  const opt = room.basket.optimization

  return (
    <div className="space-y-4">
      {/* Room header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Family List</p>
            <h2 className="text-xl font-bold mt-0.5">{room.basket.name}</h2>
          </div>
          <button onClick={handleLeave} className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition">
            <LogOut size={12} /> Leave
          </button>
        </div>

        {/* Share code */}
        <div className="mt-4 bg-white/20 rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-indigo-200">Share code</p>
            <p className="text-2xl font-bold font-mono tracking-widest">{room.code}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button onClick={shareLink} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Users size={14} className="text-indigo-200" />
          {room.members.map((m) => (
            <div key={m.id} className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs">
              <span>{m.emoji}</span>
              <span className="font-medium">{m.name}</span>
              {m.isOwner && <span className="text-yellow-300">★</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Add item */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item: brood, 2L melk, chicken…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={addItem} disabled={!input.trim()}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition flex items-center gap-1.5">
          <Plus size={16} />
        </button>
      </div>

      {/* View toggle */}
      {room.basket.items.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['list', 'optimized'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {v === 'list' ? '📋 List' : '⚡ Optimised'}
              </button>
            ))}
          </div>
          <button onClick={handleOptimize} disabled={optimizing || activeItems.length === 0}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            {optimizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            {optimizing ? 'Optimising…' : 'Optimise'}
          </button>
        </div>
      )}

      {/* Items list */}
      {view === 'list' && (
        <div className="space-y-2">
          {room.basket.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm">No items yet — add above or share the code with family</p>
            </div>
          ) : (
            <>
              {activeItems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {activeItems.map((item) => (
                    <FamilyItemRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
                  ))}
                </div>
              )}
              {boughtItems.length > 0 && (
                <div className="opacity-60">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">In basket ✓</p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {boughtItems.map((item) => (
                      <FamilyItemRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Optimised view */}
      {view === 'optimized' && opt && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-green-100 text-sm">Best shopping plan for the family</p>
            <p className="text-3xl font-bold">€{(opt.splitStores.reduce((s, st) => s + st.estimatedTotal, 0) || opt.singleStoreBest.estimatedTotal).toFixed(2)}</p>
          </div>
          {(opt.splitStores.length > 0 ? opt.splitStores : [opt.singleStoreBest]).map((sb) => (
            <div key={sb.supermarketId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: sb.supermarket.bgColor }}>
                <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-lg font-bold" style={{ backgroundColor: sb.supermarket.color }}>
                  {sb.supermarket.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{sb.supermarket.name}</p>
                  <p className="text-xs text-gray-500">{sb.items.length} items · €{sb.estimatedTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1">
                {sb.items.map((i) => (
                  <div key={i.id} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400">·</span>
                    <span className="capitalize flex-1">{i.name}</span>
                    <span className="text-gray-400 text-xs">×{i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FamilyItemRow({ item, onToggle, onRemove }: { item: BasketItem; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  const product = item.productId ? PRODUCT_MAP[item.productId] : null
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${item.bought ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.bought ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'}`}>
        {item.bought && <Check size={12} className="text-white" />}
      </button>
      <span className="text-lg shrink-0">{product?.emoji ?? '🛒'}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium text-gray-900 capitalize ${item.bought ? 'line-through' : ''}`}>{item.name}</span>
        <span className="text-xs text-gray-400 ml-1.5">×{item.quantity}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">Added by {item.addedBy}</span>
          {item.bought && item.boughtBy && (
            <span className="text-xs text-green-600">· Got by {item.boughtBy}</span>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 transition"><X size={16} /></button>
    </div>
  )
}
