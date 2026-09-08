import { NextResponse } from "next/server";

// 7. 그룹랭킹/음원공유 집계 로직 — Phase 2 범위. (그룹 키 = targetSchool × major × roundId, 5인 이상 공개)
export function GET() {
  return NextResponse.json({ error: "그룹랭킹은 Phase 2에서 제공됩니다" }, { status: 501 });
}
