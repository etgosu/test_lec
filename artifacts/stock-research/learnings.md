# stock-research Learnings

---
category: tooling
applied: not-yet
---
## yahoo-finance2 v3: new YahooFinance() 인스턴스화 필수

**상황**: Task 1 실행 중. yahoo-finance2 v3는 `import yahooFinance from 'yahoo-finance2'`로 가져온 default export를 직접 호출하면 "Call `new YahooFinance()` first" 에러 발생.
**판단**: `lib/yahoo.ts` thin wrapper 모듈로 추출. `new (YFClass as any)()` 로 인스턴스화 후 메서드를 named export로 재노출. 테스트는 `@/lib/yahoo`를 `vi.mock`해 경계를 단순화.
**다시 마주칠 가능성**: 높음 — yahoo-finance2를 쓰는 모든 feature에서 동일.

---
category: tooling
applied: not-yet
---
## yahoo-finance2 TypeScript 오버로드가 never 추론 유발

**상황**: Task 1, bun run build. `yahooFinance.chart(...)` 반환 타입이 복잡한 조건부 오버로드로 `never`로 추론되어 `.catch()` 불가.
**판단**: lib/yahoo.ts 래퍼에서 `as unknown as YFAny` cast로 타입 우회. 런타임 동작은 정상.
**다시 마주칠 가능성**: 높음 — 라이브러리 타입 정의가 바뀌지 않는 한 반복.

---
category: task-ordering
applied: not-yet
---
## vi.mock + new 생성자 패턴 충돌

**상황**: Task 1 테스트. `vi.mock('yahoo-finance2', () => ({ default: vi.fn().mockImplementation(() => ({...})) }))` 에서 화살표 함수가 constructor로 인식 안 됨.
**판단**: yahoo-finance2 대신 lib/yahoo.ts를 모킹 대상으로 변경. 외부 라이브러리 직접 모킹보다 얇은 래퍼 모킹이 안정적.
**다시 마주칠 가능성**: 중간 — `new Class()` 패턴을 가진 서드파티 라이브러리를 테스트할 때 재발.

---
category: spec-ambiguity
applied: not-yet
---
## page.tsx 전체 'use client' vs RSC 분리

**상황**: code-reviewer C1. page.tsx가 `'use client'`로 전체 선언되어 서버 렌더링 이점 없음.
**판단**: 개인 로컬 도구에서 모든 콘텐츠가 런타임 동적 데이터(API fetch). RSC 분리 이득 < 복잡도 증가. 보류.
**다시 마주칠 가능성**: 중간 — 상용 앱에서는 반드시 분리 필요. 개인 도구·PoC에선 트레이드오프 허용.

---
category: code-review
applied: not-yet
---
## e2e 디렉토리가 Vitest에 포함되어 테스트 실패

**상황**: Task 2 전체 테스트 실행 시 e2e/smoke.spec.ts가 Vitest에 잡혀 `Playwright Test did not expect test()` 에러.
**판단**: vitest.config.ts exclude에 `"e2e/**"` 추가. 기존 smoke.spec.ts의 title도 "Stock Research"로 업데이트.
**다시 마주칠 가능성**: 높음 — Playwright + Vitest 동시 사용 시 항상 발생. 초기 설정에 추가해야 함.

---
category: code-review
applied: not-yet
---
## normalizeSymbol 클라이언트·서버 중복

**상황**: code-reviewer C2. page.tsx의 normalizeInput과 route.ts의 normalizeSymbol이 동일 정규식을 각자 구현.
**판단**: 서버를 단일 진실 소스로. page.tsx normalizeInput 제거 후 fetch 응답의 `data.quote.symbol`로 중복 체크. API 왕복이 늘지만 로직 분산 해소.
**다시 마주칠 가능성**: 중간 — 클라이언트 사전 검증 vs 서버 정규화 트레이드오프는 반복 발생.
