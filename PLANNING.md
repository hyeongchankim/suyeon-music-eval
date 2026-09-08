# 수연음악학원 입시모의평가 접수 웹사이트 — 기획서 (Claude Code 작업용)

> 이 문서는 참고 서비스(예화 입시평가회) 캡처 10장을 분석해 도출한 요구사항을,
> "수연음악학원" 브랜드 + 완전히 다른 디자인 톤으로 재기획한 문서입니다.
> 프로젝트 루트에 `PLANNING.md`로 저장한 뒤, Claude Code에서
> "@PLANNING.md 참고해서 Phase 1부터 순서대로 구현해줘" 라고 요청하면 됩니다.

---

## 0. 확인이 필요한 실제 값 (개발 착수 전 채워야 함)

캡처 화면만으로는 알 수 없는 값입니다. 아래는 임시값이니 실제 정보로 교체해야 이용약관/개인정보처리방침이 법적으로 유효합니다.

- 상호: 수연음악학원 (실제 사업자등록증 상 상호명 확인)
- 사업자등록번호 / 통신판매업 신고번호: 확인 필요
- 대표 연락처 / 카카오톡 채널 ID / 대표 이메일: 확인 필요
- 실제 운영 전공: 원본은 "피아노 Season I" 단일 운영으로 보임 → 피아노만 할지, 성악·현악까지 확장할지 결정 필요 (본 문서는 피아노 단일 운영을 기본값으로 가정하고, 확장 가능한 구조로 설계함)
- 결제 여부: 원본 캡처에는 결제 UI가 없음(무료 신청 또는 별도 계좌이체 안내로 추정) → 온라인 결제 연동 필요 여부 결정 필요

---

## 1. 참고 화면 분석 → 기능 매핑

| 캡처 | 원본 화면 | 핵심 기능 | 수연음악학원 버전 처리 방향 |
|---|---|---|---|
| 1 | 랜딩페이지 | 히어로 + 전공소개 3종 + 차별점 6가지 + 후기 + CTA + 푸터 | 정보구조는 유지, 비주얼 톤 전면 교체 |
| 2 | 마이페이지(자가노트 탭) | 로그인 후 개인정보 카드 + 신청회차 리스트 + 6개 탭 | 그대로 채택, UI만 재설계 |
| 3~5 | 네이버폼 신청서 3단계 (22문항) | 참가자정보 / 연주자별 선택사항 / 연락처·개인정보 | 네이버폼 제거, 자체 3-step 폼으로 내재화 (DB 직결) |
| 6 | 탭01 도착·공지 | 입실시간 / 장소·주소·주차안내 / 운영진 공지 | 동일 |
| 7 | 탭02 리포트 | 총점 / 곡별 점수 / 결과안내서 PDF 다운로드 / 문의 3버튼 | 동일 + PDF는 관리자가 업로드하는 방식으로 명시 |
| 8 | 탭03 그룹랭킹 | (목표학교×전공×회차) 조합, 5인 이상일 때만 랭킹 공개 | 동일 로직, 자동 집계로 구현 |
| 9 | 탭04 영상보관함 | 피드백영상(15일 후 만료, 워터마크) / 연주영상(다운로드 가능) | 동일 + 기술적 구현 난이도 명시(아래 8장 참고) |
| 10 | 탭05 음원공유 | 동일 조건(5인 이상)일 때만 음원 링크 상호 공유 | 동일 |

### 원본에서 발견된 UX/로직 이슈 (그대로 베끼지 말아야 할 부분)

- **전공 선택(캡처3, 문항3)**: 라벨은 "복수선택"인데 실제 UI는 라디오버튼(단일 선택만 가능) → 체크박스로 수정.
- **참가희망일자(캡처3, 문항4)**: 마찬가지로 라디오버튼 → 신청서 1건당 1개 회차 응시가 맞다면 단일선택이 정상이지만, 라벨 문구는 통일해서 고쳐야 함.
- **로그인 보안(캡처2)**: ID + 휴대폰번호만으로 로그인 가능한 구조는 편의성은 높지만 계정탈취에 취약함. "비밀번호가 설정되어 있지 않습니다" 배너가 있는 걸 보면 원본도 이 문제를 인지하고 있음 → 수연 버전은 최초 3회 로그인 후 비밀번호 설정을 사실상 강제하는 팝업을 추가.
- **그룹랭킹/음원공유 마감 배지(캡처8, 10)**: "신청이 마감되었습니다"라는 배지가 시간마감/인원미달을 구분 없이 표시함 → 사유를 구분해서 보여주면 사용자 혼란이 줄어듦.

---

## 2. 사이트맵 (정보구조)

```
공개 영역
├─ /                        랜딩 페이지
├─ /apply                   신청서 (Step 1~3)
├─ /apply/complete          신청 완료 안내
├─ /login                   로그인 (참가자ID + 휴대폰번호)
├─ /privacy                 개인정보처리방침
└─ /terms                   이용약관

학생 영역 (로그인 필요)
├─ /my                      마이페이지 (정보카드 + 회차 리스트)
└─ /my/[roundId]            회차 상세
    ?tab=arrival | report | ranking | media | audio | note

관리자 영역 (스태프 로그인 필요)
├─ /admin/login
├─ /admin                   대시보드
├─ /admin/rounds            회차 개설/마감 관리
├─ /admin/applications      신청자 목록/상세
├─ /admin/scores            곡별 점수 입력, PDF 리포트 업로드
├─ /admin/notices           회차별 도착공지 작성
├─ /admin/media             영상/음원 업로드, 만료일 설정
└─ /admin/ranking           그룹 인원 집계, 공개 여부 관리
```

**왜 관리자 영역이 필요한가**: 캡처 10장은 전부 학생이 보는 화면입니다. 하지만 점수를 입력하고, 공지를 쓰고, 영상을 올리는 사람이 없으면 학생 화면에 뿌려줄 데이터 자체가 생기지 않습니다. 캡처에 없다고 생략하면 사이트가 껍데기만 있는 소개 페이지로 끝납니다.

---

## 3. 디자인 컨셉 — "Clean Studio"

예화는 짙은 브라운·골드 톤의 클래식/공연장 이미지였습니다. 수연음악학원은 정반대로 화이트 기반의 미니멀·모던 톤으로 갑니다.

### 컬러
| 용도 | 색상 | 코드 |
|---|---|---|
| 배경(기본) | White | `#FFFFFF` |
| 배경(섹션 구분) | Off-white | `#F7F8FA` |
| 본문 텍스트 | 진한 슬레이트 | `#1A1D29` |
| Primary (신뢰감, 헤더/버튼) | 딥 네이비 | `#22335F` |
| Accent (포인트, 강조 CTA) | 틸 | `#14B8A6` |
| 보조 강조 (마감임박 등 제한적 사용) | 코랄 | `#FF7A59` |
| 구분선/보더 | 라이트 그레이 | `#E7E9EE` |

### 타이포그래피
- 본문/제목: **Pretendard** (무료, 한글 웹폰트 — `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`)
- 숫자 강조(점수, 회차번호 등): Pretendard Bold 또는 Poppins 혼용
- 헤드라인 32~48px Bold / 본문 15~16px Regular, line-height 1.6

### 형태 언어
- 카드: radius 16px, `box-shadow: 0 4px 20px rgba(20,30,50,0.06)`
- 버튼: radius 10px, Primary(채움) / Ghost(아웃라인) 2종
- 섹션 간 여백: PC 80px / 모바일 48px
- 아이콘: lucide-react (무료, React 생태계에서 표준적으로 쓰임)

### 예화와의 차별점 요약
- 다크 사진 히어로 → 라이트 배경 + 그라디언트 블롭/일러스트
- 세리프 느낌의 큰 타이포 → 산세리프 + 여백 중심의 에디토리얼 스타일
- 골드 포인트 → 틸 포인트

---

## 4. 반응형 가이드

- Breakpoints: 모바일 ~639px / 태블릿 640~1023px / 데스크톱 1024px~
- 헤더: PC는 가로 메뉴, 모바일은 햄버거 + 슬라이드 메뉴
- 히어로: PC는 좌측 텍스트 + 우측 이미지/일러스트 2단, 모바일은 세로 1단 (텍스트 2줄로 축소)
- 전공소개 카드: PC 3열 → 태블릿 2열 → 모바일 1열
- 6개 탭(마이페이지): PC는 가로 나열 고정, 모바일은 `overflow-x:auto` 가로 스크롤 chip + 상단 sticky
- 신청서(Step Form): PC는 폭 720px 중앙 정렬 카드, 모바일은 풀블리드 + 상단 고정 진행바(1/3, 2/3, 3/3)
- 터치 타겟: 버튼/입력창 최소 높이 44px (모바일 터치 접근성)

### 랜딩 히어로 와이어프레임 (텍스트 스케치)

```
[로고 수연음악학원]                    [My 로그인]
─────────────────────────────────────────
  당신의 무대는, 실전처럼.
  입시 현장과 같은 환경에서 미리 평가받고,
  솔직한 피드백으로 다음 무대를 준비하세요.

  [모의평가 신청하기]  [결과 조회 로그인]

  다음 회차: 09.13(일) · 피아노 1차   D-5
─────────────────────────────────────────
```

### 마이페이지 레이아웃 와이어프레임

```
[정보카드: 이름/ID/전화/이메일/신청회차]   [비밀번호 설정 유도]
──────────────────────────────────
[회차1 카드] [회차2 카드] ...
──────────────────────────────────
[도착공지][리포트][그룹랭킹][영상][음원][자가노트]  ← 탭 (모바일: 가로스크롤)
──────────────────────────────────
(선택된 탭 콘텐츠 영역)
```

---

## 5. 페이지별 상세 기획

### 5.1 랜딩 페이지 (`/`)
1. 헤더: 로고, 우측 로그인 링크
2. 히어로: 카피 + 서브카피 + 다음 회차 안내(D-day) + CTA 2개
3. 과정 소개: 카드형(현재는 피아노 1종, 확장 대비 컴포넌트는 N개 대응 가능하게)
4. 차별점 6가지: 2×3 그리드 — 실전무대평가 / 다양한무대경험 / 검증된 심사위원 / 세분화된 평가모델 / 그룹랭킹 제공 / 음원 공유
5. 후기 슬라이더
6. CTA 배너 + 푸터(상호/사업자정보/연락처/약관 링크)

### 5.2 신청서 (`/apply`) — 자체 제작 3-Step 폼

**Step 1. 참가자 정보**
- 참가자명 *(필수, text)*
- 지도교수명 *(선택, text)*
- 전공 *(필수, 체크박스 다중선택)*
- 참가 희망 회차 *(필수, 관리자가 등록한 열린 회차 목록에서 라디오 선택 — 날짜/장소 표기)*
- 희망 목표(지망학교) *(필수, text, 복수 기재 시 우선순위 안내 문구)*
- 참가곡수 *(필수, select 1~5 또는 기타)*
- 참가곡명 1~5 *(곡수만큼만 입력창 노출, 순서대로)*

**Step 2. 연주자별 선택사항** (전부 선택사항)
- 스케일연주 희망 (Y/N)
- 블라인드심사 희망 (Y/N)
- 악보 심사평 체크 희망 (Y/N)
- 연주 희망 시간대 (text, "10시~15시 중 OO시-OO시" 가이드)
- 심사위원에게 질문 (textarea, 합격가능성 등 예측성 질문 제외 안내)

**Step 3. 연락처 및 동의**
- 참가자ID *(필수, 영문+숫자, 로그인용, 중복확인 API 필요)*
- 휴대폰번호 *(필수, 로그인용)*
- 이메일 *(필수)*
- 유의사항 확인 *(필수, Y/N)*
- 이벤트 참여자 닉네임 *(선택)*
- 개인정보 수집·이용 동의 *(필수 체크, 수집항목/목적/보유기간 명시)*

제출 로직:
- 신청서 제출 → `Student`(신규면 생성, 기존 ID면 매칭) + `Application` 레코드 생성
- 완료 페이지: 신청번호, "회차 2일 전 개별 안내 문자 발송" 안내, 로그인 페이지 이동 버튼

### 5.3 로그인 (`/login`)
- 참가자ID + 휴대폰번호 입력 → 매칭 조회 → 세션 발급
- 최초 로그인 시 "비밀번호 설정" 유도 배너 (설정하면 이후 ID+비밀번호 로그인도 가능)
- **보안 권장사항**: ID+휴대폰만 남을 경우를 대비해, 로그인 3회 이상 시 비밀번호 설정 팝업을 사실상 강제 (완전 강제는 UX 마찰이 크므로 "나중에" 옵션은 남기되 배너 지속 노출)

### 5.4 마이페이지 (`/my`, `/my/[roundId]`)
- 상단 정보카드: 이름/ID/휴대폰/이메일/신청회차, 비밀번호 설정 CTA
- 신청 회차 리스트(여러 회차 응시 시 카드형 리스트, 선택 시 하이라이트)
- 회차 상세 6개 탭:

**탭 01 도착·공지**: 입실시간, 장소(주소+지도 링크), 주차 안내, 운영진 공지(관리자가 텍스트/링크로 작성)

**탭 02 리포트**: 총점(강조), 곡별 점수, "회차별 결과 안내서" PDF 다운로드 카드(관리자 업로드), 하단 CTA 3개(점수확인요청/평가서해석요청/추가질문하기 → 문의 모달 또는 카카오채널 연결)

**탭 03 그룹랭킹**: 이번 회차 랭킹 가능 그룹(목표학교×전공×회차 조합, 5인 이상만 노출), 참여신청 버튼(마감 전) / 마감 배지(사유 구분: 시간마감 vs 인원미달), 제도 설명 3-bullet, 참여방법 3-step

**탭 04 영상보관함**: 피드백 영상 카드(잠금/만료 표시), 연주 영상 카드(다운로드 가능 배지), 업로드 후 15일 자동 만료 정책 안내

**탭 05 음원공유**: 참여신청 상태 배지, 조건(동일 목표학교·전공 5인 이상) 안내, 신청/취소 버튼

**탭 06 자가노트**: "본인에게만 표시, 관리자·심사위원 비공개" 배너, textarea 3개(좋았던 점/아쉬운 점/다음 연습포인트) + 저장 버튼

### 5.5 관리자 페이지 (`/admin/*`)
- `/admin/login`: 스태프 이메일+비밀번호 로그인
- `/admin`: 대시보드 (다가오는 회차, 신규 신청 수, 미채점 건수)
- `/admin/rounds`: 회차 개설/마감/장소 관리
- `/admin/applications`: 신청자 목록·상세, 상태 변경(접수/확정/취소)
- `/admin/scores`: 곡별 점수 입력(심사위원1~3), 평균 자동계산, PDF 리포트 업로드
- `/admin/notices`: 회차별 도착공지 작성
- `/admin/media`: 영상/음원 업로드(파일 또는 외부 링크), 다운로드 허용 여부, 만료일 설정
- `/admin/ranking`: (목표학교×전공×회차) 조합별 인원 자동 집계, 5인 미만 시 자동 비공개, 수동 재계산 버튼

---

## 6. 데이터 모델 (Prisma Schema 초안)

```prisma
model Student {
  id           String   @id @default(cuid())
  loginId      String   @unique   // 참가자ID (영문+숫자)
  name         String
  phone        String
  email        String
  passwordHash String?            // 선택 설정
  createdAt    DateTime @default(now())
  applications Application[]
}

model Round {
  id            String   @id @default(cuid())
  term          String             // 예: "피아노 Season I"
  roundNo       Int                // 1차, 2차 ...
  date          DateTime
  venue         String
  venueAddress  String
  isOpen        Boolean  @default(true)
  arrivalNotice String?            // 도착공지 텍스트/링크
  applications  Application[]
}

model Application {
  id               String   @id @default(cuid())
  studentId        String
  roundId          String
  majors           String[]        // 다중선택
  advisorName      String?
  targetSchool     String
  pieceCount       Int
  pieces           String[]        // 곡명1~5
  wantsScale       Boolean  @default(false)
  wantsBlind       Boolean  @default(false)
  wantsScoreReview Boolean  @default(false)
  preferredTime    String?
  questionForJudge String?
  agreedNotice     Boolean  @default(false)
  eventNickname    String?
  rankingOptIn     Boolean  @default(false)
  audioOptIn       Boolean  @default(false)
  status           String   @default("접수")  // 접수/확정/취소
  createdAt        DateTime @default(now())

  student  Student   @relation(fields: [studentId], references: [id])
  round    Round     @relation(fields: [roundId], references: [id])
  scores   Score[]
  selfNote SelfNote?
  media    MediaAsset[]
}

model Score {
  id            String  @id @default(cuid())
  applicationId String
  pieceNo       Int
  judge1        Float?
  judge2        Float?
  judge3        Float?
  average       Float?
  reportFileUrl String?           // PDF 링크

  application Application @relation(fields: [applicationId], references: [id])
}

model SelfNote {
  id            String   @id @default(cuid())
  applicationId String   @unique
  goodPoints    String?
  improvePoints String?
  nextPractice  String?
  updatedAt     DateTime @updatedAt

  application Application @relation(fields: [applicationId], references: [id])
}

model MediaAsset {
  id            String    @id @default(cuid())
  applicationId String
  type          String    // "feedback" | "performance" | "audio"
  url           String
  downloadable  Boolean   @default(false)
  expiresAt     DateTime? // 예: 업로드 + 15일

  application Application @relation(fields: [applicationId], references: [id])
}

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  role         String @default("staff")
}
```

---

## 7. 그룹랭킹 / 음원공유 집계 로직 (핵심 비즈니스 로직)

```
그룹 키 = (targetSchool, major, roundId)

1. 해당 회차의 Application 중 rankingOptIn = true 인 건을 그룹 키로 GROUP BY
2. count >= 5 인 그룹만 "랭킹 가능 그룹" 태그로 노출
3. 사용자가 속한 그룹이 조건을 충족하면 본인의 점수 기준 순위(percentile) 계산해서 본인에게만 노출
4. 조건 미충족 시 "지망학교 그룹 인원이 공개 기준에 미달하여 그룹랭킹이 제공되지 않습니다" 안내

음원공유도 동일한 그룹 키 + audioOptIn 기준으로 동일 로직 적용 (기준 인원 5명은 운영 정책에 따라 조정 가능한 설정값으로 관리)
```

---

## 8. 영상/음원 만료·다운로드 정책 — 기술적으로 현실적인 구현 난이도

원본은 "워터마크 적용, 15일 후 자동삭제, 다운로드 가능/불가 구분"까지 구현되어 있습니다. 이걸 그대로 따라가려면 난이도 차이가 있으니 단계별로 나누는 걸 권장합니다.

- **Phase 1 (쉬움)**: 파일을 Storage에 올리고, DB에 `expiresAt` 저장 → 화면에서 만료 여부만 체크해서 잠금 표시. 실제 파일 삭제는 배치(cron)로 나중에 처리.
- **Phase 2 (중간)**: presigned URL(서명된 임시 링크)로 만료 시간 자체를 스토리지 레벨에서 강제 (Supabase Storage / Cloudflare R2 지원).
- **Phase 3 (어려움, 선택사항)**: 업로드 시 ffmpeg로 워터마크 오버레이 영상 자동 생성. 서버 리소스와 처리 시간이 필요하므로 초기 MVP 범위에서는 제외 권장.

---

## 9. 기술 스택 제안

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) + TypeScript | 랜딩+로그인+API를 한 프로젝트에서 처리, Vercel 배포 간편 |
| 스타일 | TailwindCSS + shadcn/ui 일부 | 빠른 반응형 구현, 커스텀 디자인 토큰 적용 용이 |
| DB/ORM | PostgreSQL + Prisma (개발 중엔 SQLite 대체 가능) | 타입 안전한 스키마, 마이그레이션 관리 |
| 인증 | 커스텀 세션 (iron-session 또는 NextAuth Credentials Provider) | ID+휴대폰 기반 로그인은 표준 소셜로그인이 아니라 커스텀 로직 필요 |
| 파일 저장 | Supabase Storage 또는 Cloudflare R2 | 영상/음원/PDF, presigned URL로 만료 정책 구현 가능 |
| 폼 검증 | zod + react-hook-form | 3-step 폼의 단계별 검증에 적합 |
| 배포 | Vercel(프론트+API) + Supabase(DB+Storage) | 가장 빠르게 시작 가능, 무료 티어로 MVP 검증 가능 |

**인프라 대안**: 이미 Azure 실무 경험이 있으므로, 서비스가 안정화된 이후 Azure Static Web Apps + Azure Database for PostgreSQL + Azure Blob Storage 조합으로 이전하는 것도 현실적인 선택지입니다. 다만 초기 MVP는 설정이 더 간단한 Vercel+Supabase로 빠르게 검증한 뒤, 트래픽/비용 패턴을 보고 이전 여부를 결정하는 걸 권장합니다.

### 폴더 구조 제안

```
/app
  /(marketing)
    page.tsx                 랜딩
    apply/page.tsx
    apply/complete/page.tsx
    login/page.tsx
    privacy/page.tsx
    terms/page.tsx
  /my
    page.tsx
    [roundId]/page.tsx        (?tab=arrival|report|ranking|media|audio|note)
  /admin
    login/page.tsx
    page.tsx
    rounds/page.tsx
    applications/page.tsx
    scores/page.tsx
    notices/page.tsx
    media/page.tsx
    ranking/page.tsx
  /api
    auth/route.ts
    applications/route.ts
    scores/route.ts
    ranking/route.ts
/components
  ui/            (버튼, 카드, 인풋 등 shadcn 기반)
  marketing/     (Header, Footer, Hero, MajorCard, FeatureGrid, TestimonialSlider, CTASection)
  mypage/        (RoundCard, TabNav, ReportCard, RankingTagList, MediaCard, AudioShareCard, SelfNoteForm)
  admin/         (AdminTable, ScoreInputForm, StatusBadge)
/lib
  db.ts          (Prisma client)
  auth.ts
  validators.ts  (zod 스키마)
/prisma
  schema.prisma
```

---

## 10. 단계별 개발 로드맵

- **Phase 1 (MVP)**: 랜딩페이지, 신청서(DB 저장까지), 로그인, 마이페이지(도착공지/리포트/자가노트 탭만), 관리자 최소 기능(회차관리, 신청자조회, 점수입력)
- **Phase 2**: 그룹랭킹 자동집계, 음원공유, 영상 업로드 + 만료 정책(presigned URL)
- **Phase 3**: 알림톡/SMS 연동(회차 마감 임박 알림), 워터마크 자동삽입, 결제 연동(필요 시)

---

## 11. Claude Code 시작 프롬프트 (그대로 복사해서 사용)

```
이 프로젝트를 아래 순서로 진행해줘. 각 단계 완료 후 다음 단계로 넘어가기 전에
빌드 에러가 없는지 확인해줘.

1. Next.js 14 (App Router, TypeScript, TailwindCSS) 프로젝트를 초기화하고
   PLANNING.md의 "9. 기술 스택 제안 > 폴더 구조 제안"에 맞게 폴더를 구성해줘.
2. PLANNING.md의 "6. 데이터 모델"을 기준으로 prisma/schema.prisma를 작성하고,
   개발 단계에서는 SQLite로 연결해줘.
3. PLANNING.md의 "3. 디자인 컨셉"에 정의된 컬러/타이포/카드 스타일을
   tailwind.config에 디자인 토큰으로 등록해줘.
4. "5.1 랜딩 페이지" 기획대로 반응형 랜딩 페이지를 만들어줘.
   (모바일 브레이크포인트는 "4. 반응형 가이드" 기준)
5. "5.2 신청서" 기획대로 3-step 폼을 만들고, 제출 시 DB에 Student/Application이
   생성되도록 API 라우트까지 연결해줘.
6. "5.3 로그인"과 "5.4 마이페이지" (우선 도착공지/리포트/자가노트 3개 탭)를 구현해줘.
7. "5.5 관리자 페이지"의 회차관리/신청자조회/점수입력 최소 기능을 구현해줘.

Phase 1 범위는 여기까지야. 그룹랭킹, 음원공유, 영상 업로드는 Phase 2로 남겨줘.
```

---

## 12. 남은 결정사항 체크리스트

- [ ] 실제 사업자정보/연락처/카카오채널 확정
- [ ] 운영 전공 범위(피아노 단일 vs 다전공) 확정
- [ ] 온라인 결제 연동 필요 여부
- [ ] 그룹랭킹/음원공유 기준 인원(현재 5명) 유지 여부
- [ ] 영상 워터마크를 Phase 1부터 넣을지, Phase 3로 미룰지
