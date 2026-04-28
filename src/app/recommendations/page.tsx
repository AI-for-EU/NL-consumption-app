import Recommendations from '@/components/Recommendations'

export const metadata = { title: 'Shopping Plan — BudgetBoodschappen' }

export default function RecommendationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Shopping Plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your personalised mix of supermarkets to get the best value for your monthly budget.
        </p>
      </div>
      <Recommendations />
    </div>
  )
}
