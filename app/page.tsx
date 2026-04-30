'use client'

import { useState } from 'react'
import Sidebar from '@/components/stock-research/Sidebar'
import PriceBlock from '@/components/stock-research/PriceBlock'
import StockChart from '@/components/stock-research/StockChart'
import NewsList from '@/components/stock-research/NewsList'
import { Skeleton } from '@/components/ui/skeleton'
import type { WatchlistItem, StockResponse } from '@/types/stock'

export default function Page() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [stockData, setStockData] = useState<StockResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  async function handleAdd(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return

    setIsAdding(true)
    setAddError(null)

    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(trimmed)}`)
      const data: StockResponse | { error: string } = await res.json()
      if (!res.ok || 'error' in data) {
        setAddError('종목을 찾을 수 없습니다')
        return
      }
      const { symbol, name } = (data as StockResponse).quote
      setWatchlist((prev) =>
        prev.some((w) => w.symbol === symbol)
          ? prev
          : [...prev, { symbol, name }],
      )
      await handleSelect(symbol, data as StockResponse)
    } catch {
      setAddError('종목을 찾을 수 없습니다')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleSelect(symbol: string, prefetched?: StockResponse) {
    setSelectedSymbol(symbol)
    if (prefetched) {
      setStockData(prefetched)
      return
    }
    setIsLoading(true)
    setStockData(null)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`)
      if (!res.ok) {
        setAddError('데이터를 불러오지 못했습니다')
        return
      }
      setStockData(await res.json())
    } catch {
      setAddError('데이터를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  function handleRemove(symbol: string) {
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol))
    if (selectedSymbol === symbol) {
      setSelectedSymbol(null)
      setStockData(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        watchlist={watchlist}
        selectedSymbol={selectedSymbol}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onSelect={(s) => handleSelect(s)}
        addError={addError}
        isAdding={isAdding}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {!selectedSymbol && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            종목을 추가하고 선택하세요
          </div>
        )}

        {selectedSymbol && isLoading && <LoadingSkeleton />}

        {selectedSymbol && !isLoading && stockData && (
          <>
            <PriceBlock quote={stockData.quote} />
            <StockChart points={stockData.chart} />
            <NewsList news={stockData.news} />
          </>
        )}
      </main>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="loading-skeleton">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}
