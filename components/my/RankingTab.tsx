"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { RANKING_MIN } from "@/lib/ranking";
import OptInButton from "@/components/my/OptInButton";
import Badge from "@/components/my/Badge";
import { toggleRankingOptIn } from "@/app/my/[roundId]/actions";

type RankingResponse = {
  group: { targetSchool: string; majors: string[]; roundNo: number };
  optedIn: boolean;
  roundOpen: boolean;
  state: "open" | "recruiting" | "closed_shortfall";
  memberCount: number;
  minMembers: number;
  scoredCount: number;
  myScored: boolean;
  percentileTop: number | null;
  myTotal: number | null;
};

// 탭03 그룹랭킹 — GET /api/ranking 로 집계 결과를 받아 렌더 (opt-in 토글 후 재조회)
export default function RankingTab({
  roundId,
  applicationId,
}: {
  roundId: string;
  applicationId: string;
}) {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/ranking?roundId=${encodeURIComponent(roundId)}`);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "그룹랭킹을 불러오지 못했습니다");
      return;
    }
    setData(body as RankingResponse);
  }, [roundId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Badge tone="coral">{error}</Badge>;
  if (!data) return <p className="text-sm text-ink/60">불러오는 중...</p>;

  const { group, optedIn, roundOpen, state, memberCount, myScored, percentileTop } = data;
  const groupLabel = `${group.targetSchool} · ${group.majors.join("/")} · ${group.roundNo}차`;

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
          action={async (optIn) => {
            const r = await toggleRankingOptIn(applicationId, optIn);
            await load();
            return r;
          }}
        />
      </div>

      {/* 상태 배지 — 시간마감 vs 인원미달 구분 */}
      {!optedIn ? (
        <Badge tone="muted">
          그룹랭킹에 아직 참여하지 않았습니다. 참여 신청 시 같은 그룹 인원 집계에 포함됩니다.
        </Badge>
      ) : state === "open" ? (
        myScored ? (
          <div className="rounded-card bg-primary/5 p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-sm text-ink/60">내 그룹 내 위치</p>
            <p className="text-3xl font-bold text-primary">상위 {percentileTop}%</p>
            <p className="mt-1 text-xs text-ink/50">
              집계 인원 {memberCount}명 · 본인에게만 표시됩니다.
            </p>
          </div>
        ) : (
          <Badge tone="muted">채점이 완료되면 내 순위(백분위)가 표시됩니다.</Badge>
        )
      ) : state === "recruiting" ? (
        <Badge tone="accent">
          모집 중 — 현재 {memberCount}/{RANKING_MIN}명. 공개 기준({RANKING_MIN}명) 도달 시 순위가 공개됩니다.
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
