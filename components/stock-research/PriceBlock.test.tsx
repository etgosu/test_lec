import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PriceBlock from './PriceBlock'
import type { StockQuote } from '@/types/stock'

const usdQuote: StockQuote = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NasdaqGS',
  currency: 'USD',
  price: 192.45,
  change: 2.34,
  changePercent: 1.23,
  dayLow: 189.2,
  dayHigh: 194.8,
}

const krwQuote: StockQuote = {
  symbol: '005930.KS',
  name: '삼성전자',
  exchange: 'KRX',
  currency: 'KRW',
  price: 57800,
  change: -1200,
  changePercent: -2.03,
  dayLow: 57200,
  dayHigh: 59400,
}

describe('PriceBlock', () => {
  it('displays stock name and exchange', () => {
    render(<PriceBlock quote={usdQuote} />)
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText(/NasdaqGS/)).toBeInTheDocument()
  })

  it('displays USD price with $ prefix', () => {
    render(<PriceBlock quote={usdQuote} />)
    expect(screen.getByText(/\$192\.45/)).toBeInTheDocument()
  })

  it('displays KRW price with ₩ prefix', () => {
    render(<PriceBlock quote={krwQuote} />)
    expect(screen.getByText(/₩57,800/)).toBeInTheDocument()
  })

  it('displays positive changePercent with + prefix', () => {
    render(<PriceBlock quote={usdQuote} />)
    expect(screen.getByText(/\+1\.23%/)).toBeInTheDocument()
  })

  it('displays negative changePercent with - prefix', () => {
    render(<PriceBlock quote={krwQuote} />)
    expect(screen.getByText(/-2\.03%/)).toBeInTheDocument()
  })

  it('applies green color class for positive change', () => {
    render(<PriceBlock quote={usdQuote} />)
    const el = screen.getByText(/\+1\.23%/)
    expect(el.className).toMatch(/green/)
  })

  it('applies red color class for negative change', () => {
    render(<PriceBlock quote={krwQuote} />)
    const el = screen.getByText(/-2\.03%/)
    expect(el.className).toMatch(/red/)
  })

  it('displays day low and day high for USD', () => {
    render(<PriceBlock quote={usdQuote} />)
    expect(screen.getByText(/\$189\.20/)).toBeInTheDocument()
    expect(screen.getByText(/\$194\.80/)).toBeInTheDocument()
  })

  it('displays day low and day high for KRW', () => {
    render(<PriceBlock quote={krwQuote} />)
    expect(screen.getByText(/₩57,200/)).toBeInTheDocument()
    expect(screen.getByText(/₩59,400/)).toBeInTheDocument()
  })
})
