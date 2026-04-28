'use client'

import { useApp } from '@/context/AppContext'
import { Bell, BellOff, Check, CheckCheck, TrendingDown, Tag, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CATEGORY_MAP } from '@/data/categories'

export default function AlertCenter() {
  const { alerts, markRead, markAllAlertsRead, unreadCount } = useApp()

  async function requestNotificationPermission() {
    if (typeof window === 'undefined') return
    await Notification.requestPermission()
  }

  const notifStatus = typeof window !== 'undefined' ? Notification.permission : 'default'
  const sortedAlerts = [...alerts].reverse()

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-orange-500" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Price Alerts</p>
            <p className="text-xs text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · Updates every 30s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifStatus !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition"
            >
              <Bell size={14} /> Enable push notifications
            </button>
          )}
          {notifStatus === 'granted' && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl">
              <Check size={12} /> Notifications on
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAlertsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      {sortedAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <BellOff size={32} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium">No price alerts yet</p>
          <p className="text-gray-400 text-sm">We're watching {7} supermarkets for price drops. Alerts appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedAlerts.map((alert) => {
            const cat = CATEGORY_MAP[alert.category]
            return (
              <div
                key={alert.id}
                onClick={() => markRead(alert.id)}
                className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  !alert.read ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: alert.supermarketColor + '22' }}
                  >
                    {alert.productEmoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold text-sm ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alert.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: alert.supermarketColor + '22', color: alert.supermarketColor }}
                          >
                            {alert.supermarketName}
                          </span>
                          {cat && (
                            <span className="text-xs text-gray-400">{cat.icon} {cat.label}</span>
                          )}
                          {alert.offerLabel && (
                            <span className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                              <Tag size={9} /> {alert.offerLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-gray-400 text-sm line-through">€{alert.oldPrice.toFixed(2)}</span>
                          <TrendingDown size={14} className="text-green-500" />
                          <span className="font-bold text-green-600 text-base">€{alert.newPrice.toFixed(2)}</span>
                        </div>
                        <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                          {alert.percentOff}% off · save €{alert.savingsAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      {!alert.read && (
                        <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full inline-block" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
