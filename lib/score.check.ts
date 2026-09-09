// 자가검증: `npx tsx lib/score.check.ts`
import assert from "node:assert";
import { trimmedMean } from "./score";

assert.equal(trimmedMean([90, 80, 70, 60, 50]), 70, "5개 → 최고/최저 제외 [60,70,80] 평균 70");
assert.equal(trimmedMean([86, 88, 90]), 88, "3개 → 가운데 값만");
assert.equal(trimmedMean([80, 90]), 85, "2개 → 단순 평균");
assert.equal(trimmedMean([100]), 100, "1개 → 그 값");
assert.equal(trimmedMean([]), null, "없음 → null");
assert.equal(trimmedMean([null, 90, undefined, 90, 90, 90]), 90, "null/undefined 무시, 동점 처리");

console.log("score self-check OK");
