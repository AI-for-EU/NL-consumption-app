'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { CATEGORIES } from '@/data/categories'
import { UserBudget, UserProfile } from '@/types'
import { CheckCircle, ChevronRight, Euro, MapPin, Users, Loader2 } from 'lucide-react'
import { getBrowserLocation } from '@/lib/geolocation'
import { DUTCH_CITIES } from '@/lib/geolocation'

const STEPS = ['Household', 'Location', 'Groceries', 'Other', 'Done']

export default function BudgetSetup() {
  const { profile, updateProfile, refreshRecommendations } = useApp()
  const [step, setStep] = useState(0)
  const [locLoading, setLocLoading] = useState(false)
  const [budget, setBudget] = useState<UserBudget>(profile.budget)
  const [name, setName] = useState(profile.name || '')
  const [householdSize, setHouseholdSize] = useState(profile.householdSize)
  const [city, setCity] = useState(profile.city || '')

  const groceryCategories = CATEGORIES.filter((c) =>
    ['dairy', 'bread_bakery', 'meat_fish', 'fruits_veg', 'pantry', 'beverages', 'frozen'].includes(c.id)
  )
  const otherCategories = CATEGORIES.filter((c) =>
    ['personal_care', 'household', 'snacks'].includes(c.id)
  )

  function handleBudgetChange(key: keyof UserBudget, value: number) {
    setBudget((prev) => ({ ...prev, [key]: value }))
  }

  async function detectLocation() {
    setLocLoading(true)
    const loc = await getBrowserLocation()
    setLocLoading(false)
    if (loc) {
      setCity(loc.city)
      updateProfile({ location: loc, city: loc.city })
    }
  }

  function handleFinish() {
    const updatedProfile: Partial<UserProfile> = {
      name,
      householdSize,
      city,
      budget,
      setupComplete: true,
    }
    updateProfile(updatedProfile)
    setTimeout(() => refreshRecommendations(), 100)
    setStep(4)
  }

  const totalMonthly = Object.values(budget).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                i < step
                  ? 'bg-green-500 text-white'
                  : i === step
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Household */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
            <p className="text-sm text-gray-500 mt-1">We'll personalise your budget plan</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jan"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                <Users size={14} className="inline mr-1" />
                Household size
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, '6+'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setHouseholdSize(typeof n === 'string' ? 6 : n)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      householdSize === (typeof n === 'string' ? 6 : n)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {n} {typeof n === 'number' && n === 1 ? 'person' : 'people'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your location</h2>
            <p className="text-sm text-gray-500 mt-1">We'll find nearby supermarkets</p>
          </div>

          <button
            onClick={detectLocation}
            disabled={locLoading}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-xl py-4 text-orange-600 hover:bg-orange-50 transition font-medium"
          >
            {locLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
            {locLoading ? 'Detecting...' : 'Use my location'}
          </button>

          <div>
            <p className="text-xs text-gray-400 text-center mb-3">or select your city</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DUTCH_CITIES.map((c) => (
                <button
                  key={c.city}
                  onClick={() => {
                    setCity(c.city)
                    updateProfile({ city: c.city, location: c })
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    city === c.city
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Back</button>
            <button onClick={() => setStep(2)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition">
              Continue <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Grocery budgets */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Monthly grocery budget</h2>
            <p className="text-sm text-gray-500 mt-1">Drag or type your budget per category</p>
          </div>

          {groceryCategories.map((cat) => {
            const val = budget[cat.id as keyof UserBudget] ?? 0
            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {cat.icon} {cat.label}
                  </label>
                  <div className="flex items-center gap-1">
                    <Euro size={13} className="text-gray-400" />
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={val}
                      onChange={(e) => handleBudgetChange(cat.id as keyof UserBudget, Number(e.target.value))}
                      className="w-16 text-right text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={val}
                  onChange={(e) => handleBudgetChange(cat.id as keyof UserBudget, Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            )
          })}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition">
              Continue <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Other budgets */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Other monthly budgets</h2>
          </div>

          {[...otherCategories, { id: 'clothing', label: 'Clothing & Fashion', icon: '👕', color: '#6B7280' }].map((cat) => {
            const val = budget[cat.id as keyof UserBudget] ?? 0
            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {cat.icon} {cat.label}
                  </label>
                  <div className="flex items-center gap-1">
                    <Euro size={13} className="text-gray-400" />
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={val}
                      onChange={(e) => handleBudgetChange(cat.id as keyof UserBudget, Number(e.target.value))}
                      className="w-16 text-right text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  value={val}
                  onChange={(e) => handleBudgetChange(cat.id as keyof UserBudget, Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            )
          })}

          <div className="bg-orange-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-orange-800">Total monthly budget</span>
            <span className="text-xl font-bold text-orange-600">€{totalMonthly}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Back</button>
            <button onClick={handleFinish} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition">
              Generate Plan <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">You're all set{name ? `, ${name}` : ''}!</h2>
          <p className="text-gray-500">Your personalised shopping plan is ready. We'll alert you when prices drop.</p>
          <a
            href="/recommendations"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition mt-2"
          >
            View Shopping Plan <ChevronRight size={18} />
          </a>
        </div>
      )}
    </div>
  )
}
