import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NewsList from './NewsList'
import type { StockNews } from '@/types/stock'

function makeNews(n: number): StockNews[] {
  return Array.from({ length: n }, (_, i) => ({
    title: `News title ${i}`,
    publisher: `Publisher ${i}`,
    url: `https://example.com/${i}`,
  }))
}

describe('NewsList', () => {
  it('renders 5 news items when 5 provided', () => {
    render(<NewsList news={makeNews(5)} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  it('renders exactly the count provided for 1–4 items', () => {
    render(<NewsList news={makeNews(3)} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('displays title and publisher for each item', () => {
    render(<NewsList news={makeNews(2)} />)
    expect(screen.getByText('News title 0')).toBeInTheDocument()
    expect(screen.getByText('Publisher 0')).toBeInTheDocument()
    expect(screen.getByText('News title 1')).toBeInTheDocument()
  })

  it('each item is an anchor with the correct href', () => {
    render(<NewsList news={makeNews(2)} />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', 'https://example.com/0')
    expect(links[1]).toHaveAttribute('href', 'https://example.com/1')
  })

  it('renders nothing when news array is empty', () => {
    const { container } = render(<NewsList news={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
