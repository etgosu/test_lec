# url-to-markdown 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| URL 페치 방식 | Next.js API Route (서버 프록시) | 브라우저에서 임의 URL을 직접 fetch하면 CORS로 차단됨. API Route에서 서버 사이드로 페치하면 CORS 제약 없음 |
| defuddle 실행 환경 | 서버 사이드 (API Route 내) | HTML 파싱을 서버에서 처리하고 결과 Markdown만 클라이언트로 전달 |
| Markdown 렌더링 | react-markdown | 클라이언트에서 Markdown 문자열을 HTML로 렌더링. 설치 필요 |
| 상태 관리 | React useState (Client Component) | 세션 1회성 상태, 외부 라이브러리 불필요 |
| 다크모드 | next-themes (useTheme) | layout.tsx에 ThemeProvider 이미 설정됨 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| /api/convert | Edge/Node API Route | app/api/convert/route.ts | Task 1 |

## 데이터 모델

### ConversionResult (클라이언트 상태)
- title: string (페이지 제목, 없으면 빈 문자열)
- author: string (저자, 없으면 빈 문자열)
- markdown: string (추출된 본문)

### API 응답
- 성공: `{ title: string, author: string, markdown: string }`
- 실패: `{ error: string }`

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | Task 2-6 | Button, Input, ToggleGroup, Skeleton, Alert — 컴포넌트 선택 규칙 |
| next-best-practices | Task 1, 2 | API Route 패턴, RSC 경계, "use client" 배치 |
| vercel-react-best-practices | Task 2-6 | 클라이언트 상태 패턴, 이벤트 핸들러 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `app/page.tsx` | Modify | Task 2 |
| `app/layout.tsx` | Modify | Task 6 (metadata title 수정) |
| `app/api/convert/route.ts` | New | Task 1 |
| `app/api/convert/route.test.ts` | New | Task 1 |
| `components/url-to-markdown/converter.tsx` | New | Task 2 |
| `components/url-to-markdown/converter.test.tsx` | New | Task 2 |
| `components/url-to-markdown/export-actions.tsx` | New | Task 3 |
| `components/url-to-markdown/export-actions.test.tsx` | New | Task 3 |
| `components/url-to-markdown/llm-open.tsx` | New | Task 4 |
| `components/url-to-markdown/llm-open.test.tsx` | New | Task 4 |
| `components/url-to-markdown/prompt-selector.tsx` | New | Task 5 |
| `components/url-to-markdown/prompt-selector.test.tsx` | New | Task 5 |
| `components/url-to-markdown/dark-mode-toggle.tsx` | New | Task 6 |
| `components/url-to-markdown/dark-mode-toggle.test.tsx` | New | Task 6 |

---

## Tasks

### Task 1: API Route — URL fetch + defuddle 변환

- **담당 시나리오**: Scenario 1 (API 레이어), Scenario 3 (에러 응답)
- **크기**: M (3-4 파일)
- **의존성**: None
- **참조**:
  - next-best-practices — route-handlers
  - defuddle npm: `bun add defuddle`
  - react-markdown: `bun add react-markdown` (Task 2 사전 설치)
- **구현 대상**:
  - `app/api/convert/route.ts`
  - `app/api/convert/route.test.ts`
- **수용 기준**:
  - [ ] 유효한 URL을 POST하면 `{ title, author, markdown }` 형태의 응답이 반환된다
  - [ ] markdown 필드에 defuddle이 추출한 본문 텍스트가 포함된다
  - [ ] URL 없이 POST하면 `{ error: "..." }` 응답이 반환된다
  - [ ] fetch 실패 또는 파싱 실패 시 `{ error: "..." }` 응답이 반환된다
- **검증**: `bun run test -- convert`

---

### Task 2: URL 입력 + 변환 + 결과 표시 + 로딩 + 에러 + 지우기

- **담당 시나리오**: Scenario 1 (전체), Scenario 2, Scenario 3
- **크기**: M (3-4 파일)
- **의존성**: Task 1 (API Route 존재)
- **참조**:
  - shadcn — Button, Input, Skeleton (로딩), Alert (에러)
  - vercel-react-best-practices — async-api-routes, rendering-conditional-render
  - wireframe.html — 화면 0, 1, 2, 4 레이아웃
- **구현 대상**:
  - `components/url-to-markdown/converter.tsx` ("use client")
  - `components/url-to-markdown/converter.test.tsx`
  - `app/page.tsx` (Converter 컴포넌트로 교체)
- **수용 기준**:
  - [ ] 변환 버튼 클릭 후 로딩 인디케이터(Skeleton)가 화면에 나타난다
  - [ ] 변환 완료 후 추출된 페이지 제목이 헤더 영역에 표시된다
  - [ ] 변환 완료 후 저자 정보가 있으면 헤더 영역에 표시된다
  - [ ] 변환 완료 후 본문이 렌더링된 Markdown으로 결과 영역에 표시된다
  - [ ] 지우기 버튼 클릭 후 URL 입력 필드가 빈 문자열이 된다
  - [ ] 지우기 버튼 클릭 후 결과 영역(제목·저자·Markdown)이 화면에서 사라진다
  - [ ] API 에러 응답 수신 시 에러 메시지가 URL 입력 필드 아래 인라인으로 나타난다
  - [ ] 에러 표시 후 URL 입력 필드 값이 유지된다
- **검증**: `bun run test -- converter`

---

### Checkpoint: Tasks 1-2 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] URL 입력 → 변환 → 결과 표시 / 에러 표시가 end-to-end로 동작 (Browser MCP: localhost:3001 접속, URL 입력, 변환 확인)

---

### Task 3: 내보내기 — 복사 + .md 다운로드

- **담당 시나리오**: Scenario 4, Scenario 5
- **크기**: S (2 파일)
- **의존성**: Task 2 (ConversionResult 상태 존재)
- **참조**:
  - shadcn — Button (variant, data-icon), icons.md
  - vercel-react-best-practices — js-cache-function-results
- **구현 대상**:
  - `components/url-to-markdown/export-actions.tsx` ("use client")
  - `components/url-to-markdown/export-actions.test.tsx`
- **수용 기준**:
  - [ ] "복사하기" 클릭 후 클립보드에 Markdown 텍스트가 담긴다
  - [ ] "복사하기" 클릭 후 "복사됨" 피드백 텍스트가 화면에 나타난다
  - [ ] "다운로드" 클릭 후 `.md` 확장자 파일 다운로드가 시작된다
  - [ ] 다운로드된 파일에 Markdown 전문이 포함된다
- **검증**: `bun run test -- export-actions`

---

### Task 4: LLM 열기 — ChatGPT / Claude 새 탭 + 클립보드

- **담당 시나리오**: Scenario 6 (프롬프트 없는 기본 케이스)
- **크기**: S (2 파일)
- **의존성**: Task 2 (markdown 상태), Task 3 (클립보드 유틸 재사용)
- **참조**:
  - shadcn — Button
  - wireframe.html — 화면 2 내보내기 섹션
- **구현 대상**:
  - `components/url-to-markdown/llm-open.tsx` ("use client")
  - `components/url-to-markdown/llm-open.test.tsx`
- **수용 기준**:
  - [ ] "ChatGPT로 열기" 클릭 시 `window.open`으로 ChatGPT URL이 새 탭에서 열린다
  - [ ] "Claude로 열기" 클릭 시 `window.open`으로 Claude URL이 새 탭에서 열린다
  - [ ] 프롬프트 없는 경우 Markdown 전문만 클립보드에 복사된다
  - [ ] 클립보드 복사 완료 피드백이 화면에 나타난다
- **검증**: `bun run test -- llm-open`

---

### Checkpoint: Tasks 3-4 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 복사 / 다운로드 / LLM 열기가 결과 화면에서 동작 (Browser MCP 확인)

---

### Task 5: 프롬프트 선택기 + 내보내기 통합

- **담당 시나리오**: Scenario 7, Scenario 8, Scenario 6 (프롬프트 포함 케이스)
- **크기**: M (3-4 파일)
- **의존성**: Task 3, Task 4 (클립보드 빌드 로직에 프롬프트 주입)
- **참조**:
  - shadcn — ToggleGroup + ToggleGroupItem (프리셋 선택), Input (직접 입력)
  - shadcn rules/forms.md — ToggleGroup 규칙
  - wireframe.html — 화면 2(프리셋), 화면 3(직접 입력)
- **구현 대상**:
  - `components/url-to-markdown/prompt-selector.tsx` ("use client")
  - `components/url-to-markdown/prompt-selector.test.tsx`
  - `components/url-to-markdown/export-actions.tsx` Modify (프롬프트 prop 추가)
  - `components/url-to-markdown/llm-open.tsx` Modify (프롬프트 prop 추가)
- **수용 기준**:
  - [ ] 프리셋 "요약해줘" 선택 후 해당 항목이 활성 상태로 표시된다
  - [ ] 다른 프리셋 선택 시 이전 선택이 해제되고 새 프리셋만 활성화된다
  - [ ] "직접 입력" 선택 시 텍스트 입력 필드가 나타난다
  - [ ] 프리셋 선택으로 전환하면 직접 입력 필드가 사라진다
  - [ ] 지우기(리셋) 후 직접 입력값이 초기화된다
  - [ ] 프롬프트 선택된 상태에서 LLM 열기 시 "프롬프트\n\nMarkdown 전문" 형태로 클립보드에 복사된다
- **검증**: `bun run test -- prompt-selector`

---

### Task 6: 다크모드 토글

- **담당 시나리오**: Scenario 9
- **크기**: S (2 파일)
- **의존성**: None (ThemeProvider는 layout.tsx에 이미 설정됨)
- **참조**:
  - next-themes docs: useTheme hook
  - shadcn rules/styling.md — semantic color tokens, dark mode
  - vercel-react-best-practices — rendering-hydration-no-flicker
- **구현 대상**:
  - `components/url-to-markdown/dark-mode-toggle.tsx` ("use client")
  - `components/url-to-markdown/dark-mode-toggle.test.tsx`
- **수용 기준**:
  - [ ] 토글 클릭 시 html 요소에 `dark` 클래스가 추가/제거된다
  - [ ] 토글 클릭 후 버튼 아이콘이 Moon ↔ Sun으로 전환된다
  - [ ] 페이지 새로고침 후 마지막으로 선택한 테마가 유지된다 (localStorage 확인)
- **검증**: `bun run test -- dark-mode-toggle`

---

### Checkpoint: Tasks 5-6 이후 (최종)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 전체 사용자 흐름 end-to-end 동작
  - URL 입력 → 변환 → 결과 확인
  - 프리셋 선택 → Claude로 열기 → 새 탭 열림 + 클립보드 복사됨 피드백
  - 직접 입력 → ChatGPT로 열기
  - 지우기 → 초기 화면 복귀
  - 다크모드 토글 → 새로고침 후 유지 확인
  - Browser MCP: 증거 `artifacts/url-to-markdown/evidence/final.png` 저장

---

## 미결정 항목

없음
