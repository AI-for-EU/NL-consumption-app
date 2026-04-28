import BudgetSetup from '@/components/BudgetSetup'

export const metadata = { title: 'My Budget — BudgetBoodschappen' }

export default function BudgetPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Budget</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set your monthly spending limits per category to get personalised supermarket recommendations.
        </p>
      </div>
      <BudgetSetup />
    </div>
  )
}
