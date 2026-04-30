import { cn } from '@/lib/utils'
import type { StockQuote } from '@/types/stock'

interface Props {
  quote: StockQuote
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'KRW' ? 0 : 2 }).format(price)
  } catch {
    return String(price)
  }
}

export default function PriceBlock({ quote }: Props) {
  const isPositive = quote.changePercent >= 0

  return (
    <div>
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1">
          {quote.exchange} · {quote.symbol}
        </div>
        <div className="font-bold text-base">{quote.name}</div>
      </div>

      <div className="rounded-lg bg-muted p-4 mb-4">
        <div className="text-2xl font-bold mb-1">
          {formatPrice(quote.price, quote.currency)}
        </div>
        <div className={cn('text-sm font-bold', isPositive ? 'text-green-600' : 'text-red-600')}>
          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
        </div>
        <div className="flex gap-5 mt-2 text-xs text-muted-foreground">
          <span>{formatPrice(quote.dayLow, quote.currency)}</span>
          <span>{formatPrice(quote.dayHigh, quote.currency)}</span>
        </div>
      </div>
    </div>
  )
}
