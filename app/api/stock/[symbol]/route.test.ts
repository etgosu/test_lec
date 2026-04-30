import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/yahoo', () => ({
  yfQuote: vi.fn(),
  yfChart: vi.fn(),
  yfSearch: vi.fn(),
}))

import { yfQuote, yfChart, yfSearch } from '@/lib/yahoo'
import { GET } from './route'

const baseQuote = {
  symbol: 'AAPL',
  longName: 'Apple Inc.',
  fullExchangeName: 'NasdaqGS',
  currency: 'USD',
  regularMarketPrice: 192.45,
  regularMarketChange: 2.34,
  regularMarketChangePercent: 1.23,
  regularMarketDayLow: 189.2,
  regularMarketDayHigh: 194.8,
}

const baseChart = {
  quotes: [{ date: new Date('2024-01-01T09:30:00Z'), close: 192.45 }],
}

const baseSearch = {
  news: Array.from({ length: 3 }, (_, i) => ({
    title: `News ${i}`,
    publisher: 'Reuters',
    link: 'https://example.com',
  })),
}

function makeCtx(symbol: string) {
  return { params: Promise.resolve({ symbol }) }
}

describe('GET /api/stock/[symbol]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(yfQuote).mockResolvedValue(baseQuote)
    vi.mocked(yfChart).mockResolvedValue(baseChart)
    vi.mocked(yfSearch).mockResolvedValue(baseSearch)
  })

  it('returns 200 with USD quote fields for AAPL', async () => {
    const res = await GET({} as never, makeCtx('AAPL'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.quote.currency).toBe('USD')
    expect(body.quote.price).toBe(192.45)
    expect(body.quote.change).toBe(2.34)
    expect(body.quote.changePercent).toBe(1.23)
    expect(body.quote.dayLow).toBe(189.2)
    expect(body.quote.dayHigh).toBe(194.8)
  })

  it('auto-appends .KS for 6-digit code', async () => {
    vi.mocked(yfQuote).mockResolvedValue({ ...baseQuote, symbol: '005930.KS', currency: 'KRW' })
    const res = await GET({} as never, makeCtx('005930'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.quote.symbol).toBe('005930.KS')
    expect(body.quote.currency).toBe('KRW')
    expect(yfQuote).toHaveBeenCalledWith('005930.KS')
  })

  it('does not double-append .KS when suffix is already present', async () => {
    vi.mocked(yfQuote).mockResolvedValue({ ...baseQuote, symbol: '005930.KS', currency: 'KRW' })
    await GET({} as never, makeCtx('005930.KS'))
    expect(yfQuote).toHaveBeenCalledWith('005930.KS')
  })

  it('returns 404 for unknown symbol', async () => {
    vi.mocked(yfQuote).mockRejectedValue(new Error('Not found'))
    const res = await GET({} as never, makeCtx('XXXXXXX'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('resolves by company name when direct ticker lookup fails', async () => {
    vi.mocked(yfQuote)
      .mockRejectedValueOnce(new Error('Not found'))       // 1차 직접 조회 실패
      .mockResolvedValueOnce(baseQuote)                    // 심볼 확정 후 재조회
    vi.mocked(yfSearch)
      .mockResolvedValueOnce({                             // 이름 검색 → 심볼 획득
        quotes: [{ symbol: 'AAPL', quoteType: 'EQUITY' }],
        news: [],
      })
      .mockResolvedValue(baseSearch)                       // 뉴스 조회
    const res = await GET({} as never, makeCtx('Apple'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.quote.symbol).toBe('AAPL')
    expect(yfSearch).toHaveBeenCalledWith('Apple', expect.objectContaining({ quotesCount: 6 }))
  })

  it('limits news to max 5 items', async () => {
    vi.mocked(yfSearch).mockResolvedValue({
      news: Array.from({ length: 10 }, (_, i) => ({
        title: `News ${i}`,
        publisher: 'Test',
        link: 'https://example.com',
      })),
    })
    const res = await GET({} as never, makeCtx('AAPL'))
    const body = await res.json()
    expect(body.news.length).toBeLessThanOrEqual(5)
  })
})
