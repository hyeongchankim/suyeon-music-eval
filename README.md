# 수연음악학원 입시모의평가 (Phase 1)

입시 모의평가 접수 · 결과 조회 웹사이트.

**스택**: Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma · iron-session
**DB**: PostgreSQL (로컬·배포 공통) — Vercel 배포는 아래 [Vercel 배포](#vercel-배포) 참고

---

## 개발 환경 셋팅

### 0. 사전 요구사항

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | 20 LTS 이상 (개발은 22/24에서 확인) | https://nodejs.org |
| npm | 10 이상 | Node 설치 시 포함 |
| Git | 최신 | |

버전 확인:

```bash
node -v
npm -v
```

### 1. 저장소 클론

```bash
git clone https://github.com/hyeongchankim/suyeon-music-eval.git
cd suyeon-music-eval
```

### 2. 의존성 설치

```bash
npm install
```

> `postinstall` 스크립트가 `prisma generate`(Prisma Client 생성)를 자동 실행합니다.
> 설치 로그 마지막에 `Generated Prisma Client` 가 보이면 정상입니다.

### 3. 환경변수 파일 생성

`.env.example` 을 복사해 `.env` 를 만듭니다. (`.env` 는 git 에 커밋되지 않습니다)

```bash
cp .env.example .env
```

`.env` 항목:

| 키 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (`postgresql://user:pw@host/db?sslmode=require`). 무료 옵션: [Neon](https://neon.tech) 또는 [Supabase](https://supabase.com) |
| `SESSION_PASSWORD` | iron-session 쿠키 암호화 키. **32자 이상** 필수 |

로컬 개발용 DB 는 Neon 프로젝트를 하나 만들어 그 연결 문자열을 그대로 쓰면 됩니다.
(Docker 로 로컬 Postgres 를 띄워도 됩니다: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:16` → `DATABASE_URL="postgresql://postgres:pw@localhost:5432/postgres"`)

`SESSION_PASSWORD` 생성 예시:

```bash
openssl rand -base64 32
# 또는
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 데이터베이스 초기화

```bash
npm run db:push    # prisma/schema.prisma → DB 에 테이블 생성
npm run db:seed    # 관리자/회차/데모·더미 학생/점수 생성
```

### 5. 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000

### 6. 로그인 계정 (seed 로 생성됨)

| 구분 | 경로 | 아이디 | 비밀번호 |
|---|---|---|---|
| 관리자 | `/admin/login` | `admin` | `admin` |
| 데모 학생 | `/login` | `demo01` | `demo1234` |
| 전공별 더미 학생 | `/login` | `piano01` / `vocal01` / `string01` / `wind01` / `compose01` | `test1234` |

더미 학생 5명은 각자 열린 회차에 신청 + 곡별 5심사 점수가 채워져 있습니다.

---

## 자주 쓰는 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 (타입 체크 포함) |
| `npm start` | 빌드 결과 실행 (`npm run build` 후) |
| `npm run lint` | ESLint |
| `npm run db:push` | 스키마를 DB 에 반영 (마이그레이션 파일 없이) |
| `npm run db:seed` | 초기 데이터 삽입 (`prisma/seed.ts`) |
| `npx prisma studio` | 브라우저 DB 뷰어 (http://localhost:5555) |
| `npx tsx lib/ranking.check.ts` | 그룹랭킹 집계 로직 자가검증 |

---

## 자주 겪는 문제

**빌드 캐시 꼬임** (`Cannot find module './xxx.js'`, 스타일 사라짐 등)
`next dev` 실행 중에 `next build` 를 돌리면 `.next` 가 충돌합니다. dev 서버를 끄고:

```bash
rm -rf .next
npm run dev
```

**DB 를 처음 상태로 되돌리기**

```bash
rm -f prisma/dev.db
npm run db:push
npm run db:seed
```

**포트 3000 이 이미 사용 중**

```bash
npm run dev -- -p 3001
```

**스키마(`prisma/schema.prisma`)를 수정했을 때**

```bash
npm run db:push        # DB 반영
npx prisma generate    # 타입 재생성 (db:push 가 대개 자동 실행)
```

---

## Vercel 배포

이 저장소는 Vercel 에 바로 배포할 수 있게 준비되어 있습니다.
빌드 명령은 `package.json` 의 `vercel-build` 스크립트를 사용합니다:

```
prisma generate && prisma db push && next build
```

= 배포할 때마다 스키마를 DB 에 반영한 뒤 빌드합니다. (관리자가 입력한 데이터는 유지됩니다.)

**최초 1회 시드**: 새 DB 라면 로컬에서 운영 DB 를 가리켜 시드를 한 번 실행합니다.

```bash
# PowerShell
$env:DATABASE_URL="postgresql://...(운영 문자열)"; npm run db:seed
# bash
DATABASE_URL="postgresql://...(운영 문자열)" npm run db:seed
```

### 1) PostgreSQL 준비

[Neon](https://neon.tech) 에서 프로젝트를 만들고 **connection string** 을 복사합니다.
(Supabase 를 쓸 경우 마이그레이션/`db push` 는 pooler 가 아닌 **Direct connection** 문자열을 사용해야 합니다.)

### 2) Vercel 프로젝트 생성

1. https://vercel.com → **Add New… → Project** → GitHub 저장소 `hyeongchankim/suyeon-music-eval` 를 **Import**
2. Framework Preset 은 자동으로 **Next.js** 로 잡힙니다. Build/Output 설정은 그대로 둡니다.
3. **Environment Variables** 에 추가:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | 1)에서 복사한 PostgreSQL 문자열 |
   | `SESSION_PASSWORD` | 32자 이상 임의 문자열 (`openssl rand -base64 32`) |

4. **Deploy** 클릭 → 빌드가 끝나면 `https://<프로젝트>.vercel.app` 로 접속

### 3) 로그인 계정

시드로 생성됩니다 — 관리자 `admin` / `admin`, 데모 학생 `demo01` / `demo1234`
(외부에 공개되는 데모이므로 필요하면 시드에서 비밀번호를 바꾸세요.)

### CLI 로 배포하려면

```bash
npm i -g vercel
vercel login
vercel            # 최초: 프로젝트 연결 + 프리뷰 배포
vercel --prod     # 운영 배포
```

환경변수는 `vercel env add DATABASE_URL` / `vercel env add SESSION_PASSWORD` 로 등록합니다.

---

## 폴더 구조

```
app/
  (marketing)/        랜딩 · 신청서 · 로그인 · 약관/개인정보
  my/                 학생 마이페이지 (로그인 필요)
    [roundId]/        회차 상세 — ?tab=arrival|report|ranking|media|audio
  admin/              관리자 (스태프 로그인 필요)
  api/                auth · applications · scores · ranking
components/           ui 조각 (site / marketing / apply / my / admin)
lib/
  db.ts              Prisma 클라이언트
  auth.ts            iron-session 세션 (학생 / 관리자)
  validators.ts      zod 스키마
  ranking.ts         그룹랭킹 집계 로직
prisma/
  schema.prisma      데이터 모델
  seed.ts            초기 데이터
```

---

## 구현 범위 (Phase 1)

| 영역 | 경로 |
|---|---|
| 랜딩 | `/` |
| 신청서 3-step + 제출 | `/apply`, `POST /api/applications` |
| 로그인 (ID + 비밀번호) | `/login`, `POST /api/auth` |
| 마이페이지 | `/my`, `/my/[roundId]?tab=arrival\|report\|ranking\|media\|audio` |
| 관리자 | `/admin` (대시보드 · 회차관리 · 인원관리 · 신청자조회 · 점수입력), `POST /api/scores` |

마이페이지 탭 6종 중 **도착·공지 / 리포트** 는 실데이터 연동 완료.
**그룹랭킹 / 영상보관함 / 음원공유** 는 UI + 참여 신청(opt-in) 토글까지 구현되어 있으며,
자동 집계·실파일 연동은 Phase 2 범위입니다.

## Phase 2 이후로 남긴 것

- 그룹랭킹 / 음원공유 자동 집계 · 상호 공유 (`/api/ranking` 은 현재 501 스텁)
- 영상·음원 파일 업로드 + 만료 정책(presigned URL) + 워터마크
- 알림톡 / SMS (회차 안내), 온라인 결제

## 운영 전환 체크리스트

- [ ] `SESSION_PASSWORD` 를 운영 환경의 안전한 랜덤값으로 교체
- [ ] `vercel-build` 스크립트에서 `prisma db seed` 제거 (데모 데이터 자동 삽입 방지)
- [ ] 관리자/데모 계정 비밀번호 변경 또는 시드에서 제거
- [ ] `prisma db push` → 정식 마이그레이션(`prisma migrate`)으로 전환
- [ ] 서버리스 환경 커넥션 풀링 점검 (Neon/Supabase pooler + `?pgbouncer=true&connection_limit=1`)
- [ ] `Application.majors` / `pieces` / `roundIds` 는 JSON 문자열 저장 중 → 필요 시 `String[]` 로 전환
- [ ] 푸터 · 약관 · 개인정보처리방침의 사업자정보(현재 임시값) 실제 값 반영 + 법률 검토

## 참고

- `PLANNING.md` 가 원본 기획서입니다.
