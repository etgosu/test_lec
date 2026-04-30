import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="text-2xl font-bold mb-1">
            {formatPrice(quote.price, quote.currency)}
          </div>
          <Badge variant={isPositive ? 'secondary' : 'destructive'}>
            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </Badge>
          <div className="flex gap-5 mt-2 text-xs text-muted-foreground">
            <span>저: {formatPrice(quote.dayLow, quote.currency)}</span>
            <span>고: {formatPrice(quote.dayHigh, quote.currency)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
