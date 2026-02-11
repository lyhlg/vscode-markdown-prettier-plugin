# Markdown Prettier

마크다운을 더 읽기 쉽게 보여주는 VS Code / Cursor 확장입니다.

## 기능

- **Font Size 12px** — 본문 기본 폰트
- **색상 헤딩** — H1(파란), H2(초록), H3(노란) 색상 계층 구분
- **TOC 사이드바** — 좌측 목차 클릭 시 해당 섹션으로 이동
- **Ask Claude to Improve** — 텍스트 드래그 후 Claude Code에 개선 요청
- **Frontmatter 자동 제거** — YAML frontmatter는 미리보기에서 숨김 처리

## 설치

### VSIX 로컬 설치

```bash
cd ~/Leeyonghyun/vscode-markdown-viewer
npm install
npm run compile
npx @vscode/vsce package --allow-missing-repository
```

생성된 `.vsix` 파일을 설치:

`Cmd + Shift + P` → **"Extensions: Install from VSIX..."** → `markdown-prettier-0.0.1.vsix` 선택

## 사용법

1. `.md` 파일 열기
2. `Cmd + Shift + M` 또는 에디터 타이틀 바의 **MD 아이콘** 클릭
3. 우측에 커스텀 마크다운 프리뷰가 열림

### Claude Code 연동

1. 프리뷰에서 개선하고 싶은 텍스트를 **드래그 선택**
2. 선택 영역 위에 나타나는 **"Ask Claude to Improve"** 버튼 클릭
3. 터미널에 Claude Code가 열리면서 자동으로 개선 요청 전송

## 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd + Shift + M` | 마크다운 프리뷰 열기 |
