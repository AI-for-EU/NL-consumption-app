'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, X, Volume2, AlertCircle, CheckCircle, Settings } from 'lucide-react'

interface Props {
  onItemsCollected: (items: string[]) => void
}

type CallStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended' | 'error'

const VAPI_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

const ASSISTANT_CONFIG = {
  name: 'BudgetBoodschappen Assistant',
  model: {
    provider: 'openai' as const,
    model: 'gpt-4o',
    messages: [
      {
        role: 'system' as const,
        content: `You are a friendly shopping assistant for BudgetBoodschappen, a Dutch grocery budgeting app.

Your ONLY job is to help the user build their shopping list through conversation.

LANGUAGE: Detect the user's language from their first message and respond in the SAME language.
Support: Dutch, English, Hindi, French, German, Polish, Turkish.

HOW TO RUN THE CONVERSATION:
1. Greet warmly and ask what they need to buy this week.
2. As they mention items, CONFIRM quantities:
   - "How much milk do you need?" → "2 liters"
   - "Any fruit?" → "bananas and apples"
3. Accept items naturally: "I need milk, eggs, and some chicken"
4. After each item or group, briefly confirm: "Got it — 2L milk ✓"
5. When the user says "that's all" / "done" / "klaar" / "bas": summarize the full list and say "Your list is ready!"

IMPORTANT:
- Keep responses SHORT (1-2 sentences max).
- Do NOT give prices, recommendations, or other advice.
- Do NOT mention store names.
- Extract items with quantities when mentioned.
- End the call naturally after the list is confirmed.`,
      },
    ],
    functions: [
      {
        name: 'submitShoppingList',
        description: 'Called when the user has finished adding all items and the list is ready',
        parameters: {
          type: 'object' as const,
          properties: {
            items: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of items with quantities, e.g. ["2 liters milk", "500g chicken", "brood"]',
            },
          },
          required: ['items'],
        },
      },
    ],
  },
  voice: { provider: 'playht' as const, voiceId: 'jennifer' },
  transcriber: { provider: 'deepgram' as const, model: 'nova-2-general', language: 'multi' },
  firstMessage: "Hi! I'm your shopping assistant. What do you need to buy this week? You can speak in any language! 🛒",
}

export default function VoiceAgent({ onItemsCollected }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CallStatus>('idle')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [collectedItems, setCollectedItems] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const vapiRef = useRef<any>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const startCall = useCallback(async () => {
    if (!VAPI_KEY) { setErrorMsg('Vapi API key not configured'); setStatus('error'); return }
    setStatus('connecting'); setTranscript([]); setCollectedItems([]); setErrorMsg(null)

    try {
      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(VAPI_KEY)
      vapiRef.current = vapi

      vapi.on('call-start', () => setStatus('listening'))
      vapi.on('call-end', () => setStatus('ended'))
      vapi.on('speech-start', () => setStatus('speaking'))
      vapi.on('speech-end', () => setStatus('listening'))
      vapi.on('error', (e: Error) => {
        setErrorMsg(e?.message ?? 'Voice call error')
        setStatus('error')
      })
      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          setTranscript((prev) => [...prev, { role: msg.role, text: msg.transcript }])
        }
        if (msg.type === 'function-call' && msg.functionCall?.name === 'submitShoppingList') {
          const items: string[] = msg.functionCall.parameters?.items ?? []
          setCollectedItems(items)
          setStatus('ended')
        }
      })

      await vapi.start(ASSISTANT_CONFIG as any)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Failed to start voice call')
      setStatus('error')
    }
  }, [])

  const stopCall = useCallback(() => {
    vapiRef.current?.stop()
    setStatus('ended')
  }, [])

  function handleAccept() {
    onItemsCollected(collectedItems)
    setOpen(false)
    setStatus('idle')
    setTranscript([])
    setCollectedItems([])
  }

  function handleClose() {
    stopCall()
    setOpen(false)
    setStatus('idle')
    setTranscript([])
    setCollectedItems([])
  }

  const isActive = status === 'listening' || status === 'speaking' || status === 'connecting'

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 lg:bottom-8 lg:right-8 lg:left-auto lg:translate-x-0
          w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all
          ${isActive ? 'bg-red-500 scale-110 animate-pulse' : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'}
          text-white`}
        aria-label="Voice shopping assistant"
      >
        <Mic size={24} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-red-500' : 'bg-orange-500'} text-white`}>
                  {isActive ? <Volume2 size={20} className="animate-bounce" /> : <Mic size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">Voice Shopping Assistant</p>
                  <p className="text-xs text-gray-400">
                    {status === 'idle' && 'Ready to listen'}
                    {status === 'connecting' && 'Connecting…'}
                    {status === 'listening' && '🎤 Listening…'}
                    {status === 'speaking' && '🔊 Speaking…'}
                    {status === 'ended' && 'List complete!'}
                    {status === 'error' && 'Error occurred'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[200px]">
              {/* Not configured */}
              {!VAPI_KEY && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <Settings size={16} /> Vapi API key not configured
                  </div>
                  <p className="text-xs text-amber-600">
                    Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> to your environment.
                    Get your free key at vapi.ai
                  </p>
                  <DemoMode onDemo={(items) => { setCollectedItems(items); setStatus('ended') }} />
                </div>
              )}

              {/* Error */}
              {status === 'error' && errorMsg && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorMsg}
                </div>
              )}

              {/* Transcript */}
              {transcript.length > 0 && (
                <div className="space-y-2">
                  {transcript.map((t, i) => (
                    <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        t.role === 'user'
                          ? 'bg-orange-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {/* Waveform animation while active */}
              {isActive && (
                <div className="flex items-center justify-center gap-1 py-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-orange-400 rounded-full"
                      style={{
                        height: `${12 + Math.random() * 24}px`,
                        animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Collected items */}
              {status === 'ended' && collectedItems.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle size={16} /> {collectedItems.length} items collected
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {collectedItems.map((item, i) => (
                      <span key={i} className="bg-white border border-green-200 text-green-800 text-xs px-2.5 py-1 rounded-xl font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Multilingual tip */}
              {status === 'idle' && VAPI_KEY && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-gray-500">Speak in any language</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                    {['🇳🇱 Nederlands', '🇬🇧 English', '🇩🇪 Deutsch', '🇫🇷 Français', '🇮🇳 हिंदी', '🇵🇱 Polski'].map((l) => (
                      <span key={l} className="bg-gray-100 px-2 py-1 rounded-lg">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              {status === 'idle' && VAPI_KEY && (
                <button onClick={startCall} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition">
                  <Mic size={18} /> Start talking
                </button>
              )}
              {isActive && (
                <button onClick={stopCall} className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition">
                  <MicOff size={18} /> Stop recording
                </button>
              )}
              {status === 'ended' && collectedItems.length > 0 && (
                <button onClick={handleAccept} className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition">
                  <CheckCircle size={18} /> Add {collectedItems.length} items to basket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Demo mode to show UX without Vapi key
function DemoMode({ onDemo }: { onDemo: (items: string[]) => void }) {
  const [running, setRunning] = useState(false)
  const DEMO_ITEMS = ['2 liters milk', '1 brood', 'eieren 6 stuks', '500g kip', 'pasta 2 packs', 'tomaten', '6 heineken']

  function runDemo() {
    setRunning(true)
    setTimeout(() => {
      onDemo(DEMO_ITEMS)
      setRunning(false)
    }, 1500)
  }

  return (
    <button
      onClick={runDemo}
      disabled={running}
      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50 mt-2"
    >
      {running ? '🎤 Simulating…' : '▶ Run demo (no key needed)'}
    </button>
  )
}
