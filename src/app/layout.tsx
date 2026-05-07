import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import PriceTicker from '@/components/PriceTicker'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#f97316',
}

export const metadata: Metadata = {
  title: 'BudgetBoodschappen — Smart Grocery Budgeting Netherlands',
  description: 'Track supermarket prices across Albert Heijn, Jumbo, Lidl, Aldi and more. AI voice shopping list, family basket, loyalty card tracking.',
  keywords: 'supermarkt, boodschappen, budget, Netherlands, Albert Heijn, Jumbo, Lidl, Aldi, stemassistent, voice shopping',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'BudgetBoodschappen' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AppProvider>
            {/* Price ticker strip */}
            <div className="fixed top-0 left-0 right-0 z-50">
              <PriceTicker />
            </div>

            <Navigation />

            {/* Voice FAB — fixed centre of bottom nav on mobile */}
            <div className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pb-2.5">
              <a
                href="/basket"
                className="w-14 h-14 bg-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-orange-600 transition-all hover:scale-110 active:scale-95"
                aria-label="Open voice shopping assistant"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </a>
            </div>

            <div className="lg:ml-64">
              <div className="h-9" />
              <main className="min-h-screen pt-16 lg:pt-4 pb-28 lg:pb-8 px-4 sm:px-6 max-w-5xl mx-auto">
                {children}
              </main>
            </div>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
