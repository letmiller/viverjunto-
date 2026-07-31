import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null

  // Rendered via portal so its `fixed` positioning is always relative to the
  // viewport, never to whichever scrolled card happens to be its DOM parent
  // (a nested card inside a scrollable list would otherwise misplace the
  // sheet — it'd anchor to that list's scroll offset instead of the screen).
  return createPortal(
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div className="relative z-10 mx-auto flex max-h-[85%] w-full max-w-[430px] flex-col gap-4 rounded-t-[32px] bg-surface p-6 pb-8 shadow-xl sm:rounded-[32px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-forest-100" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-forest-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-full bg-forest-50 text-forest-500"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
