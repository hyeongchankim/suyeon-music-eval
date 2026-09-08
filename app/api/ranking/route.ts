import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/auth";
import { parseList } from "@/lib/format";
import {
  inSameGroup,
  percentileTop,
  rankingState,
  sumAvg,
  RANKING_MIN,
} from "@/lib/ranking";

// 7. 그룹랭킹 조회 — 그룹 키 = (targetSchool, major, roundId), 5인 이상일 때만 공개.
// GET /api/ranking?roundId=xxx  (로그인한 학생 본인의 그룹 내 위치)
export async function GET(req: Request) {
  const session = await getStudentSession();
  if (!session.studentId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const roundId = new URL(req.url).searchParams.get("roundId");
  if (!roundId) {
    return NextResponse.json({ error: "roundId 가 필요합니다" }, { status: 400 });
  }

  const mine = await db.application.findFirst({
    where: { studentId: session.studentId, roundId },
    include: { round: true, scores: true },
  });
  if (!mine) {
    return NextResponse.json(
      { error: "해당 회차 신청 내역이 없습니다" },
      { status: 404 },
    );
  }

  const optedRows = await db.application.findMany({
    where: { roundId, rankingOptIn: true },
    include: { scores: true },
  });
  const members = inSameGroup(optedRows, mine);
  const scoredTotals = members
    .filter((m) => m.scores.length > 0)
    .map((m) => sumAvg(m.scores));

  const myScored = mine.scores.length > 0;
  const myTotal = sumAvg(mine.scores);
  const state = rankingState(members.length, mine.round.isOpen);

  return NextResponse.json({
    group: {
      targetSchool: mine.targetSchool,
      majors: parseList(mine.majors),
      roundNo: mine.round.roundNo,
    },
    optedIn: mine.rankingOptIn,
    roundOpen: mine.round.isOpen,
    state, // "open" | "recruiting" | "closed_shortfall"
    memberCount: members.length,
    minMembers: RANKING_MIN,
    scoredCount: scoredTotals.length,
    myScored,
    // 순위는 본인에게만, 공개 상태 + 채점 완료일 때만 노출
    percentileTop:
      state === "open" && myScored ? percentileTop(myTotal, scoredTotals) : null,
    myTotal: myScored ? myTotal : null,
  });
}
