import { FamilyMember, FamilyRoom, ShoppingBasket } from '@/types'

const ROOM_KEY_PREFIX = 'nl_family_room_'
const MY_ROOM_KEY = 'nl_my_family_code'

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function generateDeviceId(): string {
  const stored = localStorage.getItem('nl_device_id')
  if (stored) return stored
  const id = Math.random().toString(36).slice(2)
  localStorage.setItem('nl_device_id', id)
  return id
}

function roomKey(code: string) { return ROOM_KEY_PREFIX + code.toUpperCase() }

export function createFamilyRoom(ownerName: string, ownerEmoji: string, basket: ShoppingBasket): FamilyRoom {
  const code = generateRoomCode()
  const deviceId = generateDeviceId()
  const owner: FamilyMember = {
    id: deviceId,
    name: ownerName,
    emoji: ownerEmoji,
    isOwner: true,
    joinedAt: new Date().toISOString(),
    deviceId,
  }
  const room: FamilyRoom = {
    code,
    ownerName,
    members: [owner],
    basket: { ...basket, familyCode: code },
    updatedAt: new Date().toISOString(),
  }
  saveRoom(room)
  localStorage.setItem(MY_ROOM_KEY, code)
  return room
}

export function joinFamilyRoom(code: string, memberName: string, memberEmoji: string): FamilyRoom | null {
  const room = loadRoom(code)
  if (!room) return null
  const deviceId = generateDeviceId()
  const exists = room.members.find((m) => m.deviceId === deviceId)
  if (!exists) {
    room.members.push({ id: deviceId, name: memberName, emoji: memberEmoji, isOwner: false, joinedAt: new Date().toISOString(), deviceId })
    saveRoom(room)
  }
  localStorage.setItem(MY_ROOM_KEY, code)
  return room
}

export function loadRoom(code: string): FamilyRoom | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(roomKey(code)) ?? 'null') } catch { return null }
}

export function saveRoom(room: FamilyRoom) {
  if (typeof window === 'undefined') return
  room.updatedAt = new Date().toISOString()
  localStorage.setItem(roomKey(room.code), JSON.stringify(room))
  // Broadcast to other tabs on same device
  try {
    const bc = new BroadcastChannel('family_room_' + room.code)
    bc.postMessage({ type: 'room_updated', room })
    bc.close()
  } catch { /* BroadcastChannel not available */ }
}

export function updateRoomBasket(code: string, basket: ShoppingBasket) {
  const room = loadRoom(code)
  if (!room) return
  room.basket = basket
  saveRoom(room)
}

export function getMyRoomCode(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(MY_ROOM_KEY)
}

export function leaveRoom() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MY_ROOM_KEY)
}

export function subscribeToRoom(code: string, cb: (room: FamilyRoom) => void): () => void {
  try {
    const bc = new BroadcastChannel('family_room_' + code)
    bc.onmessage = (e) => { if (e.data?.type === 'room_updated') cb(e.data.room) }
    const poll = setInterval(() => {
      const latest = loadRoom(code)
      if (latest) cb(latest)
    }, 5000)
    return () => { bc.close(); clearInterval(poll) }
  } catch {
    const poll = setInterval(() => {
      const latest = loadRoom(code)
      if (latest) cb(latest)
    }, 5000)
    return () => clearInterval(poll)
  }
}

// Encode basket as shareable URL
export function encodeShareURL(room: FamilyRoom): string {
  if (typeof window === 'undefined') return ''
  const data = btoa(JSON.stringify({ code: room.code, ownerName: room.ownerName }))
  return `${window.location.origin}/family?join=${data}`
}

export function decodeShareURL(encoded: string): { code: string; ownerName: string } | null {
  try { return JSON.parse(atob(encoded)) } catch { return null }
}

const MEMBER_EMOJIS = ['👨', '👩', '🧑', '👦', '👧', '👴', '👵', '🧒']
export function randomMemberEmoji() {
  return MEMBER_EMOJIS[Math.floor(Math.random() * MEMBER_EMOJIS.length)]
}
