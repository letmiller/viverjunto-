import { useState } from 'react'

export interface CategoryOption {
  id: string
  icon: string
  label: string
}

export function CategoryPicker({
  presets,
  value,
  onChange,
}: {
  presets: CategoryOption[]
  value: string
  onChange: (label: string) => void
}) {
  const [customOptions, setCustomOptions] = useState<CategoryOption[]>([])
  const [adding, setAdding] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  const options = [...presets, ...customOptions]

  function addCustom() {
    // Collapse stray whitespace so "Pet", " Pet", and "Pet  " don't become
    // three different categories that silently fragment reports/budgets.
    const label = customLabel.trim().replace(/\s+/g, ' ')
    if (!label) return

    const existingMatch = options.find((o) => o.label.toLowerCase() === label.toLowerCase())
    if (existingMatch) {
      onChange(existingMatch.label)
    } else {
      const option: CategoryOption = { id: `custom-${label}`, icon: '🏷️', label }
      setCustomOptions((prev) => [...prev, option])
      onChange(label)
    }
    setCustomLabel('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.label)}
            className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-2 text-[13px] transition-colors ${
              value === opt.label ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 bg-surface text-forest-700'
            }`}
          >
            <span>{opt.icon}</span> {opt.label}
          </button>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-forest-300 px-3 py-2 text-[13px] text-forest-500"
          >
            + Nova
          </button>
        )}
      </div>
      {adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 rounded-xl border-[1.5px] border-forest-100 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white"
          >
            Ok
          </button>
        </div>
      )}
    </div>
  )
}
