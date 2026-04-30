import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import type { StockResponse } from '@/types/stock'

function normalizeSymbol(raw: string): string {
  if (/^\d{6}$/.test(raw)) return raw + '.KS'
  return raw
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params
  const symbol = normalizeSymbol(rawSymbol)

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [quote, chartData, searchData] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.chart(symbol, { period1: today, interval: '5m' }).catch(() => null),
      yahooFinance.search(symbol, { newsCount: 5 }).catch(() => ({ news: [] })),
    ])

    if (!quote?.regularMarketPrice) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    }

    const chartPoints = ((chartData as { quotes?: { date: Date; close: number | null }[] })?.quotes ?? [])
      .filter((q) => q.close != null)
      .map((q) => ({
        timestamp: q.date instanceof Date ? q.date.getTime() : Number(q.date),
        close: q.close!,
      }))

    const rawNews = (searchData as { news?: { title: string; publisher: string; link: string }[] })?.news ?? []
    const news = rawNews.slice(0, 5).map((n) => ({
      title: n.title,
      publisher: n.publisher,
      url: n.link,
    }))

    const response: StockResponse = {
      quote: {
        symbol,
        name: (quote.longName ?? quote.shortName ?? symbol) as string,
        exchange: (quote.fullExchangeName ?? '') as string,
        currency: (quote.currency ?? 'USD') as string,
        price: quote.regularMarketPrice,
        change: (quote.regularMarketChange ?? 0) as number,
        changePercent: (quote.regularMarketChangePercent ?? 0) as number,
        dayLow: (quote.regularMarketDayLow ?? 0) as number,
        dayHigh: (quote.regularMarketDayHigh ?? 0) as number,
      },
      chart: chartPoints,
      news,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
  }
}
