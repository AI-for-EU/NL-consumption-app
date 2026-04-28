import { GeoLocation, StoreLocation, Supermarket } from '@/types'

export function haversineKm(a: GeoLocation, b: GeoLocation): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
}

export function nearestStore(
  userLoc: GeoLocation,
  supermarket: Supermarket
): { store: StoreLocation; distanceKm: number } | null {
  if (!supermarket.locations.length) return null
  let best = supermarket.locations[0]
  let bestDist = haversineKm(userLoc, best)
  for (const loc of supermarket.locations.slice(1)) {
    const d = haversineKm(userLoc, loc)
    if (d < bestDist) {
      best = loc
      bestDist = d
    }
  }
  return { store: best, distanceKm: Math.round(bestDist * 10) / 10 }
}

export const DUTCH_CITIES: GeoLocation[] = [
  { lat: 52.3676, lng: 4.9041, city: 'Amsterdam' },
  { lat: 51.9225, lng: 4.4792, city: 'Rotterdam' },
  { lat: 52.0907, lng: 5.1214, city: 'Utrecht' },
  { lat: 52.0705, lng: 4.3007, city: 'Den Haag' },
  { lat: 51.4416, lng: 5.4697, city: 'Eindhoven' },
  { lat: 53.2194, lng: 6.5665, city: 'Groningen' },
  { lat: 51.5555, lng: 5.0913, city: 'Tilburg' },
  { lat: 51.5719, lng: 4.7683, city: 'Breda' },
  { lat: 52.1551, lng: 5.3872, city: 'Amersfoort' },
  { lat: 51.8125, lng: 5.8372, city: 'Nijmegen' },
]

export async function getBrowserLocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const nearest = DUTCH_CITIES.reduce((best, city) => {
          const d = haversineKm({ lat, lng, city: '' }, city)
          const bd = haversineKm({ lat, lng, city: '' }, best)
          return d < bd ? city : best
        })
        resolve({ lat, lng, city: nearest.city })
      },
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}
