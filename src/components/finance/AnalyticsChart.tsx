import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { formatBRL } from '../../lib/currency'

interface AnalyticsChartProps {
  data: { label: string; entradas: number; saidas: number }[]
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="mt-3 h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#808f8c' }} />
          <Tooltip
            cursor={{ fill: 'rgba(107,166,160,0.08)' }}
            formatter={(v: unknown) => `R$ ${formatBRL(Number(v as number))}`}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-forest-100)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-forest-900)' }}
            itemStyle={{ color: 'var(--color-forest-700)' }}
          />
          <Bar dataKey="entradas" fill="#6ba6a0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="saidas" fill="#ff8a7a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
