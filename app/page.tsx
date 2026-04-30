'use client'

import { useState } from 'react'
import Sidebar from '@/components/stock-research/Sidebar'
import PriceBlock from '@/components/stock-research/PriceBlock'
import { Skeleton } from '@/components/ui/skeleton'
import type { WatchlistItem, StockResponse } from '@/types/stock'

function normalizeInput(input: string): string {
  const t = input.trim().toUpperCase()
  if (/^\d{6}$/.test(t)) return t + '.KS'
  return t
}

export default function Page() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [stockData, setStockData] = useState<StockResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  async function handleAdd(raw: string) {
    const normalized = normalizeInput(raw)
    if (!normalized) return
    if (watchlist.some((w) => w.symbol === normalized)) return

    setIsAdding(true)
    setAddError(null)

    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(raw)}`)
      if (!res.ok) {
        setAddError('종목을 찾을 수 없습니다')
        return
      }
      const data: StockResponse = await res.json()
      const symbol = data.quote.symbol
      setWatchlist((prev) =>
        prev.some((w) => w.symbol === symbol)
          ? prev
          : [...prev, { symbol, name: data.quote.name }],
      )
      await handleSelect(symbol, data)
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
      if (!res.ok) return
      setStockData(await res.json())
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
          <PriceBlock quote={stockData.quote} />
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
