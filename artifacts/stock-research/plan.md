# stock-research 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 라우트 | `app/page.tsx` 교체 | 단일 기능 앱, 별도 라우트 불필요 |
| 데이터 페치 | Route Handler `app/api/stock/[symbol]/route.ts` | yahoo-finance2는 Node.js only. Route Handler가 안전한 서버 경계 |
| 레이아웃 | 좌측 사이드바(200px) + 우측 본문 (2컬럼) | 사용자 선택. 모바일은 사이드바 위·본문 아래 수직 스택 |
| 클라이언트 상태 | `useState` in `'use client'` page | 종목 목록·선택·로딩·에러 네 상태. 세션 휘발, localStorage 불필요 |
| 차트 | shadcn Chart (Recharts) | 프로젝트 패턴 유지 |
| KS 자동 감지 위치 | Route Handler 내부 | 비즈니스 로직을 서버 경계로 격리 |

## 인프라 리소스

None — 외부 인증 없음, 환경 변수 불필요.

## 데이터 모델

### StockQuote
- symbol (required) — e.g. "AAPL", "005930.KS"
- name (required) — e.g. "Apple Inc.", "삼성전자"
- exchange (required) — e.g. "NASDAQ", "KRX"
- currency (required) — "USD" | "KRW"
- price (required) — 현재가
- change (required) — 절대 등락폭
- changePercent (required) — 등락율 (%)
- dayLow (required) — 금일 최저가
- dayHigh (required) — 금일 최고가

### StockChartPoint
- timestamp (required) — Unix epoch (ms)
- close (required) — 해당 시각 가격

### StockNews
- title (required)
- publisher (required)
- url (required)

### StockResponse
- quote: StockQuote
- chart: StockChartPoint[]
- news: StockNews[] (최대 5개)

### WatchlistItem (클라이언트 상태)
- symbol (required) — 정규화된 심볼 (e.g. "005930.KS")
- name (optional) — 추가 성공 후 채워짐

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | Task 2, 3, 4 | Input, Button, Card, Skeleton, Chart, Badge 사용 규칙 |
| next-best-practices | Task 1, 2 | Route Handler 패턴, RSC/Client 경계, 'use client' 위치 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/stock.ts` | New | Task 1 |
| `app/api/stock/[symbol]/route.ts` | New | Task 1 |
| `app/api/stock/[symbol]/route.test.ts` | New | Task 1 |
| `app/page.tsx` | Modify | Task 2 |
| `components/stock-research/Sidebar.tsx` | New | Task 2 |
| `components/stock-research/Sidebar.test.tsx` | New | Task 2 |
| `components/stock-research/PriceBlock.tsx` | New | Task 2 |
| `components/stock-research/PriceBlock.test.tsx` | New | Task 2 |
| `components/stock-research/StockChart.tsx` | New | Task 3 |
| `components/stock-research/StockChart.test.tsx` | New | Task 3 |
| `components/stock-research/NewsList.tsx` | New | Task 4 |
| `components/stock-research/NewsList.test.tsx` | New | Task 4 |
| `app/layout.tsx` | Modify | Task 2 (metadata 업데이트) |

## 사전 설치 (Task 1 시작 전)

```bash
bun add yahoo-finance2
bunx shadcn@latest add skeleton
bunx shadcn@latest add chart
```

---

## Tasks

### Task 1: yahoo-finance2 API Route + 타입

- **담당 시나리오**: Scenario 1·2 (data layer), Scenario 3 (에러 핸들링)
- **크기**: M (3파일 — types, route, test)
- **의존성**: None
- **참조**:
  - next-best-practices — route-handlers.md
  - `artifacts/stock-research/spec.md` — 불변 규칙: KS 자동 감지, 뉴스 상한 5개
- **구현 대상**:
  - `types/stock.ts` — StockQuote, StockChartPoint, StockNews, StockResponse, WatchlistItem 타입
  - `app/api/stock/[symbol]/route.ts` — GET handler
  - `app/api/stock/[symbol]/route.test.ts`
- **KS 감지 로직**: `/^\d{6}$/.test(symbol)` → `symbol + ".KS"`, suffix 있으면 그대로
- **수용 기준**:
  - [ ] `GET /api/stock/AAPL` → 200, `quote.price`, `quote.change`, `quote.changePercent`, `quote.dayLow`, `quote.dayHigh`, `quote.currency="USD"`, `news` 배열(최대 5개)
  - [ ] `GET /api/stock/005930` → 200, `quote.symbol="005930.KS"`, `quote.currency="KRW"`
  - [ ] `GET /api/stock/005930.KS` → 200, suffix 중복 없이 `quote.symbol="005930.KS"`
  - [ ] `GET /api/stock/XXXXXXX` → 404, 에러 메시지 텍스트 포함
  - [ ] `news` 배열 길이 ≤ 5
- **검증**: `bun run test -- route.test` (yahoo-finance2 vi.mock)

---

### Task 2: 사이드바 + 종목 추가·삭제·선택 + 가격 블록 (vertical slice)

- **담당 시나리오**: Scenario 1·2 (추가→선택→가격 표시), Scenario 3 (추가 에러), Scenario 4 (로딩), Scenario 5 (추가), Scenario 6 (삭제)
- **크기**: M (5파일)
- **의존성**: Task 1 (Route Handler 존재)
- **참조**:
  - shadcn — Input, Button, Card, Skeleton
  - next-best-practices — 'use client' directive
  - `artifacts/stock-research/wireframe.html` — Screen 0·1·2·4·5 레이아웃
- **구현 대상**:
  - `components/stock-research/Sidebar.tsx` — 종목 목록, 추가 입력, 삭제 버튼 (`'use client'`)
  - `components/stock-research/Sidebar.test.tsx`
  - `components/stock-research/PriceBlock.tsx` — 가격·등락·범위 표시 (순수 display)
  - `components/stock-research/PriceBlock.test.tsx`
  - `app/page.tsx` — `'use client'`: watchlist 상태, selectedSymbol, fetch 호출, 2컬럼 레이아웃
- **수용 기준**:
  - [ ] 유효한 코드 추가 → 사이드바 목록에 해당 항목이 나타난다
  - [ ] 동일 코드 중복 추가 → 사이드바에 하나만 존재한다
  - [ ] 항목 클릭 → 본문에 종목명이 표시된다 ("Apple Inc." / "삼성전자")
  - [ ] 항목 클릭 → 현재가가 숫자로 표시된다 (USD: `$`, KRW: `₩` 단위)
  - [ ] 등락율이 `+1.23%` / `-1.23%` 형식으로 표시된다
  - [ ] 상승이면 green 색상 클래스, 하락이면 red 색상 클래스가 적용된다
  - [ ] 금일 최저가와 최고가가 함께 표시된다
  - [ ] `005930` 추가 → 사이드바에 "삼성전자" 또는 `005930.KS` 텍스트가 존재한다
  - [ ] `005930` 항목 클릭 → 본문 가격이 `₩` 단위로 표시된다
  - [ ] 유효하지 않은 코드 추가 시도 → 에러 메시지가 표시된다
  - [ ] 유효하지 않은 코드 추가 시도 → 사이드바 목록에 해당 코드가 추가되지 않는다
  - [ ] 항목 클릭 직후 본문에 로딩 스켈레톤이 표시된다
  - [ ] 데이터 수신 후 로딩이 사라지고 결과가 표시된다
  - [ ] 선택된 항목의 × 클릭 → 사이드바에서 사라지고 본문이 비워진다
  - [ ] 선택되지 않은 항목의 × 클릭 → 해당 항목만 사이드바에서 사라지고 본문은 유지된다
- **검증**: `bun run test -- Sidebar PriceBlock` (fetch mock 사용)

---

### Checkpoint: Tasks 1–2 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] Browser MCP — `http://localhost:3000`에서 AAPL 추가 → 클릭 → 현재가·등락율·일중 범위 표시 확인. 스크린샷 `artifacts/stock-research/evidence/checkpoint-1-aapl.png`
- [ ] Browser MCP — `005930` 추가 → 클릭 → ₩ 단위 가격, "삼성전자" 표시 확인
- [ ] Browser MCP — AAPL × 클릭 → 사이드바에서 제거, 본문 초기화 확인

---

### Task 3: 인트라데이 차트

- **담당 시나리오**: Scenario 1·2 (차트)
- **크기**: S (2파일)
- **의존성**: Task 2 (페이지 레이아웃·데이터 흐름 확정 후)
- **참조**:
  - shadcn — Chart (Recharts 래퍼)
  - `artifacts/stock-research/wireframe.html` — Screen 2·3 차트 위치, 시간축 레이블
- **구현 대상**:
  - `components/stock-research/StockChart.tsx` — Recharts LineChart, 당일 가격 선 그래프
  - `components/stock-research/StockChart.test.tsx`
- **수용 기준**:
  - [ ] StockChartPoint 배열을 props로 받으면 Recharts SVG 요소(`<svg>`)가 DOM에 존재한다
  - [ ] 빈 배열을 받으면 차트 대신 "데이터 없음" 메시지가 표시된다
- **검증**:
  - `bun run test -- StockChart`
  - Browser MCP — 차트 SVG 렌더 확인, 스크린샷 `evidence/task-3-chart.png`

---

### Task 4: 뉴스 헤드라인 목록

- **담당 시나리오**: Scenario 1·2 (뉴스)
- **크기**: S (2파일)
- **의존성**: Task 2
- **참조**:
  - `artifacts/stock-research/wireframe.html` — Screen 2·3 뉴스 리스트 레이아웃
  - spec 불변 규칙: 최대 5개
- **구현 대상**:
  - `components/stock-research/NewsList.tsx`
  - `components/stock-research/NewsList.test.tsx`
- **수용 기준**:
  - [ ] StockNews 배열 5개 → 뉴스 항목 5개가 렌더된다
  - [ ] StockNews 배열 1~4개 → 받은 수만큼 렌더된다
  - [ ] 각 항목에 제목 텍스트와 출처명(publisher)이 표시된다
  - [ ] 각 항목이 `href` 속성에 원문 URL을 가진 `<a>` 태그로 렌더된다
  - [ ] 빈 배열 → 뉴스 영역이 표시되지 않는다
- **검증**: `bun run test -- NewsList`

---

### Checkpoint: Tasks 3–4 이후 (최종)

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] Browser MCP — AAPL 전체 플로우 (추가→클릭→가격·차트·뉴스 표시). 스크린샷 `evidence/final-aapl.png`
- [ ] Browser MCP — `005930` 전체 플로우 (KRW, 삼성전자, 한국 뉴스). 스크린샷 `evidence/final-samsung.png`
- [ ] Browser MCP — `XXXXXXX` 추가 시도 → 에러 메시지, 목록 미추가 확인
- [ ] Human review — 등락 색상(상승=초록, 하락=빨강), 차트 선 방향, 사이드바 레이아웃 시각 확인

---

## 미결정 항목

- 없음
