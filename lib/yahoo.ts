import YFClass from 'yahoo-finance2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YFClass as any)({ suppressNotices: ['yahooSurvey'] })

export function yfQuote(symbol: string): Promise<Record<string, unknown>> {
  return yf.quote(symbol)
}

export function yfChart(symbol: string, opts: object): Promise<unknown> {
  return yf.chart(symbol, opts)
}

export function yfSearch(symbol: string, opts: object): Promise<unknown> {
  return yf.search(symbol, opts)
}
