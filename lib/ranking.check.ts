// 자가검증: `npx tsx lib/ranking.check.ts`
import assert from "node:assert";
import { percentileTop, rankingState } from "./ranking";

assert.equal(percentileTop(90, [100, 80, 70, 60, 50]), 20, "1명이 더 높음 → 상위 20%");
assert.equal(percentileTop(100, [100, 80]), 1, "최상위는 상위 1%로 표기");
assert.equal(percentileTop(50, []), 0, "빈 그룹 → 0");
assert.equal(rankingState(5, false), "open", "5명이면 공개");
assert.equal(rankingState(3, true), "recruiting", "3명 + 열림 → 모집중");
assert.equal(rankingState(3, false), "closed_shortfall", "3명 + 마감 → 인원미달");

console.log("ranking self-check OK");
