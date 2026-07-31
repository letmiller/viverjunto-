import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ToastHost } from '../ui/ToastHost'

interface ScreenProps {
  children: ReactNode
  className?: string
  /**
   * Pins the frame to the viewport height and turns it into a flex column,
   * so a `flex-1 min-h-0 overflow-y-auto` content div inside becomes the
   * actual scroll region while a BottomNav sibling stays visually anchored
   * to the frame's bottom edge. Use on any screen with a BottomNav — without
   * it the frame just grows with content and the whole page scrolls, which
   * drags the "fixed" nav off-screen with it.
   */
  scroll?: boolean
}

/**
 * Centers app content in a phone-width column that scales up gracefully on
 * tablet/desktop, since the source design is a native-mobile layout (393px).
 */
export function Screen({ children, className = '', scroll = false }: ScreenProps) {
  return (
    <div className="min-h-svh w-full bg-app-bg sm:flex sm:items-center sm:justify-center sm:py-8">
      <div
        className={cn(
          'relative mx-auto w-full max-w-[430px] overflow-hidden bg-app-bg sm:rounded-[40px] sm:shadow-xl',
          scroll
            ? 'flex h-svh flex-col sm:h-[min(920px,calc(100svh-4rem))]'
            : 'min-h-svh sm:min-h-[min(920px,calc(100svh-4rem))]',
          className,
        )}
      >
        <ToastHost />
        {children}
      </div>
    </div>
  )
}
