import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from './Sidebar'
import type { WatchlistItem } from '@/types/stock'

const watchlist: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: '005930.KS', name: '삼성전자' },
]

function setup(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  const onSelect = vi.fn()
  render(
    <Sidebar
      watchlist={[]}
      selectedSymbol={null}
      onAdd={onAdd}
      onRemove={onRemove}
      onSelect={onSelect}
      addError={null}
      isAdding={false}
      {...props}
    />,
  )
  return { onAdd, onRemove, onSelect }
}

describe('Sidebar', () => {
  it('renders 종목 추가 button', () => {
    setup()
    expect(screen.getByRole('button', { name: /종목 추가/ })).toBeInTheDocument()
  })

  it('shows input field when 종목 추가 button is clicked', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /종목 추가/ }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onAdd with trimmed uppercase input on 확인 click', async () => {
    const { onAdd } = setup()
    await userEvent.click(screen.getByRole('button', { name: /종목 추가/ }))
    await userEvent.type(screen.getByRole('textbox'), 'aapl')
    await userEvent.click(screen.getByRole('button', { name: /확인/ }))
    expect(onAdd).toHaveBeenCalledWith('AAPL')
  })

  it('calls onAdd on Enter key', async () => {
    const { onAdd } = setup()
    await userEvent.click(screen.getByRole('button', { name: /종목 추가/ }))
    await userEvent.type(screen.getByRole('textbox'), 'AAPL{Enter}')
    expect(onAdd).toHaveBeenCalledWith('AAPL')
  })

  it('renders watchlist item names', () => {
    setup({ watchlist })
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('삼성전자')).toBeInTheDocument()
  })

  it('calls onSelect when watchlist item is clicked', async () => {
    const { onSelect } = setup({ watchlist })
    await userEvent.click(screen.getByText('Apple Inc.'))
    expect(onSelect).toHaveBeenCalledWith('AAPL')
  })

  it('calls onRemove when × button is clicked', async () => {
    const { onRemove } = setup({ watchlist })
    await userEvent.click(screen.getByRole('button', { name: 'AAPL 제거' }))
    expect(onRemove).toHaveBeenCalledWith('AAPL')
  })

  it('displays addError message when provided', () => {
    setup({ addError: '종목을 찾을 수 없습니다' })
    expect(screen.getByText('종목을 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('marks selected item with data-selected attribute', () => {
    setup({ watchlist, selectedSymbol: 'AAPL' })
    const selectedItem = screen.getByText('Apple Inc.').closest('[data-selected="true"]')
    expect(selectedItem).toBeInTheDocument()
  })

  it('hides input on 취소 click', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /종목 추가/ }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /취소/ }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
