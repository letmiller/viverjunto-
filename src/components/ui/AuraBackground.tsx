interface Aura {
  color: 'coral' | 'teal' | 'amber'
  size: number
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
}

const auraColor: Record<Aura['color'], string> = {
  coral: 'var(--color-coral-300)',
  teal: 'var(--color-teal-300)',
  amber: 'var(--color-amber-300)',
}

/** Decorative blurred background blobs used behind onboarding/auth screens. */
export function AuraBackground({ auras }: { auras: Aura[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {auras.map((a, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-60 blur-3xl"
          style={{
            width: a.size,
            height: a.size,
            top: a.top,
            bottom: a.bottom,
            left: a.left,
            right: a.right,
            background: auraColor[a.color],
          }}
        />
      ))}
    </div>
  )
}
