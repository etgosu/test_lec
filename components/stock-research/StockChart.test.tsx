import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import StockChart from './StockChart'
import type { StockChartPoint } from '@/types/stock'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 400, height: 120 }}>{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Line: () => <polyline />,
  XAxis: () => null,
  Tooltip: () => null,
}))

const points: StockChartPoint[] = [
  { timestamp: Date.now() - 3600000, close: 189 },
  { timestamp: Date.now() - 1800000, close: 192 },
  { timestamp: Date.now(), close: 195 },
]

describe('StockChart', () => {
  it('renders an svg element when data is provided', () => {
    render(<StockChart points={points} />)
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('shows "데이터 없음" message when points array is empty', () => {
    render(<StockChart points={[]} />)
    expect(screen.getByText('데이터 없음')).toBeInTheDocument()
  })
})
