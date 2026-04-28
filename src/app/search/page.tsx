import SearchProducts from '@/components/SearchProducts'

export const metadata = { title: 'Search Products — BudgetBoodschappen' }

export default function SearchPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Search Products</h1>
        <p className="text-gray-500 text-sm mt-1">Find any product and instantly compare prices across all supermarkets.</p>
      </div>
      <SearchProducts />
    </div>
  )
}
