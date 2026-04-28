import PriceComparison from '@/components/PriceComparison'

export const metadata = { title: 'Price Comparison — BudgetBoodschappen' }

export default function ComparePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Price Comparison</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compare live prices across Albert Heijn, Jumbo, Lidl, Aldi, Plus, Dirk & Hoogvliet.
          Green = cheapest. Prices update every 30 seconds.
        </p>
      </div>
      <PriceComparison />
    </div>
  )
}
