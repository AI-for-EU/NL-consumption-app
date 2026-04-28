import LoyaltyCards from '@/components/LoyaltyCards'

export const metadata = { title: 'Loyalty Cards — BudgetBoodschappen' }

export default function LoyaltyPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Cards</h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect all your Dutch loyalty cards — AH Bonus, Jumbo Extra's, Etos, Kruidvat & more — and track your points in one place.
        </p>
      </div>
      <LoyaltyCards />
    </div>
  )
}
