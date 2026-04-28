'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BarChart2, ShoppingCart, Home, GitCompare, Menu, X, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/budget', label: 'My Budget', icon: BarChart2 },
  { href: '/compare', label: 'Price Compare', icon: GitCompare },
  { href: '/recommendations', label: 'Shopping Plan', icon: ShoppingCart },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: true },
]

export default function Navigation() {
  const pathname = usePathname()
  const { unreadCount } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm fixed left-0 top-0 z-30">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">
            🛒
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">BudgetBoodschappen</h1>
            <p className="text-xs text-gray-400">Smart Shopping NL</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badge && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={12} />
            <span>Netherlands 🇳🇱</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Prices update every 30s</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <span className="font-bold text-gray-900 text-sm">BudgetBoodschappen</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/alerts" className="relative">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="px-4 py-2 pb-4 border-t border-gray-100 bg-white space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-orange-50 text-orange-600' : 'text-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {badge && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
    </>
  )
}
