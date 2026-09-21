// 자가검증: `npx tsx lib/timetable.check.ts`
import assert from "node:assert";
import {
  parseHM,
  fmtHM,
  kstHM,
  effectiveMajorOrder,
  primaryMajor,
  sortForTimetable,
  buildSchedule,
  perSlot,
  timetableMessage,
} from "./timetable";

// 시각 변환
assert.equal(parseHM("10:00"), 600);
assert.equal(parseHM("9:05"), 545);
assert.equal(parseHM("25:00"), null, "24시 이상 불가");
assert.equal(parseHM("abc"), null);
assert.equal(fmtHM(600), "10:00");
assert.equal(fmtHM(540), "9:00", "시는 0 패딩 없이 9:00");
assert.equal(fmtHM(540 - 30), "8:30");
assert.equal(fmtHM(-30), "23:30", "자정 이전은 순환");
assert.equal(kstHM(new Date("2026-10-11T01:00:00Z")), "10:00", "UTC 01:00 = KST 10:00");

// 전공 순서
assert.deepEqual(effectiveMajorOrder(["성악", "피아노"], ["피아노", "성악", "현악"]), ["성악", "피아노", "현악"]);
assert.deepEqual(effectiveMajorOrder(["작곡", "성악"], ["피아노", "성악"]), ["성악", "피아노"], "없는 전공은 제외");
assert.equal(primaryMajor('["피아노","성악"]', ["성악", "피아노"]), "성악", "복수 전공은 먼저 하는 전공 기준");

// 정렬: 전공 순서(성악 먼저) → 학교 → 신청순
const d = (n: number) => new Date(2026, 0, n);
const apps = [
  { id: "a", majors: '["피아노"]', targetSchool: "서울대", createdAt: d(1) },
  { id: "b", majors: '["성악"]', targetSchool: "연세대", createdAt: d(2) },
  { id: "c", majors: '["성악"]', targetSchool: "서울대", createdAt: d(3) },
  { id: "d", majors: '["피아노"]', targetSchool: "서울대", createdAt: d(0) },
];
assert.deepEqual(
  sortForTimetable(apps, ["성악", "피아노"]).map((x) => x.id),
  ["c", "b", "d", "a"],
  "성악(서울대,연세대) → 피아노(신청 빠른 순)",
);

// 30분 단위 조: 시간당 10명 → 조당 5명
assert.equal(perSlot(10), 5);
assert.equal(perSlot(1), 1, "최소 1명");
const same = Array.from({ length: 12 }, (_, i) => ({ id: String(i), majors: '["피아노"]', targetSchool: "서울대" }));
const s = buildSchedule(same, 540, 10, ["피아노"]); // 시작 9:00
// 같은 (전공,학교)라도 5명을 채우면 다음 조
assert.deepEqual(s.map((x) => x.group), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3]);
// 같은 조는 모두 같은 시각(학생별 분 단위 없음), 조마다 +30분
assert.deepEqual(Array.from(new Set(s.map((x) => x.start))), ["9:00", "9:30", "10:00"]);
assert.equal(s[0].start, s[4].start, "1조 5명 모두 9:00");
assert.equal(s[5].start, "9:30", "2조 9:30");
assert.equal(s[0].arrive, "8:30", "연주 30분 전 도착");
assert.equal(s[0].end, "9:30");

// 조: 학교/전공이 바뀌면 새 조
const mixed = buildSchedule(
  [
    { majors: '["성악"]', targetSchool: "서울대" },
    { majors: '["성악"]', targetSchool: "서울대" },
    { majors: '["성악"]', targetSchool: "연세대" },
    { majors: '["피아노"]', targetSchool: "연세대" },
  ],
  540,
  10,
  ["성악", "피아노"],
);
assert.deepEqual(mixed.map((x) => x.group), [1, 1, 2, 3]);
assert.deepEqual(mixed.map((x) => x.start), ["9:00", "9:00", "9:30", "10:00"], "인원이 적어도 조마다 30분");

// 시간당 인원이 6이면 조당 3명
assert.deepEqual(buildSchedule(same, 540, 6, ["피아노"]).slice(0, 4).map((x) => x.group), [1, 1, 1, 2]);

// 안내 문구에 조/시간과 30분 전 도착·연습 안내 포함
const msg = timetableMessage({
  name: "김하늘", date: "10.11(일)", roundNo: 2, group: 2, start: "9:30", arrive: "9:00", venue: "대강당", address: "서울",
});
assert.ok(msg.includes("연주 시간: 2조 9:30"));
assert.ok(msg.includes("연주 시간 30분 전(9:00)까지 도착하셔서 연습을 진행해 주세요"));

console.log("timetable self-check OK");
