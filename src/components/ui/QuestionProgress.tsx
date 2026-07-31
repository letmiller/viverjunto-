export function QuestionProgress({ answered, total }: { answered: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-100">
        <div
          className="h-full rounded-full bg-teal-500 transition-all"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-forest-500">
        {answered} de {total}
      </span>
    </div>
  )
}
