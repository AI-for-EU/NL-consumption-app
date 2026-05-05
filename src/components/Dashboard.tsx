'use client'

import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { SUPERMARKETS } from '@/data/supermarkets'
import { Bell, ShoppingCart, TrendingDown, MapPin, ArrowRight, BarChart2, LogIn } from 'lucide-react'
import Link from 'next/link'
import SavingsProgress from './SavingsProgress'
import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('./StoreMap'), { ssr: false, loading: () => (
  <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
)})

export default function Dashboard() {
  const { profile, alerts, unreadCount, recommendations } = useApp()
  const { user, authState } = useAuth()
  const recentAlerts = [...alerts].reverse().slice(0, 3)

  const totalBudget = profile.budget
    ? Object.values(profile.budget).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Hero / welcome */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {profile.name ? `Hoi ${profile.name}! 👋` : 'Welkom! 👋'}
            </h1>
            <p className="text-orange-100 mt-1 text-sm">
              Smart grocery budgeting for the Netherlands
            </p>
            {profile.city && (
              <div className="flex items-center gap-1.5 mt-1 text-orange-200 text-sm">
                <MapPin size={14} />
                <span>{profile.city}</span>
              </div>
            )}
          </div>
          {/* Auth status badge */}
          {authState === 'unauthenticated' && (
            <Link
              href="/login"
              className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-2 rounded-xl transition"
            >
              <LogIn size={14} /> Sign in
            </Link>
          )}
          {authState === 'authenticated' && user && (
            <div className="shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
              {(user.user_metadata?.full_name ?? user.phone ?? 'U')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatCard label="Monthly budget"  value={totalBudget > 0 ? `€${totalBudget}` : '—'} sub="Set in budget" />
          <StatCard label="Supermarkets"    value={SUPERMARKETS.length.toString()} sub="Across NL" />
          <StatCard label="Products live"   value="30+"  sub="With prices" />
          <StatCard label="Price alerts"    value={unreadCount > 0 ? `${unreadCount} new` : `${alerts.length}`} sub="This session" highlight={unreadCount > 0} />
        </div>
      </div>

      {/* Savings progress bar */}
      <SavingsProgress />

      {/* Auth prompt (non-intrusive) */}
      {authState === 'unauthenticated' && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 text-xl">🔐</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Sign in for personalised recommendations</p>
            <p className="text-xs text-gray-500 mt-0.5">Use phone, Google or Outlook — sync your budget & alerts across devices</p>
          </div>
          <Link href="/login" className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition">
            Sign in
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickAction
          href="/budget"
          icon={<BarChart2 className="text-orange-500" size={20} />}
          title={profile.setupComplete ? 'Update Budget' : 'Set Up Budget'}
          desc={profile.setupComplete ? `€${totalBudget}/month across all categories` : 'Tell us your monthly budget to get started'}
          cta={profile.setupComplete ? 'Edit' : 'Start'}
        />
        <QuickAction
          href="/recommendations"
          icon={<ShoppingCart className="text-green-500" size={20} />}
          title="Shopping Plan"
          desc={recommendations
            ? `Shop at ${recommendations.recommendations.length} stores · save €${recommendations.totalSavings.toFixed(0)}/month`
            : 'Get your personalised supermarket plan'}
          cta="View plan"
        />
        <QuickAction
          href="/compare"
          icon={<TrendingDown className="text-blue-500" size={20} />}
          title="Price Comparison"
          desc="Live prices across AH, Jumbo, Lidl, Aldi & more"
          cta="Compare"
        />
        <QuickAction
          href="/alerts"
          icon={<Bell className="text-purple-500" size={20} />}
          title="Price Alerts"
          desc={unreadCount > 0 ? `${unreadCount} new price drop${unreadCount > 1 ? 's' : ''} detected!` : 'Watching for price drops across all stores'}
          cta="See alerts"
          badge={unreadCount}
        />
      </div>

      {/* Store map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Nearby Supermarkets</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            {SUPERMARKETS.reduce((s, sm) => s + sm.locations.length, 0)} store locations
          </span>
        </div>
        <StoreMap />
      </div>

      {/* Recent alerts */}
      {recentAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Price Drops</h2>
            <Link href="/alerts" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-2xl">{a.productEmoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.productName}</p>
                  <p className="text-xs text-gray-400">{a.supermarketName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">€{a.newPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 line-through">€{a.oldPrice.toFixed(2)}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  -{a.percentOff}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supermarkets overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Supermarkets we track</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPERMARKETS.map((sm) => (
            <div key={sm.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: sm.color }}>
                {sm.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{sm.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: sm.color + '22', color: sm.textColor }}>
                    {sm.tier}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{sm.description}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{sm.locations.length} stores</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight = false }: {
  label: string; value: string; sub: string; highlight?: boolean
}) {
  return (
    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
      <p className="text-orange-100 text-xs">{label}</p>
      <p className={`font-bold text-xl ${highlight ? 'text-yellow-300' : 'text-white'}`}>{value}</p>
      <p className="text-orange-200 text-xs">{sub}</p>
    </div>
  )
}

function QuickAction({ href, icon, title, desc, cta, badge }: {
  href: string; icon: React.ReactNode; title: string; desc: string; cta: string; badge?: number
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-orange-200 transition group">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {badge && badge > 0 ? (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
          ) : null}
        </div>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <div className="text-xs font-medium text-orange-500 shrink-0 flex items-center gap-1">
        {cta} <ArrowRight size={12} />
      </div>
    </Link>
  )
}
