export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center justify-between rounded-full border-[1.5px] border-forest-100 bg-white px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuir"
        className="flex size-7 items-center justify-center text-lg text-forest-700 disabled:opacity-30"
      >
        −
      </button>
      <span className="text-[15px] font-bold text-forest-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar"
        className="flex size-7 items-center justify-center text-lg text-forest-700 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
