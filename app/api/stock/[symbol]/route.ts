import { NextRequest, NextResponse } from 'next/server'
import { yfQuote, yfChart, yfSearch } from '@/lib/yahoo'
import { resolveKoreanStockName } from '@/lib/korean-stocks'
import type { StockResponse } from '@/types/stock'

function normalizeSymbol(raw: string): string {
  // 1. Try Korean stock name mapping
  if (!/^[0-9.A-Z]+$/i.test(raw)) {
    const koreanResolved = resolveKoreanStockName(raw)
    if (koreanResolved !== raw) return koreanResolved
  }

  // 2. Numeric 6-digit → .KS suffix
  if (/^\d{6}$/.test(raw)) return raw + '.KS'
  
  return raw
}

type SearchQuote = { symbol: string; quoteType?: string }

async function resolveSymbolAndQuote(
  input: string,
): Promise<{ symbol: string; quote: Record<string, unknown> }> {
  const normalized = normalizeSymbol(input)

  // 1차: 입력을 티커로 직접 시도
  try {
    const q = await yfQuote(normalized)
    const quote = q as Record<string, unknown>
    if (quote?.regularMarketPrice) return { symbol: normalized, quote }
  } catch {
    // fall through to name search
  }

  // 2차: 종목명 검색 → 첫 번째 EQUITY/ETF 심볼 획득
  const result = (await yfSearch(input, { quotesCount: 6, newsCount: 0 })) as {
    quotes?: SearchQuote[]
  }
  const found = (result?.quotes ?? []).find((q) =>
    ['EQUITY', 'ETF', 'FUND'].includes(q.quoteType ?? ''),
  )
  if (!found?.symbol) throw new Error('Symbol not found')

  const q2 = await yfQuote(found.symbol)
  const quote2 = q2 as Record<string, unknown>
  if (!quote2?.regularMarketPrice) throw new Error('Symbol not found')
  return { symbol: found.symbol, quote: quote2 }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawInput } = await params

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { symbol, quote } = await resolveSymbolAndQuote(rawInput)

    const [chartData, searchData] = await Promise.all([
      yfChart(symbol, { period1: today, interval: '5m' }).catch((e) => {
        console.error('[chart]', symbol, e)
        return null
      }),
      yfSearch(symbol, { newsCount: 5 }).catch(() => ({ news: [] })),
    ])

    const chartPoints = (
      (chartData as { quotes?: { date: Date; close: number | null }[] })?.quotes ?? []
    )
      .filter((p) => p.close != null)
      .map((p) => ({
        timestamp: p.date instanceof Date ? p.date.getTime() : Number(p.date),
        close: p.close!,
      }))

    const rawNews =
      (searchData as { news?: { title: string; publisher: string; link: string }[] })?.news ?? []
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
        price: quote.regularMarketPrice as number,
        change: (quote.regularMarketChange ?? 0) as number,
        changePercent: (quote.regularMarketChangePercent ?? 0) as number,
        dayLow: (quote.regularMarketDayLow ?? 0) as number,
        dayHigh: (quote.regularMarketDayHigh ?? 0) as number,
      },
      chart: chartPoints,
      news,
    }

    return NextResponse.json(response)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNotFound = /not found|no data|invalid/i.test(msg)
    return NextResponse.json(
      { error: isNotFound ? 'Symbol not found' : 'Failed to fetch data' },
      { status: isNotFound ? 404 : 502 },
    )
  }
}
