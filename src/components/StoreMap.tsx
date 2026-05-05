'use client'

import { useState, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api'
import { SUPERMARKETS } from '@/data/supermarkets'
import { Supermarket, StoreLocation } from '@/types'
import { MapPin, Navigation, ExternalLink, AlertCircle, Layers } from 'lucide-react'

const MAP_CENTER = { lat: 52.2, lng: 5.3 } // Netherlands center
const LIBRARIES: ('places')[] = ['places']

interface ActiveStore { supermarket: Supermarket; store: StoreLocation }

const SUPERMARKET_COLORS: Record<string, string> = {
  ah:        '#00A0E2',
  jumbo:     '#FFD700',
  lidl:      '#0050AA',
  aldi:      '#00529F',
  plus:      '#E30613',
  dirk:      '#FF6600',
  hoogvliet: '#009B4D',
}

// Create SVG pin URL per supermarket color
function coloredPin(color: string, text: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.1 27.9 0 18 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="9" fill="white" opacity="0.9"/>
      <text x="18" y="22" font-size="9" font-weight="bold" text-anchor="middle"
        font-family="sans-serif" fill="${color}">${text}</text>
    </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

export default function StoreMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  })

  const [activeStore, setActiveStore] = useState<ActiveStore | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [visibleChains, setVisibleChains] = useState<Set<string>>(
    new Set(SUPERMARKETS.map((s) => s.id))
  )
  const mapRef = useRef<google.maps.Map | null>(null)

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  function locateMe() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        mapRef.current?.panTo(loc)
        mapRef.current?.setZoom(13)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  function toggleChain(id: string) {
    setVisibleChains((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allMarkers = SUPERMARKETS.flatMap((sm) =>
    sm.locations
      .filter(() => visibleChains.has(sm.id))
      .map((loc) => ({ supermarket: sm, store: loc }))
  )

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 font-semibold">
          <AlertCircle size={18} /> Google Maps API key not configured
        </div>
        <p className="text-sm text-amber-600">
          Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{' '}
          <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
          Enable <strong>Maps JavaScript API</strong> and <strong>Places API</strong> in Google Cloud Console.
        </p>
        {/* Static fallback */}
        <StaticStoreList />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm flex gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        Failed to load Google Maps. Check your API key and ensure Maps JavaScript API is enabled.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Chain filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filter chains</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPERMARKETS.map((sm) => (
            <button
              key={sm.id}
              onClick={() => toggleChain(sm.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                visibleChains.has(sm.id)
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
              style={visibleChains.has(sm.id) ? { backgroundColor: sm.color, borderColor: sm.color } : {}}
            >
              {sm.emoji} {sm.shortName}
              <span className="opacity-70">
                ({sm.locations.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '480px' }}
          center={MAP_CENTER}
          zoom={8}
          onLoad={onMapLoad}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControlOptions: { position: 9 },
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ],
          }}
        >
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {allMarkers.map(({ supermarket: sm, store }) => (
                  <Marker
                    key={store.storeId}
                    position={{ lat: store.lat, lng: store.lng }}
                    clusterer={clusterer}
                    icon={{
                      url: coloredPin(SUPERMARKET_COLORS[sm.id] ?? '#666', sm.shortName.slice(0, 2)),
                      scaledSize: new window.google.maps.Size(36, 44),
                      anchor: new window.google.maps.Point(18, 44),
                    }}
                    onClick={() => setActiveStore({ supermarket: sm, store })}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>

          {/* User location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3,
              }}
            />
          )}

          {/* InfoWindow */}
          {activeStore && (
            <InfoWindow
              position={{ lat: activeStore.store.lat, lng: activeStore.store.lng }}
              onCloseClick={() => setActiveStore(null)}
            >
              <div className="p-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{activeStore.supermarket.emoji}</span>
                  <span className="font-bold text-gray-900">{activeStore.supermarket.name}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-0.5">
                  <MapPin size={11} /> {activeStore.store.address}, {activeStore.store.city}
                </p>
                <p className="text-xs text-gray-500 mb-2">🕐 {activeStore.store.openHours}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeStore.store.lat},${activeStore.store.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <Navigation size={11} /> Get directions
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Locate me button */}
        <button
          onClick={locateMe}
          disabled={locating}
          className="absolute bottom-4 right-4 bg-white shadow-md rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 border border-gray-200"
        >
          <Navigation size={14} className={locating ? 'animate-pulse text-blue-500' : 'text-blue-500'} />
          {locating ? 'Locating…' : 'My location'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {allMarkers.length} store locations · Click a pin for details & directions · Clusters expand on zoom
      </p>
    </div>
  )
}

function StaticStoreList() {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Store locations (static)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
        {SUPERMARKETS.flatMap((sm) =>
          sm.locations.map((loc) => (
            <a
              key={loc.storeId}
              href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 hover:border-orange-200 text-xs transition group"
            >
              <span className="text-base">{sm.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-700">{sm.shortName}</span>
                <span className="text-gray-400 ml-1 truncate">{loc.address}</span>
              </div>
              <ExternalLink size={10} className="text-gray-300 group-hover:text-orange-400 shrink-0" />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
