# 🚀 Project Awesome — Complete Markdown Reference

> A comprehensive showcase of every Markdown feature you'll ever need.  
> Use this file as a living style guide and copy-paste reference.

---

## Table of Contents

- [1. Headings](#1-headings)
- [2. Text Formatting](#2-text-formatting)
- [3. Blockquotes](#3-blockquotes)
- [4. Lists](#4-lists)
- [5. Code Blocks](#5-code-blocks)
- [6. Inline Code](#6-inline-code)
- [7. Tables](#7-tables)
- [8. Links & Images](#8-links--images)
- [9. Horizontal Rules](#9-horizontal-rules)
- [10. Mermaid Diagrams](#10-mermaid-diagrams)
- [11. Task Lists](#11-task-lists)
- [12. Footnotes](#12-footnotes)
- [13. HTML in Markdown](#13-html-in-markdown)
- [14. Extended Examples](#14-extended-examples)
- [15. Real-World README Template](#15-real-world-readme-template)

---

# 1. Headings

# Heading 1 — H1
## Heading 2 — H2
### Heading 3 — H3
#### Heading 4 — H4
##### Heading 5 — H5
###### Heading 6 — H6

Alternative H1 (Setext style)
=============================

Alternative H2 (Setext style)
------------------------------

---

# 2. Text Formatting

## 2.1 Bold

**이것은 굵은 텍스트입니다** — `**double asterisks**`

__이것도 굵은 텍스트입니다__ — `__double underscores__`

중간에 **굵은 단어**가 들어가는 문장입니다.

## 2.2 Italic

*이것은 기울임 텍스트입니다* — `*single asterisk*`

_이것도 기울임 텍스트입니다_ — `_single underscore_`

중간에 *기울어진 단어*가 들어가는 문장입니다.

## 2.3 Bold + Italic

***굵고 기울어진 텍스트*** — `***triple asterisks***`

___이것도 굵고 기울어진 텍스트___ — `___triple underscores___`

**_굵고 기울어진 조합_** — `**_mix_**`

## 2.4 Strikethrough

~~취소선 텍스트~~ — `~~double tilde~~`

이 기능은 ~~더 이상 사용되지 않습니다~~ → 새로운 API를 사용하세요.

## 2.5 Combined Formatting

**굵게**, *기울임*, ***굵고 기울임***, ~~취소선~~, `인라인 코드` — 한 줄에 모두!

> **Note:** 텍스트 서식은 _문맥에 맞게_ **적절히** 사용하는 것이 ***중요합니다***.


물 분자: H<sub>2</sub>O  
제곱: x<sup>2</sup> + y<sup>2</sup> = z<sup>2</sup>  
각주 표시<sup>[1]</sup>

## 2.7 Highlight (Extended Markdown)

==하이라이트된 텍스트== — 일부 렌더러에서만 지원됩니다.

---

# 3. Blockquotes

## 3.1 단순 인용

> 단순한 인용문입니다.

## 3.2 다단 인용

> 첫 번째 인용 단락입니다.
>
> 두 번째 인용 단락입니다.

## 3.3 중첩 인용

> 첫 번째 레벨의 인용입니다.
>
> > 두 번째 레벨로 중첩된 인용입니다.
> >
> > > 세 번째 레벨의 인용입니다.

## 3.4 서식 포함 인용

> **중요한 인용:** _React는 선언적이고, 효율적이며, 유연한 JavaScript 라이브러리입니다._
>
> — Facebook Engineering Team

## 3.5 Callout 스타일 (GitHub 확장)

> [!NOTE]
> 유용한 정보를 강조할 때 사용합니다.

> [!TIP]
> 더 나은 결과를 위한 팁입니다.

> [!WARNING]
> 주의가 필요한 내용입니다.

> [!DANGER]
> 위험하거나 파괴적인 작업에 대한 경고입니다.

---

# 4. Lists

## 4.1 순서 없는 목록 (Unordered)

- 첫 번째 항목
- 두 번째 항목
- 세 번째 항목

* 별표로도 가능합니다
* 두 번째 항목
* 세 번째 항목

+ 플러스 기호도 됩니다
+ 두 번째 항목
+ 세 번째 항목

## 4.2 순서 있는 목록 (Ordered)

1. 첫 번째 단계
2. 두 번째 단계
3. 세 번째 단계
4. 네 번째 단계
5. 다섯 번째 단계

## 4.3 중첩 목록

- 레벨 1: 프론트엔드
  - 레벨 2: 프레임워크
    - 레벨 3: React
      - 레벨 4: Next.js
      - 레벨 4: Remix
    - 레벨 3: Vue
      - 레벨 4: Nuxt.js
    - 레벨 3: Svelte
  - 레벨 2: 스타일링
    - 레벨 3: CSS-in-JS
    - 레벨 3: Tailwind CSS
    - 레벨 3: SCSS
- 레벨 1: 백엔드
  - Node.js
  - Python
  - Go

## 4.4 혼합 목록

1. 첫 번째 항목
   - 하위 항목 A
   - 하위 항목 B
     1. 하위 순서 항목 1
     2. 하위 순서 항목 2
2. 두 번째 항목
   - 하위 항목 C
3. 세 번째 항목

## 4.5 목록 안에 단락

- 첫 번째 항목

  이 항목은 단락을 포함합니다. 빈 줄과 들여쓰기로 목록 항목에 연결됩니다.

  두 번째 단락도 가능합니다.

- 두 번째 항목

---

# 5. Code Blocks

## 5.1 JavaScript

```javascript
// Arrow function with destructuring
const fetchUserData = async ({ userId, token }) => {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};

// Promise chaining
fetchUserData({ userId: 42, token: 'abc123' })
  .then((user) => console.log('User:', user))
  .catch((err) => console.error('Error:', err));
```

## 5.2 TypeScript

```typescript
// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

// Discriminated union type
type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'error'; error: Error };

// Generic function with constraints
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

// Utility type usage
type PartialUser = Partial<User>;
type RequiredConfig = Required<Config>;
type ReadonlyState = Readonly<AppState>;
```

## 5.3 React + TypeScript (JSX/TSX)

```tsx
import React, { useState, useCallback, useMemo } from 'react';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  }, [onClick]);

  const className = useMemo(
    () =>
      `btn btn--${variant} ${disabled ? 'btn--disabled' : ''} ${isLoading ? 'btn--loading' : ''}`.trim(),
    [variant, disabled, isLoading]
  );

  return (
    <button className={className} onClick={handleClick} disabled={disabled || isLoading}>
      {isLoading ? <Spinner /> : label}
    </button>
  );
};

export default Button;
```

## 5.4 CSS / SCSS

```scss
// Variables
$primary: #6366f1;
$secondary: #8b5cf6;
$radius-lg: 12px;

// Mixin
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Component
.card {
  @include flex-center;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, $primary, $secondary);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba($primary, 0.3);
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  &--dark {
    background: #1e1e2e;
    color: white;
  }
}
```

## 5.5 Shell / Bash

```bash
#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# 환경 확인
check_dependencies() {
  local deps=("node" "npm" "git" "docker")
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
      log_error "$dep is not installed. Please install it first."
    fi
    log_info "$dep: $(command -v $dep)"
  done
}

# 빌드 스크립트
main() {
  log_info "Starting build process..."
  check_dependencies

  npm ci
  npm run lint
  npm run test
  npm run build

  log_info "Build completed successfully! 🎉"
}

main "$@"
```

## 5.6 JSON

```json
{
  "name": "@healingpaper/xcreen",
  "version": "1.0.0",
  "description": "Cross-screen unified architecture for web and webview",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## 5.7 YAML

```yaml
# GitHub Actions CI/CD Pipeline
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
```

## 5.8 SQL

```sql
-- 복잡한 JOIN 쿼리 예시
SELECT
  u.id                          AS user_id,
  u.name                        AS user_name,
  u.email,
  COUNT(DISTINCT o.id)          AS total_orders,
  SUM(oi.quantity * oi.price)   AS total_spent,
  AVG(r.rating)                 AS avg_rating,
  MAX(o.created_at)             AS last_order_date
FROM users u
  INNER JOIN orders o           ON o.user_id = u.id
  INNER JOIN order_items oi     ON oi.order_id = o.id
  LEFT  JOIN reviews r          ON r.user_id = u.id
WHERE
  u.created_at >= '2024-01-01'
  AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY
  u.id, u.name, u.email
HAVING
  COUNT(DISTINCT o.id) >= 2
ORDER BY
  total_spent DESC
LIMIT 100;
```

## 5.9 Python

```python
from dataclasses import dataclass, field
from typing import Optional, List
from datetime import datetime
import asyncio
import httpx


@dataclass
class Repository:
    """GitHub Repository data model."""
    name: str
    full_name: str
    stars: int
    forks: int
    language: Optional[str] = None
    topics: List[str] = field(default_factory=list)
    updated_at: Optional[datetime] = None

    @property
    def popularity_score(self) -> float:
        return self.stars * 1.0 + self.forks * 0.5


class GitHubClient:
    """Async GitHub API client."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: str):
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
        }

    async def get_repos(self, org: str) -> List[Repository]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/orgs/{org}/repos",
                headers=self.headers,
                params={"per_page": 100, "sort": "stars"},
            )
            response.raise_for_status()

            return [
                Repository(
                    name=r["name"],
                    full_name=r["full_name"],
                    stars=r["stargazers_count"],
                    forks=r["forks_count"],
                    language=r.get("language"),
                    topics=r.get("topics", []),
                )
                for r in response.json()
            ]


async def main():
    client = GitHubClient(token="ghp_xxxx")
    repos = await client.get_repos("vercel")

    top_repos = sorted(repos, key=lambda r: r.popularity_score, reverse=True)[:5]
    for repo in top_repos:
        print(f"{repo.full_name}: ⭐ {repo.stars} | 🍴 {repo.forks}")


if __name__ == "__main__":
    asyncio.run(main())
```

## 5.10 Dockerfile

```dockerfile
# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Dependencies Stage ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ---- Build Stage ----
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Production Stage ----
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

---

# 6. Inline Code

`인라인 코드`는 백틱 하나로 감쌉니다.

변수를 선언할 때 `const`, `let`, `var` 키워드를 사용합니다.

`React.useState()` 훅은 `[state, setState]` 튜플을 반환합니다.

패키지를 설치하려면 `npm install <package-name>` 명령을 실행하세요.

파일 경로: `/src/components/Button/Button.tsx`

환경 변수: `NEXT_PUBLIC_API_URL=https://api.example.com`

HTTP 메서드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

상태 코드: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`

컴포넌트: `<Button variant="primary" />`, `<Modal isOpen={true} />`

타입: `string`, `number`, `boolean`, `null`, `undefined`, `unknown`, `never`

---

# 7. Tables

## 7.1 기본 테이블

| 이름 | 나이 | 직책 |
|------|------|------|
| 이용현 | 30 | Frontend Architect |
| 김민수 | 28 | Backend Engineer |
| 박지영 | 32 | Product Manager |

## 7.2 정렬 테이블

| 항목 | 왼쪽 정렬 | 가운데 정렬 | 오른쪽 정렬 |
|:-----|:---------|:-----------:|-------------:|
| React | SPA Framework | ⭐⭐⭐⭐⭐ | 2024 |
| Vue | Progressive Framework | ⭐⭐⭐⭐ | 2024 |
| Angular | Full Framework | ⭐⭐⭐ | 2024 |
| Svelte | Compiler | ⭐⭐⭐⭐ | 2024 |

## 7.3 기술 스택 비교 테이블

| Feature | Next.js | Remix | Astro | Nuxt.js |
|---------|---------|-------|-------|---------|
| SSR | ✅ | ✅ | ✅ | ✅ |
| SSG | ✅ | ❌ | ✅ | ✅ |
| ISR | ✅ | ❌ | ❌ | ✅ |
| Edge Runtime | ✅ | ✅ | ✅ | ✅ |
| File-based Routing | ✅ | ✅ | ✅ | ✅ |
| React Support | ✅ | ✅ | ✅ | ❌ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |

## 7.4 API 엔드포인트 문서

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/users` | 🔐 Bearer | 사용자 목록 조회 |
| `POST` | `/api/v1/users` | 🔐 Bearer | 사용자 생성 |
| `GET` | `/api/v1/users/:id` | 🔐 Bearer | 특정 사용자 조회 |
| `PATCH` | `/api/v1/users/:id` | 🔐 Bearer | 사용자 정보 수정 |
| `DELETE` | `/api/v1/users/:id` | 🔐 Admin | 사용자 삭제 |

---

# 8. Links & Images

## 8.1 링크

[인라인 링크](https://example.com)

[타이틀이 있는 링크](https://example.com "예시 사이트")

[상대 경로 링크](./docs/CONTRIBUTING.md)

[참조 링크][docs-link]

[docs-link]: https://docs.example.com "문서 사이트"

자동 URL: <https://example.com>

자동 이메일: <hello@example.com>

## 8.2 이미지

![대체 텍스트](https://via.placeholder.com/600x300/6366f1/ffffff?text=Awesome+Project "이미지 타이틀")

[![클릭 가능한 이미지](https://via.placeholder.com/200x50/8b5cf6/ffffff?text=Click+Me)](https://example.com)

참조 이미지:
![로고][logo]

[logo]: https://via.placeholder.com/100x100/ec4899/ffffff?text=Logo "프로젝트 로고"

## 8.3 배지 (Shields.io 스타일)

![npm](https://img.shields.io/badge/npm-v10.0.0-cb3837?logo=npm)
![node](https://img.shields.io/badge/node-v20.0.0-339933?logo=node.js)
![typescript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript)
![license](https://img.shields.io/badge/license-MIT-green)
![coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)

---

# 9. Horizontal Rules

세 가지 방법으로 수평선을 만들 수 있습니다:

---

***

___

---

# 10. Mermaid Diagrams

## 10.1 Flowchart (순서도)

```mermaid
flowchart TD
    A([사용자 요청]) --> B{인증 확인}
    B -- 인증됨 --> C[요청 파싱]
    B -- 미인증 --> D[401 Unauthorized]
    C --> E{유효성 검사}
    E -- 성공 --> F[비즈니스 로직 처리]
    E -- 실패 --> G[400 Bad Request]
    F --> H[(데이터베이스)]
    H --> I[응답 직렬화]
    I --> J([200 OK 응답])

    style A fill:#6366f1,color:#fff
    style J fill:#22c55e,color:#fff
    style D fill:#ef4444,color:#fff
    style G fill:#f97316,color:#fff
```

## 10.2 Sequence Diagram (시퀀스 다이어그램)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 사용자
    participant Client as 🌐 클라이언트
    participant Gateway as 🔀 API Gateway
    participant Auth as 🔐 Auth Service
    participant API as ⚙️ API Server
    participant DB as 🗄️ Database

    User->>Client: 로그인 요청
    Client->>Gateway: POST /auth/login
    Gateway->>Auth: 인증 요청 전달
    Auth->>DB: 사용자 조회
    DB-->>Auth: 사용자 데이터 반환
    Auth-->>Gateway: JWT 토큰 발급
    Gateway-->>Client: 200 OK + Token
    Client-->>User: 로그인 성공

    Note over Client,Gateway: 이후 요청에는 Authorization 헤더 포함

    User->>Client: 데이터 요청
    Client->>Gateway: GET /api/data (Bearer Token)
    Gateway->>Auth: 토큰 검증
    Auth-->>Gateway: 검증 완료
    Gateway->>API: 요청 전달
    API->>DB: 데이터 조회
    DB-->>API: 결과 반환
    API-->>Gateway: 응답 데이터
    Gateway-->>Client: 200 OK + Data
    Client-->>User: 화면 렌더링
```

## 10.3 Class Diagram (클래스 다이어그램)

```mermaid
classDiagram
    class Router {
        <<interface>>
        +push(path: string) void
        +replace(path: string) void
        +back() void
        +getCurrentPath() string
    }

    class NextJsRouter {
        -router: NextRouter
        +push(path: string) void
        +replace(path: string) void
        +back() void
        +getCurrentPath() string
    }

    class WebViewRouter {
        -bridge: NativeBridge
        +push(path: string) void
        +replace(path: string) void
        +back() void
        +getCurrentPath() string
    }

    class RouterAdapter {
        -router: Router
        +constructor(env: Env)
        +getRouter() Router
    }

    Router <|.. NextJsRouter : implements
    Router <|.. WebViewRouter : implements
    RouterAdapter --> Router : uses
    RouterAdapter ..> NextJsRouter : creates
    RouterAdapter ..> WebViewRouter : creates
```

## 10.4 Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        bigint id PK
        string email UK
        string name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    CLINIC {
        bigint id PK
        string name
        string address
        float lat
        float lng
        timestamp created_at
    }

    RESERVATION {
        bigint id PK
        bigint user_id FK
        bigint clinic_id FK
        bigint doctor_id FK
        timestamp scheduled_at
        string status
        string memo
    }

    DOCTOR {
        bigint id PK
        bigint clinic_id FK
        string name
        string specialty
        string profile_image
    }

    REVIEW {
        bigint id PK
        bigint user_id FK
        bigint clinic_id FK
        bigint reservation_id FK
        int rating
        string content
        timestamp created_at
    }

    USER ||--o{ RESERVATION : makes
    CLINIC ||--o{ RESERVATION : receives
    DOCTOR ||--o{ RESERVATION : handles
    USER ||--o{ REVIEW : writes
    CLINIC ||--o{ REVIEW : receives
    RESERVATION ||--o| REVIEW : triggers
```

## 10.5 Git Graph

```mermaid
gitGraph
    commit id: "init: project setup"
    commit id: "feat: add auth module"

    branch develop
    checkout develop
    commit id: "feat: user API"
    commit id: "feat: clinic API"

    branch feature/reservation
    checkout feature/reservation
    commit id: "feat: reservation model"
    commit id: "feat: reservation API"
    commit id: "test: reservation tests"

    checkout develop
    merge feature/reservation id: "merge: reservation feature"

    branch feature/payment
    checkout feature/payment
    commit id: "feat: payment integration"
    commit id: "fix: payment edge case"

    checkout develop
    merge feature/payment id: "merge: payment feature"

    checkout main
    merge develop id: "release: v1.2.0" tag: "v1.2.0"
```

## 10.6 State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle : 앱 시작

    Idle --> Loading : 로그인 시도
    Loading --> Authenticated : 성공
    Loading --> Error : 실패
    Error --> Idle : 재시도
    Authenticated --> Idle : 로그아웃

    state Authenticated {
        [*] --> Dashboard
        Dashboard --> Profile : 프로필 이동
        Dashboard --> Settings : 설정 이동
        Profile --> Dashboard : 뒤로 가기
        Settings --> Dashboard : 뒤로 가기
    }
```

## 10.7 Gantt Chart (프로젝트 일정)

```mermaid
gantt
    title Xcreen 프로젝트 로드맵
    dateFormat  YYYY-MM-DD
    excludes    weekends

    section 설계 단계
    요구사항 분석          :done,    req,    2024-01-01, 2024-01-14
    아키텍처 설계          :done,    arch,   2024-01-15, 2024-01-28
    기술 스택 결정         :done,    tech,   2024-01-22, 2024-01-31

    section 개발 단계
    라우터 추상화 레이어    :done,    router, 2024-02-01, 2024-02-14
    로거 레지스트리         :done,    logger, 2024-02-10, 2024-02-21
    API 클라이언트          :active,  api,    2024-02-18, 2024-03-07
    컴포넌트 시스템         :         comp,   2024-03-01, 2024-03-21

    section 검증 단계
    E2E 테스트              :         e2e,    2024-03-18, 2024-03-28
    성능 최적화             :         perf,   2024-03-25, 2024-04-07
    릴리즈                  :milestone, rel,  2024-04-08, 0d
```

## 10.8 Pie Chart

```mermaid
pie title 기술 스택 사용 비율
    "TypeScript" : 45
    "React" : 25
    "Next.js" : 15
    "Testing" : 8
    "기타" : 7
```

## 10.9 Mindmap

```mermaid
mindmap
  root((Frontend Architecture))
    컴포넌트 시스템
      Atomic Design
      Design Tokens
      Storybook
    상태 관리
      서버 상태
        TanStack Query
        SWR
      클라이언트 상태
        Zustand
        Jotai
    성능 최적화
      코드 스플리팅
      이미지 최적화
      번들 분석
    테스트 전략
      유닛 테스트
        Vitest
      통합 테스트
        Testing Library
      E2E 테스트
        Playwright
```

---

# 11. Task Lists

## 11.1 기본 체크리스트

- [x] 프로젝트 초기 설정 완료
- [x] ESLint + Prettier 설정
- [x] TypeScript 설정
- [x] 테스트 환경 구성
- [ ] CI/CD 파이프라인 구축
- [ ] 스테이징 환경 배포
- [ ] 프로덕션 배포
- [ ] 모니터링 설정

## 11.2 중첩 체크리스트

- [x] **아키텍처 설계**
  - [x] 폴더 구조 확정
  - [x] 네이밍 컨벤션 정의
  - [x] 코드 스플리팅 전략
- [ ] **컴포넌트 개발**
  - [x] Button 컴포넌트
  - [x] Input 컴포넌트
  - [ ] Modal 컴포넌트
  - [ ] Toast 컴포넌트
- [ ] **API 연동**
  - [x] API 클라이언트 설정
  - [ ] 에러 핸들링 미들웨어
  - [ ] 재시도 로직

---

# 12. Footnotes

각주는 본문의 내용을 보충 설명하는 데 사용됩니다.[^1]

React는 Meta(구 Facebook)에서 만든 UI 라이브러리입니다.[^react]

TypeScript는 Microsoft가 개발한 JavaScript의 슈퍼셋입니다.[^ts]

[^1]: 이것이 각주의 내용입니다. 문서 맨 아래에 렌더링됩니다.

[^react]: React는 2013년 오픈소스로 공개되었으며, 현재 전 세계 가장 많이 사용되는 프론트엔드 라이브러리 중 하나입니다.

[^ts]: TypeScript 5.0은 2023년 3월에 출시되었으며, Decorators, const type parameters 등 주요 기능이 추가되었습니다.

---

# 13. HTML in Markdown

## 13.1 접기/펼치기 (Details/Summary)

<details>
<summary>📦 설치 방법 (클릭하여 펼치기)</summary>

### Prerequisites

- Node.js 20+
- npm 9+

### 설치 단계

```bash
# 레포지토리 클론
git clone https://github.com/example/project.git
cd project

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

설치 완료 후 `http://localhost:3000`에서 확인할 수 있습니다.

</details>

<details>
<summary>🔧 환경 변수 설정</summary>

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=your-secret-key-here
```

> ⚠️ **주의:** `.env.local` 파일은 절대 git에 커밋하지 마세요.

</details>

<details>
<summary>🐛 자주 묻는 질문 (FAQ)</summary>

**Q: 빌드가 실패합니다.**

A: `node_modules`를 삭제하고 재설치해 보세요:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: TypeScript 오류가 발생합니다.**

A: 다음 명령으로 타입 체크를 실행하세요:
```bash
npm run typecheck
```

</details>

## 13.2 키보드 단축키

<kbd>Ctrl</kbd> + <kbd>C</kbd> — 복사  
<kbd>Ctrl</kbd> + <kbd>V</kbd> — 붙여넣기  
<kbd>Ctrl</kbd> + <kbd>Z</kbd> — 실행 취소  
<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> — VS Code 커맨드 팔레트

## 13.3 중앙 정렬

<div align="center">

# 🌟 중앙 정렬 제목

이 텍스트는 중앙 정렬되어 있습니다.

**굵은 텍스트도 가능합니다.**

</div>

---

# 14. Extended Examples

## 14.1 커밋 컨벤션 가이드

커밋 메시지는 다음 형식을 따릅니다:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(auth): add OAuth2 login` |
| `fix` | 버그 수정 | `fix(api): handle null response` |
| `docs` | 문서 수정 | `docs(readme): update install guide` |
| `style` | 코드 스타일 | `style(button): fix indentation` |
| `refactor` | 리팩토링 | `refactor(router): extract adapter` |
| `test` | 테스트 추가 | `test(auth): add unit tests` |
| `chore` | 빌드/설정 | `chore(deps): bump react to 18.3` |
| `perf` | 성능 개선 | `perf(image): add lazy loading` |
| `ci` | CI 설정 | `ci(github): add lint workflow` |

## 14.2 코드 리뷰 가이드라인

> **P1** — Must fix: 반드시 수정 필요  
> **P2** — Should fix: 가능하면 수정  
> **P3** — Consider: 고려해볼 만한 개선사항  
> **NIT** — Nit: 사소한 스타일 지적

예시:

```
[P1] 이 함수는 에러 처리가 없습니다. try-catch를 추가해주세요.
[P2] `any` 타입 대신 구체적인 타입을 지정하면 좋겠습니다.
[P3] 이 로직을 유틸 함수로 분리하면 재사용성이 높아질 것 같습니다.
[NIT] 변수명을 `data` 대신 `userData`로 하면 더 명확합니다.
```

## 14.3 PR 템플릿 예시

---

### 📋 변경 사항 요약

> 이 PR에서 무엇을 변경했는지 간략히 설명하세요.

이번 PR에서는 예약 페이지의 **날짜 선택 컴포넌트**를 리팩토링했습니다.

### 🎯 변경 이유

- 기존 컴포넌트의 접근성(a11y) 점수가 낮음
- 모바일에서 터치 이벤트 처리 버그 존재
- 테스트 커버리지 0%

### 🔧 주요 변경 내용

- [x] `DatePicker` 컴포넌트를 `react-day-picker`로 교체
- [x] 키보드 네비게이션 지원 추가
- [x] 터치 이벤트 핸들러 개선
- [x] 유닛 테스트 추가 (커버리지 85%)

### 🧪 테스트 방법

```bash
# 단위 테스트 실행
npm run test -- DatePicker

# 개발 서버에서 직접 확인
npm run dev
# → /reservation 페이지에서 날짜 선택 테스트
```

### 📸 스크린샷

| Before | After |
|--------|-------|
| (이전 UI) | (개선된 UI) |

---

## 14.4 아키텍처 결정 기록 (ADR) 예시

### ADR-001: 상태 관리 라이브러리 선택

**날짜:** 2024-01-15  
**상태:** ✅ 승인됨  
**결정자:** @ian, @frontend-chapter

#### 컨텍스트

현재 프로젝트는 서버 상태와 클라이언트 상태가 혼재되어 있습니다. 이를 명확히 분리하고 각각에 최적화된 솔루션이 필요합니다.

#### 고려한 옵션

| 옵션 | 장점 | 단점 |
|------|------|------|
| Redux Toolkit | 강력한 DevTools, 대규모 팀 친화 | 보일러플레이트 많음, 학습 곡선 |
| Zustand | 간단한 API, 작은 번들 크기 | 소규모 상태에 적합 |
| Jotai | 원자 모델, 세밀한 구독 | 상대적으로 생태계 작음 |
| TanStack Query | 서버 상태 전문화, 캐싱 탁월 | 클라이언트 상태 관리 불가 |

#### 결정

- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand v4

#### 근거

두 라이브러리를 조합하면 각각의 강점을 최대화할 수 있습니다. TanStack Query는 서버 데이터 동기화, 캐싱, 낙관적 업데이트에 특화되어 있고, Zustand는 UI 상태를 최소한의 보일러플레이트로 관리합니다.

---

# 15. Real-World README Template

## 📦 Installation

```bash
# npm
npm install @awesome/package

# yarn
yarn add @awesome/package

# pnpm
pnpm add @awesome/package
```

## 🚀 Quick Start

```typescript
import { createClient } from '@awesome/package';

const client = createClient({
  apiKey: process.env.API_KEY,
  baseUrl: 'https://api.awesome.com',
});

const result = await client.query({ id: 1 });
console.log(result);
```

## 📖 API Reference

### `createClient(options)`

클라이언트 인스턴스를 생성합니다.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | `string` | ✅ | — | API 인증 키 |
| `baseUrl` | `string` | ❌ | `https://api.awesome.com` | API 베이스 URL |
| `timeout` | `number` | ❌ | `5000` | 요청 타임아웃 (ms) |
| `retries` | `number` | ❌ | `3` | 재시도 횟수 |

**Returns:** `Client`

### `client.query(params)`

데이터를 조회합니다.

```typescript
const result = await client.query({
  id: 1,           // required
  fields: ['name', 'email'], // optional
  limit: 10,       // optional, default: 20
});
```

## 🤝 Contributing

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 저장소를 **Fork** 합니다
2. 새로운 브랜치를 만듭니다: `git checkout -b feat/amazing-feature`
3. 변경사항을 커밋합니다: `git commit -m 'feat: add amazing feature'`
4. 브랜치에 푸시합니다: `git push origin feat/amazing-feature`
5. **Pull Request**를 생성합니다

자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 📄 License

이 프로젝트는 [MIT License](./LICENSE)를 따릅니다.

---

<div align="center">

**Made with ❤️ by the Awesome Team**

[Website](https://example.com) · [Documentation](https://docs.example.com) · [Issues](https://github.com/example/project/issues)

</div>