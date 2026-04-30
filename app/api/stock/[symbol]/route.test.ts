import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('yahoo-finance2', () => ({
  default: {
    quote: vi.fn(),
    chart: vi.fn(),
    search: vi.fn(),
  },
}))

import yahooFinance from 'yahoo-finance2'
import { GET } from './route'

const mockQuote = {
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

const mockChart = {
  quotes: [{ date: new Date('2024-01-01T09:30:00Z'), close: 192.45 }],
}

const mockSearch = {
  news: Array.from({ length: 3 }, (_, i) => ({
    title: `News ${i}`,
    publisher: 'Reuters',
    link: 'https://example.com',
  })),
}

function makeReq(symbol: string) {
  return new Request(`http://localhost/api/stock/${symbol}`) as never
}

function makeCtx(symbol: string) {
  return { params: Promise.resolve({ symbol }) }
}

describe('GET /api/stock/[symbol]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(yahooFinance.quote).mockResolvedValue(mockQuote as never)
    vi.mocked(yahooFinance.chart).mockResolvedValue(mockChart as never)
    vi.mocked(yahooFinance.search).mockResolvedValue(mockSearch as never)
  })

  it('returns 200 with USD quote fields for AAPL', async () => {
    const res = await GET(makeReq('AAPL'), makeCtx('AAPL'))
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
    vi.mocked(yahooFinance.quote).mockResolvedValue({
      ...mockQuote,
      symbol: '005930.KS',
      currency: 'KRW',
    } as never)
    const res = await GET(makeReq('005930'), makeCtx('005930'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.quote.symbol).toBe('005930.KS')
    expect(body.quote.currency).toBe('KRW')
    expect(vi.mocked(yahooFinance.quote)).toHaveBeenCalledWith('005930.KS')
  })

  it('does not double-append .KS when suffix is already present', async () => {
    vi.mocked(yahooFinance.quote).mockResolvedValue({
      ...mockQuote,
      symbol: '005930.KS',
      currency: 'KRW',
    } as never)
    await GET(makeReq('005930.KS'), makeCtx('005930.KS'))
    expect(vi.mocked(yahooFinance.quote)).toHaveBeenCalledWith('005930.KS')
  })

  it('returns 404 for unknown symbol', async () => {
    vi.mocked(yahooFinance.quote).mockRejectedValue(new Error('Not found'))
    const res = await GET(makeReq('XXXXXXX'), makeCtx('XXXXXXX'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('limits news to max 5 items', async () => {
    vi.mocked(yahooFinance.search).mockResolvedValue({
      news: Array.from({ length: 10 }, (_, i) => ({
        title: `News ${i}`,
        publisher: 'Test',
        link: 'https://example.com',
      })),
    } as never)
    const res = await GET(makeReq('AAPL'), makeCtx('AAPL'))
    const body = await res.json()
    expect(body.news.length).toBeLessThanOrEqual(5)
  })
})
