// Logo oficial ViverJunto
// O ícone colorido do Figma (imgGroup5) — SVG fiel ao design

export function LogoIcon({ size = 32 }) {
  // SVG baseado no ícone do Figma: 4 quadrantes arredondados
  // Verde escuro (top-left), Azul (top-right), Coral (bottom-left), Verde claro (bottom-right)
  const s = size / 63
  return (
    <svg width={Math.round(63*s)} height={Math.round(55*s)} viewBox="0 0 63 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top-left — Verde escuro */}
      <rect x="0" y="0" width="28" height="28" rx="9" fill="#5B9E7A"/>
      {/* Top-right — Azul/teal */}
      <circle cx="47" cy="14" r="14" fill="#6BA6A0"/>
      {/* Bottom-left — Coral */}
      <circle cx="16" cy="41" r="14" fill="#FF8A7A"/>
      {/* Bottom-right — Verde claro */}
      <rect x="35" y="27" width="28" height="28" rx="9" fill="#8DC8A0"/>
    </svg>
  )
}

export function LogoFull({ size = 32, color = 'dark' }) {
  const textColor = color === 'white' ? '#fff' : '#2E3A37'
  const tealColor = color === 'white' ? '#D1E7E5' : '#6BA6A0'
  const fontSize = Math.round(size * 0.86)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <LogoIcon size={size} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ fontSize, fontWeight: 700, color: textColor, letterSpacing: '-0.01em' }}>Viver</span>
        <span style={{ fontSize, fontWeight: 700, color: tealColor, letterSpacing: '-0.01em' }}>Junto</span>
      </div>
    </div>
  )
}
