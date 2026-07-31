import { useId, useState, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// Floating-label "outlined" field: the placeholder sits centered like normal
// until the field is focused or has a value, then it floats above the border
// with a bg-surface patch behind it to cut the border line — matches the
// two-state (empty vs filled) look in the design instead of a plain
// placeholder-only box.
export function Input({ label, error, id, className = '', type, placeholder, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const floatText = label ?? placeholder

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={inputId}
          type={isPassword ? (revealed ? 'text' : 'password') : type}
          placeholder={floatText ? ' ' : placeholder}
          className={`peer w-full rounded-lg border-[1.5px] border-forest-100 bg-surface px-4 py-4 text-[15px] text-forest-900 outline-none transition-colors focus:border-teal-500 ${
            floatText ? 'placeholder-shown:border-forest-100 not-placeholder-shown:border-teal-500' : ''
          } ${error ? '!border-error' : ''} ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {floatText && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 bg-surface px-1 text-[15px] text-forest-500 transition-all duration-150
              peer-focus:top-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-teal-700
              peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:font-medium peer-not-placeholder-shown:text-teal-700
              ${error ? 'peer-not-placeholder-shown:text-error peer-focus:text-error' : ''}`}
          >
            {floatText}
          </span>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-forest-500 hover:text-forest-700"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a13.2 13.2 0 0 1-3.1 3.8M6.6 6.6C3.6 8.4 1 12 1 12s4 7 11 7a10.7 10.7 0 0 0 3.4-.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
