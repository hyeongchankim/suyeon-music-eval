import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, FileDown, Lock, Download, Music, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import { percentileTop, rankingState, RANKING_MIN } from "@/lib/ranking";
import OptInButton from "@/components/my/OptInButton";
import { toggleRankingOptIn, toggleAudioOptIn } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "arrival", label: "도착·공지" },
  { key: "report", label: "리포트" },
  { key: "ranking", label: "그룹랭킹" },
  { key: "media", label: "영상보관함" },
  { key: "audio", label: "음원공유" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const sumAvg = (scores: { average: number | null }[]) =>
  scores.reduce((s, x) => s + (x.average ?? 0), 0);

export default async function RoundDetailPage({
  params,
  searchParams,
}: {
  params: { roundId: string };
  searchParams: { tab?: string };
}) {
  const session = await requireStudent();
  const application = await db.application.findFirst({
    where: { studentId: session.studentId!, roundId: params.roundId },
    include: {
      round: true,
      scores: { orderBy: { pieceNo: "asc" } },
      media: true,
    },
  });
  if (!application) notFound();

  const tab: TabKey = (TABS.find((t) => t.key === searchParams.tab)?.key ??
    "arrival") as TabKey;
  const { round } = application;
  const myMajors = parseList(application.majors);

  // 그룹 키 = (targetSchool, major, roundId) — 최소 한 개 전공이 겹치는 동일 지망학교 지원자
  const sameGroup = <T extends { majors: string; targetSchool: string }>(rows: T[]) =>
    rows.filter(
      (a) =>
        a.targetSchool === application.targetSchool &&
        parseList(a.majors).some((m) => myMajors.includes(m)),
    );

  // 탭별로 필요한 그룹 집계만 조회
  let rankingMembers: { total: number; scored: boolean }[] = [];
  if (tab === "ranking") {
    const rows = await db.application.findMany({
      where: { roundId: round.id, rankingOptIn: true },
      include: { scores: true },
    });
    rankingMembers = sameGroup(rows).map((a) => ({
      total: sumAvg(a.scores),
      scored: a.scores.length > 0,
    }));
  }

  let audioMemberCount = 0;
  if (tab === "audio") {
    const rows = await db.application.findMany({
      where: { roundId: round.id, audioOptIn: true },
      select: { majors: true, targetSchool: true },
    });
    audioMemberCount = sameGroup(rows).length;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/my" className="text-sm text-ink/50 hover:text-primary">
          ← 회차 목록
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          {round.term} {round.roundNo}차
        </h1>
        <p className="text-sm text-ink/60">
          {formatRoundDate(round.date)} · {round.venue}
        </p>
      </div>

      {/* 탭 (모바일: 가로 스크롤 chip + sticky) */}
      <div className="sticky top-0 z-10 -mx-5 overflow-x-auto bg-surface px-5 py-2">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/my/${round.id}?tab=${t.key}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "border border-line bg-bg text-ink/70"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-6">
        {tab === "arrival" && <ArrivalTab round={round} />}
        {tab === "report" && (
          <ReportTab scores={application.scores} pieces={parseList(application.pieces)} />
        )}
        {tab === "ranking" && (
          <RankingTab
            groupLabel={`${application.targetSchool} · ${myMajors.join("/")} · ${round.roundNo}차`}
            optedIn={application.rankingOptIn}
            roundOpen={round.isOpen}
            applicationId={application.id}
            members={rankingMembers}
            myTotal={sumAvg(application.scores)}
            myScored={application.scores.length > 0}
          />
        )}
        {tab === "media" && <MediaTab media={application.media} />}
        {tab === "audio" && (
          <AudioTab
            optedIn={application.audioOptIn}
            roundOpen={round.isOpen}
            applicationId={application.id}
            memberCount={audioMemberCount}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- 탭 01 도착·공지 ---------- */
function ArrivalTab({
  round,
}: {
  round: { venue: string; venueAddress: string; arrivalNotice: string | null };
}) {
  const mapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(round.venueAddress)}`;
  return (
    <div className="space-y-4 text-[15px]">
      <div>
        <p className="text-sm text-ink/50">장소</p>
        <p className="font-medium">{round.venue}</p>
        <p className="text-ink/70">{round.venueAddress}</p>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
        >
          <MapPin className="h-4 w-4" /> 지도에서 보기
        </a>
      </div>
      <div>
        <p className="text-sm text-ink/50">운영진 공지</p>
        <p className="whitespace-pre-line text-ink/80">
          {round.arrivalNotice || "공지가 아직 등록되지 않았습니다."}
        </p>
      </div>
    </div>
  );
}

/* ---------- 탭 02 리포트 ---------- */
function ReportTab({
  scores,
  pieces,
}: {
  scores: {
    pieceNo: number;
    judge1: number | null;
    judge2: number | null;
    judge3: number | null;
    average: number | null;
    reportFileUrl: string | null;
  }[];
  pieces: string[];
}) {
  if (scores.length === 0) {
    return <p className="text-sm text-ink/60">채점이 완료되면 결과가 표시됩니다.</p>;
  }
  const total = sumAvg(scores);
  const mean = total / scores.length;
  const pdf = scores.find((s) => s.reportFileUrl)?.reportFileUrl;

  return (
    <div className="space-y-6">
      <div className="flex gap-8">
        <div>
          <p className="text-sm text-ink/50">총점</p>
          <p className="text-3xl font-bold text-primary">{total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-ink/50">평균</p>
          <p className="text-3xl font-bold">{mean.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="py-2 pr-4">곡</th>
              <th className="py-2 pr-4">심사1</th>
              <th className="py-2 pr-4">심사2</th>
              <th className="py-2 pr-4">심사3</th>
              <th className="py-2">평균</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.pieceNo} className="border-b border-line">
                <td className="py-2 pr-4">
                  {s.pieceNo}. {pieces[s.pieceNo - 1] ?? "-"}
                </td>
                <td className="py-2 pr-4">{s.judge1 ?? "-"}</td>
                <td className="py-2 pr-4">{s.judge2 ?? "-"}</td>
                <td className="py-2 pr-4">{s.judge3 ?? "-"}</td>
                <td className="py-2 font-semibold">{s.average?.toFixed(2) ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-btn border border-line p-4">
        <p className="font-medium">회차별 결과 안내서</p>
        {pdf ? (
          <a href={pdf} target="_blank" rel="noreferrer" className="btn-primary mt-2 inline-flex">
            <FileDown className="h-4 w-4" /> PDF 다운로드
          </a>
        ) : (
          <p className="mt-1 text-sm text-ink/60">관리자가 업로드하면 다운로드할 수 있습니다.</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <a href="mailto:suyeon@example.com?subject=점수 확인 요청" className="btn-ghost">
          점수 확인 요청
        </a>
        <a href="mailto:suyeon@example.com?subject=평가서 해석 요청" className="btn-ghost">
          평가서 해석 요청
        </a>
        <a href="mailto:suyeon@example.com?subject=추가 질문" className="btn-ghost">
          추가 질문하기
        </a>
      </div>
    </div>
  );
}

/* ---------- 탭 03 그룹랭킹 (캡처 8) ---------- */
function RankingTab({
  groupLabel,
  optedIn,
  roundOpen,
  applicationId,
  members,
  myTotal,
  myScored,
}: {
  groupLabel: string;
  optedIn: boolean;
  roundOpen: boolean;
  applicationId: string;
  members: { total: number; scored: boolean }[];
  myTotal: number;
  myScored: boolean;
}) {
  const state = rankingState(members.length, roundOpen);
  const scoredTotals = members.filter((m) => m.scored).map((m) => m.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink/50">내 그룹 (지망학교 × 전공 × 회차)</p>
          <p className="font-bold text-primary">{groupLabel}</p>
        </div>
        <OptInButton
          optedIn={optedIn}
          disabled={!roundOpen && !optedIn}
          action={toggleRankingOptIn.bind(null, applicationId)}
        />
      </div>

      {/* 상태 배지 — 시간마감 vs 인원미달 구분 */}
      {!optedIn ? (
        <Badge tone="muted">그룹랭킹에 아직 참여하지 않았습니다. 참여 신청 시 같은 그룹 인원 집계에 포함됩니다.</Badge>
      ) : state === "open" ? (
        myScored ? (
          <div className="rounded-card bg-primary/5 p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-sm text-ink/60">내 그룹 내 위치</p>
            <p className="text-3xl font-bold text-primary">
              상위 {percentileTop(myTotal, scoredTotals)}%
            </p>
            <p className="mt-1 text-xs text-ink/50">
              집계 인원 {members.length}명 · 본인에게만 표시됩니다.
            </p>
          </div>
        ) : (
          <Badge tone="muted">채점이 완료되면 내 순위(백분위)가 표시됩니다.</Badge>
        )
      ) : state === "recruiting" ? (
        <Badge tone="accent">
          모집 중 — 현재 {members.length}/{RANKING_MIN}명. 공개 기준({RANKING_MIN}명) 도달 시 순위가 공개됩니다.
        </Badge>
      ) : (
        <Badge tone="coral">
          인원 미달 마감 — 지망학교 그룹 인원이 공개 기준({RANKING_MIN}명)에 미달하여 그룹랭킹이 제공되지 않습니다.
        </Badge>
      )}

      <div>
        <p className="mb-2 font-medium">그룹랭킹 제도</p>
        <ul className="space-y-1 text-sm text-ink/70">
          <li>· 같은 지망학교·전공·회차 지원자끼리 상대적 위치를 확인합니다.</li>
          <li>· 개인정보 보호를 위해 그룹 인원이 {RANKING_MIN}명 이상일 때만 공개됩니다.</li>
          <li>· 순위는 본인에게만 백분위로 표시되며 다른 참가자에게는 공개되지 않습니다.</li>
        </ul>
      </div>
      <div>
        <p className="mb-2 font-medium">참여 방법</p>
        <ol className="space-y-1 text-sm text-ink/70">
          <li>1. 이 탭에서 &lsquo;참여 신청&rsquo;을 누릅니다. (회차 마감 전까지)</li>
          <li>2. 같은 그룹 참여자가 {RANKING_MIN}명 이상 모이면 집계가 시작됩니다.</li>
          <li>3. 채점 완료 후 내 백분위 순위가 이 화면에 표시됩니다.</li>
        </ol>
      </div>
    </div>
  );
}

/* ---------- 탭 04 영상보관함 (캡처 9) ---------- */
function MediaTab({
  media,
}: {
  media: { id: string; type: string; url: string; downloadable: boolean; expiresAt: Date | null }[];
}) {
  const feedback = media.filter((m) => m.type === "feedback");
  const performance = media.filter((m) => m.type === "performance");
  const now = Date.now();
  const daysLeft = (d: Date | null) =>
    d ? Math.ceil((d.getTime() - now) / 86_400_000) : null;

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 font-medium">피드백 영상</p>
        {feedback.length === 0 && (
          <p className="text-sm text-ink/60">등록된 피드백 영상이 없습니다.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.map((m) => {
            const left = daysLeft(m.expiresAt);
            const expired = left !== null && left <= 0;
            return (
              <div key={m.id} className="rounded-card border border-line p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    <Lock className="h-4 w-4" /> 피드백 영상
                  </span>
                  <span className={`text-xs ${expired ? "text-coral" : "text-ink/50"}`}>
                    {expired ? "만료됨" : left !== null ? `${left}일 후 만료` : "기간 제한 없음"}
                  </span>
                </div>
                {expired ? (
                  <p className="mt-3 text-sm text-ink/50">시청 기간이 종료되었습니다.</p>
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer" className="btn-ghost mt-3">
                    영상 보기
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 font-medium">연주 영상</p>
        {performance.length === 0 && (
          <p className="text-sm text-ink/60">등록된 연주 영상이 없습니다.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {performance.map((m) => (
            <div key={m.id} className="rounded-card border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">연주 영상</span>
                {m.downloadable && (
                  <span className="inline-flex items-center gap-1 text-xs text-accent">
                    <Download className="h-3.5 w-3.5" /> 다운로드 가능
                  </span>
                )}
              </div>
              <a href={m.url} target="_blank" rel="noreferrer" className="btn-ghost mt-3">
                {m.downloadable ? "다운로드" : "영상 보기"}
              </a>
            </div>
          ))}
        </div>
      </section>

      <p className="rounded-btn bg-surface p-3 text-xs text-ink/60">
        피드백 영상은 업로드 후 15일이 지나면 자동으로 만료됩니다. 연주 영상은 다운로드가 허용된 경우 저장할 수 있습니다.
      </p>
    </div>
  );
}

/* ---------- 탭 05 음원공유 (캡처 10) ---------- */
function AudioTab({
  optedIn,
  roundOpen,
  applicationId,
  memberCount,
}: {
  optedIn: boolean;
  roundOpen: boolean;
  applicationId: string;
  memberCount: number;
}) {
  const state = rankingState(memberCount, roundOpen);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
            optedIn ? "bg-accent/10 text-accent" : "bg-surface text-ink/60"
          }`}
        >
          <Music className="h-4 w-4" /> {optedIn ? "참여 중" : "미참여"}
        </span>
        <OptInButton
          optedIn={optedIn}
          disabled={!roundOpen && !optedIn}
          action={toggleAudioOptIn.bind(null, applicationId)}
        />
      </div>

      {optedIn && state === "open" ? (
        <Badge tone="accent">
          조건을 충족했습니다. 같은 그룹 참여자들의 연주 음원 링크가 이 곳에 공유됩니다. (음원 등록 시 표시)
        </Badge>
      ) : optedIn && state === "recruiting" ? (
        <Badge tone="muted">
          현재 {memberCount}/{RANKING_MIN}명. 동일 지망학교·전공 참여자가 {RANKING_MIN}명 이상 모이면 음원이 상호 공유됩니다.
        </Badge>
      ) : optedIn ? (
        <Badge tone="coral">인원 미달로 마감되어 음원 공유가 진행되지 않았습니다.</Badge>
      ) : (
        <Badge tone="muted">참여 신청 시 같은 그룹 참여자와 연주 음원을 공유할 수 있습니다.</Badge>
      )}

      <div>
        <p className="mb-2 font-medium">공유 조건</p>
        <ul className="space-y-1 text-sm text-ink/70">
          <li>· 동일 목표학교 · 전공 참여자가 {RANKING_MIN}명 이상일 때만 음원 링크가 공개됩니다.</li>
          <li>· 참여 신청/취소는 회차 마감 전까지 가능합니다.</li>
          <li>· 공유된 음원은 그룹 참여자 본인 학습 목적으로만 사용합니다.</li>
        </ul>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "muted" | "accent" | "coral";
}) {
  const cls = {
    muted: "bg-surface text-ink/70",
    accent: "bg-accent/10 text-accent",
    coral: "bg-coral/10 text-coral",
  }[tone];
  return <p className={`rounded-btn px-4 py-3 text-sm ${cls}`}>{children}</p>;
}
