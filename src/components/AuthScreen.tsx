'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import OTPInput from './OTPInput'
import { Phone, Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react'

type Step = 'choose' | 'phone-entry' | 'otp-verify' | 'success'

interface Props {
  onSuccess?: () => void
  compact?: boolean
}

export default function AuthScreen({ onSuccess, compact = false }: Props) {
  const { signInWithPhone, verifyOTP, signInWithGoogle, signInWithMicrosoft, isConfigured } = useAuth()
  const [step, setStep] = useState<Step>('choose')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  function startCountdown() {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  async function handleSendOTP() {
    if (!phone.trim()) return
    setLoading(true); setError(null)
    const { error } = await signInWithPhone(phone.trim())
    setLoading(false)
    if (error) { setError(error); return }
    setStep('otp-verify')
    startCountdown()
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) return
    setLoading(true); setError(null)
    const { error } = await verifyOTP(phone.trim(), otp)
    setLoading(false)
    if (error) { setError(error); setOtp(''); return }
    setStep('success')
    setTimeout(() => onSuccess?.(), 1200)
  }

  async function handleGoogle() {
    setLoading(true); setError(null)
    const { error } = await signInWithGoogle()
    if (error) { setError(error); setLoading(false) }
  }

  async function handleMicrosoft() {
    setLoading(true); setError(null)
    const { error } = await signInWithMicrosoft()
    if (error) { setError(error); setLoading(false) }
  }

  async function handleResend() {
    if (countdown > 0) return
    setLoading(true); setError(null)
    const { error } = await signInWithPhone(phone.trim())
    setLoading(false)
    if (error) { setError(error); return }
    startCountdown()
  }

  const displayPhone = phone.startsWith('06')
    ? '+31' + phone.slice(1)
    : phone.startsWith('6') && phone.length === 9
    ? '+316' + phone.slice(1)
    : phone

  if (!isConfigured) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 ${compact ? '' : 'max-w-sm mx-auto'}`}>
        <div className="flex items-center gap-2 text-amber-700 font-semibold">
          <Settings size={18} /> Auth not configured
        </div>
        <p className="text-sm text-amber-600">
          To enable login, add your Supabase credentials to <code className="bg-amber-100 px-1 rounded">.env.local</code>.
          See <code className="bg-amber-100 px-1 rounded">.env.local.example</code> for the required keys.
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4'}>
      <div className={`bg-white rounded-3xl shadow-xl ${compact ? 'p-0' : 'p-8 w-full max-w-sm'}`}>
        {/* Logo */}
        {!compact && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg mb-4">
              🛒
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BudgetBoodschappen</h1>
            <p className="text-sm text-gray-400 mt-1">Smart shopping for the Netherlands 🇳🇱</p>
          </div>
        )}

        {/* ── CHOOSE METHOD ── */}
        {step === 'choose' && (
          <div className="space-y-3">
            {!compact && <h2 className="text-lg font-semibold text-gray-800 text-center mb-5">Sign in to your account</h2>}

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3.5 hover:bg-gray-50 transition font-medium text-gray-700 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Microsoft */}
            <button
              onClick={handleMicrosoft}
              disabled={loading}
              className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3.5 hover:bg-gray-50 transition font-medium text-gray-700 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Continue with Outlook / Microsoft
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Phone */}
            <button
              onClick={() => { setStep('phone-entry'); setError(null) }}
              className="w-full flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-4 py-3.5 transition font-medium"
            >
              <Phone size={18} />
              Continue with Phone Number
            </button>

            <p className="text-xs text-gray-400 text-center pt-1">
              By signing in you agree to our terms. Your data is stored securely in the EU.
            </p>
          </div>
        )}

        {/* ── PHONE ENTRY ── */}
        {step === 'phone-entry' && (
          <div className="space-y-5">
            <button onClick={() => { setStep('choose'); setError(null) }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Enter your phone number</h2>
              <p className="text-sm text-gray-400 mt-1">We'll send a 6-digit verification code via SMS</p>
            </div>

            <div className="space-y-2">
              <div className="flex rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent">
                <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-600 whitespace-nowrap">
                  🇳🇱 +31
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  placeholder="6 12345678"
                  className="flex-1 px-3 py-3.5 text-base focus:outline-none bg-white"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 pl-1">
                Enter your Dutch mobile number starting with 06 or 6
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading || !phone.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              Send verification code
            </button>
          </div>
        )}

        {/* ── OTP VERIFY ── */}
        {step === 'otp-verify' && (
          <div className="space-y-5">
            <button onClick={() => { setStep('phone-entry'); setOtp(''); setError(null) }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Check your phone</h2>
              <p className="text-sm text-gray-400 mt-1">
                We sent a 6-digit code to <span className="font-medium text-gray-600">{displayPhone}</span>
              </p>
            </div>

            <OTPInput value={otp} onChange={setOtp} disabled={loading} />

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Verify code
            </button>

            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-sm text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive it? Resend"}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verified!</h2>
            <p className="text-gray-500 text-sm">Signing you in…</p>
          </div>
        )}
      </div>
    </div>
  )
}
