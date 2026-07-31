import type { PointerEvent } from 'react'

// A dedicated drag handle, not just a decorative icon — the touch target is
// sized well above the icon itself (44px, the usual minimum tap target)
// since a too-small grab area was hard to hit reliably on a phone. Dragging
// starts only from here (Reorder.Item uses dragListener={false} + these
// controls), so it never fights with taps on the row's other buttons.
export function DragGrip({ onPointerDown }: { onPointerDown: (e: PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      aria-label="Arrastar para reordenar"
      role="button"
      style={{ touchAction: 'none' }}
      className="-my-2 -ml-1 flex size-11 shrink-0 cursor-grab items-center justify-center text-forest-300 active:cursor-grabbing"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <circle cx="5" cy="3" r="1.3" />
        <circle cx="11" cy="3" r="1.3" />
        <circle cx="5" cy="8" r="1.3" />
        <circle cx="11" cy="8" r="1.3" />
        <circle cx="5" cy="13" r="1.3" />
        <circle cx="11" cy="13" r="1.3" />
      </svg>
    </div>
  )
}
