'use client'

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export default function OTPInput({ length = 6, value, onChange, disabled }: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function handleChange(e: ChangeEvent<HTMLInputElement>, idx: number) {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = ch
    onChange(next.join(''))
    if (ch && idx < length - 1) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < length - 1) inputs.current[idx + 1]?.focus()
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, '').slice(0, length))
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none
            ${d ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-900'}
            focus:border-orange-500 focus:ring-2 focus:ring-orange-200
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  )
}
