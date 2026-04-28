import { Category } from '@/types'

export const CATEGORIES: Category[] = [
  {
    id: 'dairy',
    label: 'Dairy',
    icon: '🥛',
    color: '#3B82F6',
    subcategories: ['Milk', 'Cheese', 'Butter & Spreads', 'Yogurt & Desserts', 'Eggs', 'Cream'],
  },
  {
    id: 'bread_bakery',
    label: 'Bread & Bakery',
    icon: '🍞',
    color: '#F59E0B',
    subcategories: ['Bread', 'Rolls & Buns', 'Croissants & Pastry', 'Cake & Cookies', 'Crackers'],
  },
  {
    id: 'meat_fish',
    label: 'Meat & Fish',
    icon: '🥩',
    color: '#EF4444',
    subcategories: ['Chicken & Poultry', 'Beef & Pork', 'Lamb', 'Fish & Seafood', 'Deli Meats', 'Sausages'],
  },
  {
    id: 'fruits_veg',
    label: 'Fruits & Vegetables',
    icon: '🥦',
    color: '#10B981',
    subcategories: ['Fresh Vegetables', 'Salads', 'Fresh Fruit', 'Tropical Fruit', 'Herbs', 'Mushrooms'],
  },
  {
    id: 'pantry',
    label: 'Pantry & Dry Goods',
    icon: '🫙',
    color: '#8B5CF6',
    subcategories: ['Pasta & Rice', 'Canned Goods', 'Sauces & Condiments', 'Oil & Vinegar', 'Baking', 'Cereal & Granola'],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    icon: '🥤',
    color: '#06B6D4',
    subcategories: ['Coffee & Tea', 'Juice & Smoothies', 'Soft Drinks', 'Water', 'Beer & Cider', 'Wine & Spirits'],
  },
  {
    id: 'frozen',
    label: 'Frozen',
    icon: '🧊',
    color: '#6366F1',
    subcategories: ['Frozen Meals', 'Frozen Vegetables', 'Frozen Fish', 'Ice Cream', 'Frozen Pizza'],
  },
  {
    id: 'personal_care',
    label: 'Personal Care',
    icon: '🧴',
    color: '#EC4899',
    subcategories: ['Shampoo & Conditioner', 'Toothpaste & Oral Care', 'Skincare', 'Deodorant', 'Soap & Shower'],
  },
  {
    id: 'household',
    label: 'Household',
    icon: '🧹',
    color: '#64748B',
    subcategories: ['Cleaning Products', 'Laundry', 'Paper Products', 'Bin Bags & Foil', 'Dishwashing'],
  },
  {
    id: 'snacks',
    label: 'Snacks',
    icon: '🍿',
    color: '#F97316',
    subcategories: ['Chips & Crisps', 'Nuts & Dried Fruit', 'Chocolate & Sweets', 'Biscuits', 'Popcorn'],
  },
]

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)

export const BUDGET_LABELS: Record<string, string> = {
  dairy: 'Dairy & Eggs',
  bread_bakery: 'Bread & Bakery',
  meat_fish: 'Meat & Fish',
  fruits_veg: 'Fruits & Vegetables',
  pantry: 'Pantry & Dry Goods',
  beverages: 'Beverages',
  frozen: 'Frozen Foods',
  personal_care: 'Personal Care',
  household: 'Household',
  snacks: 'Snacks',
  clothing: 'Clothing & Fashion',
}
