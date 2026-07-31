export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? 'w-6 bg-teal-500' : 'w-1.5 bg-forest-100'
          }`}
        />
      ))}
    </div>
  )
}
