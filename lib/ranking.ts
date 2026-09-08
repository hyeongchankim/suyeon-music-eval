// 7. 그룹랭킹 집계 — 그룹 키 = (targetSchool, major, roundId), 5인 이상일 때만 공개
import { parseList } from "./format";

export const RANKING_MIN = 5;

/** 곡별 평균 점수의 합 (null 은 0 취급) = 총점 */
export function sumAvg(scores: { average: number | null }[]): number {
  return scores.reduce((s, x) => s + (x.average ?? 0), 0);
}

/**
 * 같은 그룹(동일 지망학교 + 전공 최소 1개 겹침) 지원자만 추린다.
 * roundId 필터는 호출 측 쿼리에서 이미 적용된 것으로 본다.
 */
export function inSameGroup<T extends { majors: string; targetSchool: string }>(
  rows: T[],
  ref: { majors: string; targetSchool: string },
): T[] {
  const refMajors = parseList(ref.majors);
  return rows.filter(
    (a) =>
      a.targetSchool === ref.targetSchool &&
      parseList(a.majors).some((m) => refMajors.includes(m)),
  );
}

/** 내 총점이 그룹 내 상위 몇 %인지 (1 = 최상위권, 100 = 최하위). 동점은 동일 취급. */
export function percentileTop(myTotal: number, groupTotals: number[]): number {
  if (groupTotals.length === 0) return 0;
  const better = groupTotals.filter((s) => s > myTotal).length;
  return Math.max(1, Math.round((better / groupTotals.length) * 100));
}

/** 5인 미만 마감 사유: 회차가 닫혔으면 "인원미달 마감", 아니면 "모집중" */
export function rankingState(memberCount: number, roundOpen: boolean) {
  if (memberCount >= RANKING_MIN) return "open" as const;
  return roundOpen ? ("recruiting" as const) : ("closed_shortfall" as const);
}
