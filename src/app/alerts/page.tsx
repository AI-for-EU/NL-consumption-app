import AlertCenter from '@/components/AlertCenter'

export const metadata = { title: 'Price Alerts — BudgetBoodschappen' }

export default function AlertsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Get notified instantly when prices drop or new offers start at any tracked supermarket.
        </p>
      </div>
      <AlertCenter />
    </div>
  )
}
