import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import PriceTicker from '@/components/PriceTicker'
import { AppProvider } from '@/context/AppContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BudgetBoodschappen — Smart Grocery Budgeting Netherlands',
  description: 'Track supermarket prices across Albert Heijn, Jumbo, Lidl, Aldi and more. Get personalised shopping recommendations to save money on your Dutch grocery budget.',
  keywords: 'supermarkt, boodschappen, budget, Netherlands, Albert Heijn, Jumbo, Lidl, Aldi, prijsvergelijking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <AppProvider>
          {/* Price ticker at the very top */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <PriceTicker />
          </div>

          <Navigation />

          {/* Main content area */}
          <div className="lg:ml-64">
            {/* Mobile top bar offset + ticker offset */}
            <div className="h-9" /> {/* ticker height */}
            <main className="min-h-screen pt-16 lg:pt-4 pb-24 lg:pb-8 px-4 sm:px-6 max-w-5xl mx-auto">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
