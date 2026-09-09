# 모아보다 브랜드 애셋

영문 병기는 보류 상태입니다 — 모든 락업은 한글 워드마크만 포함.

## 로고
| 파일 | 용도 |
| --- | --- |
| logo-horizontal-green.svg | 웹 헤더 기본 |
| logo-vertical-green.svg | 스플래시 · 로그인 화면 |
| logo-symbol-green.svg | 심볼 단독 (절취선 여백 투명) |
| logo-symbol-reverse.svg | 그린/어두운 배경 위 |
| logo-*-mono.svg | 리드미 · 1비트 인쇄 · 스티커 |
| favicon.svg | 파비콘 (32px 기준 축약형) |
| app-icon-512/192/180/64/32.png | PWA · 애플 터치 아이콘 |

워드마크 SVG의 한글은 `<text>`이며 IBM Plex Sans KR 600을 씁니다.
해당 폰트가 없는 환경에서 정확한 형태가 필요하면 텍스트를 아웃라인으로 변환해서 쓰세요.

## 여백 · 최소 크기
- 여백: 심볼 한 변의 1/4 이상 (절취선 원 포함해 계산)
- 최소: 심볼 단독 16px, 가로 락업 88px 폭
- 금지: 절취선 원을 배경색과 다른 색으로 채우기, 자간 임의 변경, 그린+황동 외 색 추가

## 색
`tokens.css`를 import 하거나 `tokens.json`을 그대로 쓰세요.
그린은 로고·활성 탭·FAB·선택된 내비게이션에만, 황동은 별점·도트에만 소량.
회색조도 순회색 대신 그린이 살짝 섞인 `--moa-green-soft` / `--moa-text-muted`를 사용.

## HTML 예시
```html
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/app-icon-180.png">
<img src="/assets/logo-horizontal-green.svg" alt="모아보다" height="32">
```

## 카테고리 색
- 공연 `#27473C` · 영화 `#5E4A6B` · 책 `#A8543B`
- 영화는 원래 황동 `#C08A2E` 이었으나 별점 도트와 같은 값이라 구분되지 않아 플럼으로 바꿨다.
- 캘린더 일요일 `#A8544B`
- 선택된 날짜만 그린 채움, 기록 표시는 카테고리 점으로.

## 차트 색
- 순위형(장르·공연·배우·별점 분포): 그린 농담 5단계 `--moa-chart-1` → `--moa-chart-5`. 크기 순서와 색 순서를 일치시킬 것.
- 트랙(빈 막대) `#F2F5F3`, 평균선/1~3위 번호 `#C08A2E`.
- 관람 예정은 채움 대신 사선 패턴: `repeating-linear-gradient(135deg,#C3D2CB 0 3px,#E2E9E5 3px 6px)`
