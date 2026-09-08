// 자가검증: `npx tsx lib/ranking.check.ts`
import assert from "node:assert";
import { percentileTop, rankingState, sumAvg, inSameGroup } from "./ranking";

assert.equal(percentileTop(90, [100, 80, 70, 60, 50]), 20, "1명이 더 높음 → 상위 20%");
assert.equal(percentileTop(100, [100, 80]), 1, "최상위는 상위 1%로 표기");
assert.equal(percentileTop(50, []), 0, "빈 그룹 → 0");
assert.equal(rankingState(5, false), "open", "5명이면 공개");
assert.equal(rankingState(3, true), "recruiting", "3명 + 열림 → 모집중");
assert.equal(rankingState(3, false), "closed_shortfall", "3명 + 마감 → 인원미달");

assert.equal(sumAvg([{ average: 90 }, { average: 80.5 }, { average: null }]), 170.5, "null 은 0 취급");

const group = inSameGroup(
  [
    { majors: '["피아노"]', targetSchool: "서울대" }, // 겹침
    { majors: '["작곡"]', targetSchool: "서울대" }, // 전공 불일치
    { majors: '["피아노"]', targetSchool: "연세대" }, // 학교 불일치
  ],
  { majors: '["피아노","성악"]', targetSchool: "서울대" },
);
assert.equal(group.length, 1, "같은 학교 + 전공 1개 이상 겹치는 지원자만");

console.log("ranking self-check OK");
