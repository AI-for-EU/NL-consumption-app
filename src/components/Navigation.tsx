'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell, BarChart2, ShoppingCart, Home, GitCompare,
  MapPin, Search, CreditCard, LogIn, LogOut, Users, ShoppingBasket
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'

const SIDEBAR_ITEMS = [
  { href: '/',               label: 'Dashboard',      icon: Home },
  { href: '/basket',         label: 'Smart Basket',   icon: ShoppingBasket },
  { href: '/family',         label: 'Family Basket',  icon: Users },
  { href: '/budget',         label: 'My Budget',      icon: BarChart2 },
  { href: '/compare',        label: 'Price Compare',  icon: GitCompare },
  { href: '/search',         label: 'Search Products',icon: Search },
  { href: '/recommendations',label: 'Shopping Plan',  icon: ShoppingCart },
  { href: '/loyalty',        label: 'Loyalty Cards',  icon: CreditCard },
  { href: '/alerts',         label: 'Alerts',         icon: Bell, badge: true },
]

// Bottom nav — 5 most-used on mobile
const BOTTOM_NAV = [
  { href: '/',       label: 'Home',   icon: Home },
  { href: '/basket', label: 'Basket', icon: ShoppingBasket },
  // centre slot is the Voice FAB (rendered in layout) — skip it
  { href: '/family', label: 'Family', icon: Users },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: true },
]

export default function Navigation() {
  const pathname = usePathname()
  const { unreadCount } = useApp()
  const { user, authState, signOut } = useAuth()
  const displayName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.phone ?? 'Account'
  const avatarLetter = displayName?.[0]?.toUpperCase() ?? 'A'

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
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

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          {authState === 'authenticated' && user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{displayName}</p>
                <button onClick={signOut} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition">
                  <LogOut size={10} /> Sign out
                </button>
              </div>
            </div>
          ) : authState === 'unauthenticated' ? (
            <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition">
              <LogIn size={16} /> Sign in for sync
            </Link>
          ) : null}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={12} />
            <span>Netherlands 🇳🇱 · Updates every 30s</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────── */}
      <header className="lg:hidden fixed top-9 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <span className="font-bold text-gray-900 text-sm">BudgetBoodschappen</span>
          </div>
          <div className="flex items-center gap-3">
            {authState === 'authenticated' && user ? (
              <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                {avatarLetter}
              </div>
            ) : (
              <Link href="/login" className="text-xs text-orange-500 font-medium">Sign in</Link>
            )}
            <Link href="/alerts" className="relative">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav (4 tabs + centre FAB slot) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {/* Left 2 tabs */}
          {BOTTOM_NAV.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <NavTab key={href} href={href} label={label} icon={<Icon size={22} strokeWidth={pathname === href ? 2.5 : 1.8} />} active={pathname === href} />
          ))}

          {/* Centre slot — Voice FAB sits here (rendered in layout.tsx) */}
          <div className="flex-1" />

          {/* Right 2 tabs */}
          {BOTTOM_NAV.slice(2).map(({ href, label, icon: Icon, badge }) => (
            <NavTab
              key={href}
              href={href}
              label={label}
              icon={<Icon size={22} strokeWidth={pathname === href ? 2.5 : 1.8} />}
              active={pathname === href}
              badge={badge ? unreadCount : 0}
            />
          ))}
        </div>
      </nav>
    </>
  )
}

function NavTab({ href, label, icon, active, badge = 0 }: {
  href: string; label: string; icon: React.ReactNode; active: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] relative transition-colors ${active ? 'text-orange-500' : 'text-gray-400'}`}
    >
      <div className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-medium leading-none ${active ? 'text-orange-500' : 'text-gray-400'}`}>{label}</span>
      {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />}
    </Link>
  )
}
