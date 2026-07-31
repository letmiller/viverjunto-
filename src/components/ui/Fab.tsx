export function Fab({ onClick, label = 'Adicionar' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-[92px] right-5 z-20 flex size-14 items-center justify-center rounded-full bg-coral-700 text-2xl font-semibold text-white shadow-lg transition-transform active:scale-95"
    >
      +
    </button>
  )
}
