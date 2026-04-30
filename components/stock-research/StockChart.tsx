import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { StockChartPoint } from '@/types/stock'

interface Props {
  points: StockChartPoint[]
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function StockChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-xs text-muted-foreground rounded-lg bg-muted">
        데이터 없음
      </div>
    )
  }

  const data = points.map((p) => ({ time: formatTime(p.timestamp), close: p.close }))

  return (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground mb-1">당일 차트</p>
      <div className="h-[120px] rounded-lg border bg-background p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(v) => [Number(v).toFixed(2), '가격']}
            />
            <Line
              type="monotone"
              dataKey="close"
              dot={false}
              strokeWidth={1.5}
              stroke="currentColor"
              className="text-foreground"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
