import type { StockNews } from '@/types/stock'

interface Props {
  news: StockNews[]
}

export default function NewsList({ news }: Props) {
  if (news.length === 0) return null

  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground border-b pb-1 mb-0">뉴스</p>
      <ul className="flex flex-col">
        {news.map((item, i) => (
          <li key={i} className="text-xs py-2 border-b last:border-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-70"
            >
              <p className="mb-0.5 leading-relaxed">{item.title}</p>
              <span className="text-muted-foreground">{item.publisher}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
