import { useToastStore } from '../../store/toast'

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto max-w-full truncate rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.tone === 'error' ? 'bg-error' : 'bg-ink'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
