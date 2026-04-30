export interface StockQuote {
  symbol: string
  name: string
  exchange: string
  currency: string
  price: number
  change: number
  changePercent: number
  dayLow: number
  dayHigh: number
}

export interface StockChartPoint {
  timestamp: number
  close: number
}

export interface StockNews {
  title: string
  publisher: string
  url: string
}

export interface StockResponse {
  quote: StockQuote
  chart: StockChartPoint[]
  news: StockNews[]
}

export interface WatchlistItem {
  symbol: string
  name?: string
}
