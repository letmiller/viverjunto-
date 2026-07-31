import logoMark from '../../assets/logo-mark.svg'

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <img src={logoMark} alt="" className="h-6 w-auto" />
        <span className="text-base font-bold text-forest-900">
          Viver<span className="text-teal-500">Junto</span>
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={logoMark} alt="Viver Junto" className="h-14 w-auto" />
      <p className="text-[42px] font-bold leading-none text-forest-900">
        Viver<span className="text-teal-500">Junto</span>
      </p>
    </div>
  )
}
