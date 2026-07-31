export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-teal-500' : 'bg-forest-100'
      }`}
    >
      <span
        className={`absolute size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
