'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { WatchlistItem } from '@/types/stock'

interface Props {
  watchlist: WatchlistItem[]
  selectedSymbol: string | null
  onAdd: (symbol: string) => void
  onRemove: (symbol: string) => void
  onSelect: (symbol: string) => void
  addError: string | null
  isAdding: boolean
}

export default function Sidebar({
  watchlist,
  selectedSymbol,
  onAdd,
  onRemove,
  onSelect,
  addError,
  isAdding,
}: Props) {
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function handleSubmit() {
    const trimmed = inputValue.trim().toUpperCase()
    if (!trimmed) return
    onAdd(trimmed)
    setInputValue('')
  }

  function handleCancel() {
    setIsInputVisible(false)
    setInputValue('')
  }

  return (
    <aside className="w-52 shrink-0 border-r flex flex-col bg-muted/30">
      <div className="p-3 border-b">
        <p className="text-xs font-bold text-muted-foreground mb-2">종목 목록</p>

        {isInputVisible ? (
          <div>
            <div className="flex gap-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="종목명 또는 코드"
                className="h-7 text-xs"
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleSubmit}
                disabled={isAdding}
              >
                확인
              </Button>
            </div>
            <button
              onClick={handleCancel}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsInputVisible(true)}
            className="w-full flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border border-dashed border-border bg-background hover:bg-muted"
          >
            <Plus className="size-3" />
            종목 추가
          </button>
        )}

        {addError && (
          <p className="mt-1 text-xs text-red-600">{addError}</p>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto">
        {watchlist.map((item) => (
          <li
            key={item.symbol}
            data-selected={selectedSymbol === item.symbol ? 'true' : 'false'}
            className={cn(
              'flex items-center justify-between px-3 py-2 text-xs border-b cursor-pointer hover:bg-background',
              selectedSymbol === item.symbol && 'bg-background font-semibold',
            )}
            onClick={() => onSelect(item.symbol)}
          >
            <div className="min-w-0">
              <div className="truncate">{item.name ?? item.symbol}</div>
              {item.name && (
                <div className="text-muted-foreground truncate">{item.symbol}</div>
              )}
            </div>
            <button
              aria-label={`${item.symbol} 제거`}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(item.symbol)
              }}
              className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
