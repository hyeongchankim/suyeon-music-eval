/**
 * 학생 계정 중 재학중 학교/학년/집주소가 비어있는 것만 더미로 채운다.
 * 이미 값이 있는 필드는 절대 건드리지 않음 (관리자가 직접 입력한 값 보존).
 *   npm run db:backfill-info
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3", "N수생"] as const;
const MIDDLE_SCHOOLS = [
  "예원학교", "선화예술중학교", "계원예술중학교",
  "강남중학교", "서초중학교", "목동중학교", "분당중학교", "한서중학교",
];
const HIGH_SCHOOLS = [
  "서울예술고등학교", "선화예술고등학교", "계원예술고등학교", "덕원예술고등학교",
  "강남고등학교", "서초고등학교", "한영고등학교", "분당고등학교",
  "인천예술고등학교", "부산예술고등학교",
];
const DISTRICTS = [
  "강남구", "서초구", "송파구", "마포구", "영등포구",
  "성동구", "노원구", "은평구", "동작구", "관악구",
];
const ROADS = [
  "테헤란로", "반포대로", "월드컵로", "여의대로", "성수일로",
  "동일로", "신림로", "사당로", "방배로", "양재천로",
];

/** 학생 loginId 기반 고정 시드 — 여러 번 실행해도 같은 값이 나옴 */
function hashSeed(s: string): number {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h || 1;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rand: () => number, arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

async function main() {
  const students = await db.student.findMany({
    where: { OR: [{ currentSchool: null }, { grade: null }, { homeAddress: null }] },
  });
  console.log(`대상 ${students.length}명`);

  let updated = 0;
  for (const s of students) {
    const rand = rng(hashSeed(s.loginId));
    const grade = s.grade ?? pick(rand, GRADES);
    const schoolPool = grade === "N수생" || grade.startsWith("고") ? HIGH_SCHOOLS : MIDDLE_SCHOOLS;

    const data: Record<string, string> = {};
    if (s.grade === null) data.grade = grade;
    if (s.currentSchool === null) data.currentSchool = pick(rand, schoolPool);
    if (s.homeAddress === null) {
      data.homeAddress = `서울시 ${pick(rand, DISTRICTS)} ${pick(rand, ROADS)} ${1 + Math.floor(rand() * 300)}`;
    }
    if (Object.keys(data).length > 0) {
      await db.student.update({ where: { id: s.id }, data });
      updated++;
    }
  }
  console.log(`${updated}명 갱신 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
