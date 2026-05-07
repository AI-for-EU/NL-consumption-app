// Fuzzy map: user-typed or voice-spoken term → product ID
// Covers English, Dutch, and common variations
export const PRODUCT_FUZZY_MAP: Record<string, string> = {
  // Dairy
  milk: 'milk-full-1l', melk: 'milk-full-1l', 'volle melk': 'milk-full-1l',
  'full fat milk': 'milk-full-1l', halfvolle: 'milk-full-1l',
  butter: 'butter-250g', boter: 'butter-250g', margarine: 'butter-250g',
  eggs: 'eggs-6pk', egg: 'eggs-6pk', eieren: 'eggs-6pk', ei: 'eggs-6pk',
  cheese: 'cheese-gouda-500g', kaas: 'cheese-gouda-500g', gouda: 'cheese-gouda-500g',
  yogurt: 'yogurt-greek-500g', yoghurt: 'yogurt-greek-500g', kwark: 'yogurt-greek-500g',
  hagelslag: 'hagelslag-400g', 'chocolate sprinkles': 'hagelslag-400g',

  // Bread & Bakery
  bread: 'bread-whole-wheat', brood: 'bread-whole-wheat', volkorenbrood: 'bread-whole-wheat',
  'whole wheat': 'bread-whole-wheat', 'wholegrain bread': 'bread-whole-wheat',
  croissants: 'croissants-4pk', croissant: 'croissants-4pk',
  beschuit: 'beschuit-pack', rusks: 'beschuit-pack',

  // Meat & Fish
  chicken: 'chicken-breast-500g', kip: 'chicken-breast-500g', 'chicken breast': 'chicken-breast-500g',
  kipfilet: 'chicken-breast-500g', 'chicken fillets': 'chicken-breast-500g',
  beef: 'beef-mince-500g', gehakt: 'beef-mince-500g', rundergehakt: 'beef-mince-500g',
  'ground beef': 'beef-mince-500g', 'minced beef': 'beef-mince-500g', mince: 'beef-mince-500g',
  salmon: 'salmon-fillet-300g', zalm: 'salmon-fillet-300g', 'salmon fillet': 'salmon-fillet-300g',
  ham: 'deli-ham-150g', 'deli ham': 'deli-ham-150g', achterham: 'deli-ham-150g',
  tuna: 'tuna-canned-185g', tonijn: 'tuna-canned-185g', 'canned tuna': 'tuna-canned-185g',

  // Fruits & Veg
  apples: 'apples-1kg', apple: 'apples-1kg', appels: 'apples-1kg', appel: 'apples-1kg',
  bananas: 'bananas-1kg', banana: 'bananas-1kg', bananen: 'bananas-1kg', banaan: 'bananas-1kg',
  tomatoes: 'tomatoes-500g', tomato: 'tomatoes-500g', tomaten: 'tomatoes-500g', tomaat: 'tomatoes-500g',
  cucumber: 'cucumber-1pcs', komkommer: 'cucumber-1pcs',
  broccoli: 'broccoli-1pcs',

  // Pantry
  pasta: 'pasta-spaghetti-500g', spaghetti: 'pasta-spaghetti-500g', penne: 'pasta-spaghetti-500g',
  rice: 'rice-basmati-1kg', rijst: 'rice-basmati-1kg', basmati: 'rice-basmati-1kg',
  'tomato sauce': 'tomato-sauce-500ml', pastasaus: 'tomato-sauce-500ml', 'pasta sauce': 'tomato-sauce-500ml',
  'olive oil': 'olive-oil-500ml', olijfolie: 'olive-oil-500ml', oil: 'olive-oil-500ml',
  cereal: 'cornflakes-500g', cornflakes: 'cornflakes-500g', muesli: 'cornflakes-500g',
  granola: 'cornflakes-500g', granen: 'cornflakes-500g',

  // Beverages
  'orange juice': 'oj-1l', 'sinaasappelsap': 'oj-1l', oj: 'oj-1l', juice: 'oj-1l', sap: 'oj-1l',
  coffee: 'coffee-beans-500g', koffie: 'coffee-beans-500g', 'coffee beans': 'coffee-beans-500g',
  beer: 'heineken-6pk', bier: 'heineken-6pk', heineken: 'heineken-6pk',
  water: 'water-sparkling-1-5l', 'sparkling water': 'water-sparkling-1-5l', bruiswater: 'water-sparkling-1-5l',

  // Frozen
  pizza: 'frozen-pizza-400g', 'frozen pizza': 'frozen-pizza-400g', diepvriespizza: 'frozen-pizza-400g',
  fries: 'frozen-fries-1kg', friet: 'frozen-fries-1kg', patat: 'frozen-fries-1kg',
  'french fries': 'frozen-fries-1kg', 'frozen fries': 'frozen-fries-1kg',

  // Personal care
  shampoo: 'shampoo-400ml',
  toothpaste: 'toothpaste-100ml', tandpasta: 'toothpaste-100ml',

  // Household
  laundry: 'laundry-1-5l', wasmiddel: 'laundry-1-5l', 'laundry detergent': 'laundry-1-5l',
  'toilet paper': 'toilet-paper-8pk', toiletpapier: 'toilet-paper-8pk', wc: 'toilet-paper-8pk',

  // Snacks
  stroopwafels: 'stroopwafels-8pk', stroopwafel: 'stroopwafels-8pk',
  chips: 'chips-200g', crisps: 'chips-200g', 'potato chips': 'chips-200g',
}

export function findProductId(query: string): string | null {
  const q = query.toLowerCase().trim()
  // Exact match
  if (PRODUCT_FUZZY_MAP[q]) return PRODUCT_FUZZY_MAP[q]
  // Partial match (query contains key)
  const partial = Object.keys(PRODUCT_FUZZY_MAP).find(
    (k) => q.includes(k) || k.includes(q)
  )
  return partial ? PRODUCT_FUZZY_MAP[partial] : null
}

export function parseQuantityAndItem(input: string): { quantity: number; unit: string; name: string } {
  // Match patterns like "2 liters milk", "500g cheese", "3x bread", "milk x2"
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|liter|liters|stuks|pack|packs|x)?\s+(.+)$/i,
    /^(\d+(?:\.\d+)?)\s*x\s*(.+)$/i,
    /^(.+?)\s+x\s*(\d+(?:\.\d+)?)$/i,
  ]

  for (const re of patterns) {
    const m = input.match(re)
    if (m) {
      const qty = parseFloat(m[1] ?? m[2] ?? '1')
      const unit = (m[2] ?? '').toLowerCase().replace(/s$/, '') || 'x'
      const name = (m[3] ?? m[2] ?? m[1] ?? input).trim().toLowerCase()
      if (!isNaN(qty)) return { quantity: qty, unit, name }
    }
  }

  return { quantity: 1, unit: 'x', name: input.trim().toLowerCase() }
}
