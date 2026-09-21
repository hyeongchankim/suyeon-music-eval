/**
 * 회차별 신청자 더미 데이터 — 기존 데이터는 건드리지 않고 "추가"만 한다 (여러 번 실행해도 중복 없음).
 *   npm run db:seed:dummy
 * 학생 ID: r{회차번호}s{01~20} (예: r2s07), 비밀번호: test1234
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PER_ROUND = 20;
const ALL_MAJORS = ["피아노", "성악", "현악", "관악", "작곡"];
const SCHOOLS = [
  "서울대학교",
  "한국예술종합학교",
  "연세대학교",
  "이화여자대학교",
  "한양대학교",
  "중앙대학교",
];
const SURNAMES = "김이박최정강조윤장임한오서신권황안송류홍".split("");
const GIVEN = [
  "민준", "서연", "지호", "하윤", "도윤", "서윤", "시우", "지유", "예준", "채원",
  "주원", "다은", "지안", "수아", "현우", "유진", "건우", "소율", "은우", "하린",
];
const PIECES: Record<string, string[]> = {
  피아노: [
    "Chopin Etude Op.10 No.3", "Beethoven Sonata No.8 'Pathétique'", "Liszt La Campanella",
    "Bach WTC I Prelude & Fugue in C", "Mozart Sonata K.332", "Schubert Impromptu Op.90 No.3",
    "Rachmaninoff Prelude Op.3 No.2", "Debussy Clair de Lune",
  ],
  성악: [
    "Caro mio ben", "Amarilli mia bella", "Ave Maria (Schubert)", "O mio babbino caro",
    "Una voce poco fa", "Voi che sapete", "Nel cor più non mi sento", "Dein ist mein ganzes Herz",
  ],
  현악: [
    "Bach Partita No.2 Allemande", "Mendelssohn Violin Concerto 1악장", "Kreisler Praeludium and Allegro",
    "Bruch Violin Concerto 1악장", "Bach Cello Suite No.3 Prelude", "Saint-Saëns Cello Concerto 1악장",
    "Vivaldi Concerto in A minor", "Paganini Caprice No.24",
  ],
  관악: [
    "Mozart Clarinet Concerto 1악장", "Weber Clarinet Concertino", "Mozart Flute Concerto No.1",
    "Debussy Syrinx", "Saint-Saëns Oboe Sonata", "Telemann Fantasia No.1",
    "Weber Bassoon Concerto", "Poulenc Flute Sonata",
  ],
  작곡: [
    "자작곡 - 피아노 소품", "자작곡 - 현악 4중주 1악장", "자작곡 - 가곡",
    "자작곡 - 실내악 앙상블", "자작곡 - 독주곡",
  ],
};

/** 시드 고정 난수 (재실행해도 같은 결과) */
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

function parseMajors(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) && v.length > 0 ? v.map(String) : ALL_MAJORS;
  } catch {
    return ALL_MAJORS;
  }
}

async function main() {
  const rounds = await db.round.findMany({ orderBy: { date: "asc" } });
  const passwordHash = await bcrypt.hash("test1234", 10);

  const students: {
    loginId: string; name: string; phone: string; email: string; passwordHash: string;
  }[] = [];
  const plans: { loginId: string; roundId: string; data: Record<string, unknown> }[] = [];

  rounds.forEach((round, ri) => {
    const rand = rng(1000 + round.roundNo * 17 + ri);
    const majors = parseMajors(round.majors);

    for (let n = 1; n <= PER_ROUND; n++) {
      const g = ri * PER_ROUND + (n - 1); // 전체 100명 안에서 이름이 겹치지 않게
      const loginId = `r${round.roundNo}s${String(n).padStart(2, "0")}`;
      // 전공은 첫 전공(피아노)을 조금 더 많이, 학교는 앞쪽 학교에 몰리게 → 같은 조가 여러 명 생김
      const major = majors[Math.floor(Math.pow(rand(), 1.4) * majors.length)];
      const school = SCHOOLS[Math.floor(Math.pow(rand(), 1.8) * SCHOOLS.length)];
      const pool = PIECES[major] ?? PIECES["피아노"];
      const pieceCount = 1 + Math.floor(rand() * 3);
      const pieces = Array.from({ length: pieceCount }, (_, k) => pool[(Math.floor(rand() * pool.length) + k) % pool.length]);

      const paid = rand() < 0.7;
      const cancelled = rand() < 0.05;

      students.push({
        loginId,
        name: SURNAMES[g % 20] + GIVEN[(g * 7 + Math.floor(g / 20)) % 20],
        phone: `010-${3000 + ri}-${1000 + n}`,
        email: `${loginId}@suyeon.test`,
        passwordHash,
      });
      plans.push({
        loginId,
        roundId: round.id,
        data: {
          majors: JSON.stringify([major]),
          advisorName: rand() < 0.5 ? `${SURNAMES[Math.floor(rand() * 20)]}교수` : null,
          targetSchool: school,
          pieceCount,
          pieces: JSON.stringify(pieces),
          wantsScale: rand() < 0.3,
          wantsBlind: rand() < 0.2,
          wantsScoreReview: rand() < 0.4,
          agreedNotice: true,
          paid,
          status: cancelled ? "취소" : paid ? "확정" : "접수",
        },
      });
    }
  });

  // 1) 학생 (이미 있으면 건너뜀)
  await db.student.createMany({ data: students, skipDuplicates: true });
  const found = await db.student.findMany({
    where: { loginId: { in: students.map((s) => s.loginId) } },
    select: { id: true, loginId: true },
  });
  const idOf: Record<string, string> = {};
  found.forEach((s) => (idOf[s.loginId] = s.id));

  // 2) 신청서 (같은 학생·회차에 이미 있으면 건너뜀)
  const existing = await db.application.findMany({
    where: { studentId: { in: found.map((s) => s.id) } },
    select: { studentId: true, roundId: true },
  });
  const has: Record<string, boolean> = {};
  existing.forEach((a) => (has[`${a.studentId}|${a.roundId}`] = true));

  const toCreate = plans
    .filter((p) => !has[`${idOf[p.loginId]}|${p.roundId}`])
    .map((p) => ({ studentId: idOf[p.loginId], roundId: p.roundId, ...p.data }));
  if (toCreate.length > 0) await db.application.createMany({ data: toCreate as never });

  // 요약
  console.log(`신청서 ${toCreate.length}건 추가 (이미 있던 ${plans.length - toCreate.length}건은 건너뜀)`);
  for (const r of rounds) {
    const apps = await db.application.findMany({
      where: { roundId: r.id, student: { loginId: { startsWith: `r${r.roundNo}s` } } },
      select: { paid: true, status: true },
    });
    const eligible = apps.filter((a) => a.paid && a.status !== "취소").length;
    console.log(
      `${r.roundNo}차  더미 ${apps.length}명 · 입금확인 ${apps.filter((a) => a.paid).length} · 취소 ${apps.filter((a) => a.status === "취소").length} · 시간표 대상 ${eligible}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
