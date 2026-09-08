# 수연음악학원 입시모의평가 (Phase 1)

Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma(SQLite, 개발용)

## 시작하기

```bash
npm install
cp .env.example .env      # SESSION_PASSWORD 를 32자 이상 임의 문자열로 교체
npm run db:push           # SQLite 스키마 반영
npm run db:seed           # 관리자/회차/데모 학생 생성
npm run dev
```

- 관리자: `admin@suyeon.test` / `admin1234` → `/admin/login`
- 데모 학생: ID `demo01` / 비밀번호 `demo1234` → `/login`

## 구현 범위 (Phase 1)

| 영역 | 경로 |
|---|---|
| 랜딩 | `/` |
| 신청서 3-step + 제출 API | `/apply`, `POST /api/applications` |
| 로그인 | `/login`, `POST /api/auth` |
| 마이페이지 (도착공지·리포트·자가노트) | `/my`, `/my/[roundId]?tab=` |
| 관리자 (회차관리·신청자조회·점수입력) | `/admin/*`, `POST /api/scores` |

## Phase 2 이후로 남긴 것

- 그룹랭킹 자동집계 / 음원공유 (`/api/ranking` 는 501 스텁)
- 영상 업로드 + 만료 정책(presigned URL), 워터마크
- 알림톡/SMS, 온라인 결제
- 마이페이지 그룹랭킹·영상·음원 탭

## 참고

- SQLite 는 Prisma 스칼라 리스트를 지원하지 않아 `Application.majors` / `pieces` 는
  JSON 문자열로 저장. Postgres 이전 시 `String[]` 로 전환.
- `PLANNING.md` 가 원본 기획서.
- 푸터/약관/개인정보처리방침의 사업자정보는 임시값 — 시행 전 실제 값 + 법률 검토 필요.
