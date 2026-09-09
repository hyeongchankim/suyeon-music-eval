import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { trimmedMean } from "../lib/score";

const db = new PrismaClient();

const MAJORS = ["피아노", "성악", "현악", "관악", "작곡"];

async function setScores(
  applicationId: string,
  pieceScores: number[][],
  reportUrl?: string,
) {
  await db.score.deleteMany({ where: { applicationId } });
  await db.score.createMany({
    data: pieceScores.map((judges, i) => ({
      applicationId,
      pieceNo: i + 1,
      judge1: judges[0] ?? null,
      judge2: judges[1] ?? null,
      judge3: judges[2] ?? null,
      judge4: judges[3] ?? null,
      judge5: judges[4] ?? null,
      average: trimmedMean(judges),
      reportFileUrl: reportUrl ?? null,
    })),
  });
}

async function ensureApplication(
  studentId: string,
  roundId: string,
  data: Record<string, unknown>,
) {
  const found = await db.application.findFirst({ where: { studentId, roundId } });
  if (found) return found;
  return db.application.create({
    data: { studentId, roundId, ...data } as never,
  });
}

async function main() {
  // 관리자
  await db.adminUser.upsert({
    where: { username: "admin" },
    update: { passwordHash: await bcrypt.hash("admin", 10) },
    create: {
      username: "admin",
      passwordHash: await bcrypt.hash("admin", 10),
      role: "staff",
    },
  });

  // 회차 (열린 회차 1 + 지난 회차 1)
  const open = await db.round.upsert({
    where: { id: "seed-round-open" },
    update: { majors: JSON.stringify(MAJORS) },
    create: {
      id: "seed-round-open",
      term: "피아노 Season I",
      roundNo: 1,
      date: new Date("2026-09-13T10:00:00+09:00"),
      venue: "수연음악학원 대강당",
      venueAddress: "서울시 서초구 반포대로 00, 3층",
      majors: JSON.stringify(MAJORS),
      isOpen: true,
      arrivalNotice:
        "입실시간: 오전 9:30 / 주차: 건물 지하 1~2층 (2시간 무료) / 문의: 카카오채널 @수연음악학원",
    },
  });

  await db.round.upsert({
    where: { id: "seed-round-past" },
    update: { majors: JSON.stringify(["피아노"]) },
    create: {
      id: "seed-round-past",
      term: "피아노 Season I",
      roundNo: 0,
      date: new Date("2026-07-20T10:00:00+09:00"),
      venue: "수연음악학원 대강당",
      venueAddress: "서울시 서초구 반포대로 00, 3층",
      majors: JSON.stringify(["피아노"]),
      isOpen: false,
      arrivalNotice: "종료된 회차입니다.",
    },
  });

  // 추가 회차 2~4 (예정, 열림) — 회차별 응시 전공 다양화
  const moreRounds: {
    id: string;
    roundNo: number;
    date: string;
    majors: string[];
  }[] = [
    { id: "seed-round-2", roundNo: 2, date: "2026-10-11T10:00:00+09:00", majors: ["피아노", "성악", "현악"] },
    { id: "seed-round-3", roundNo: 3, date: "2026-11-08T10:00:00+09:00", majors: ["피아노", "관악", "작곡"] },
    { id: "seed-round-4", roundNo: 4, date: "2026-12-06T10:00:00+09:00", majors: MAJORS },
  ];
  for (const r of moreRounds) {
    await db.round.upsert({
      where: { id: r.id },
      update: { majors: JSON.stringify(r.majors) },
      create: {
        id: r.id,
        term: "피아노 Season I",
        roundNo: r.roundNo,
        date: new Date(r.date),
        venue: "수연음악학원 대강당",
        venueAddress: "서울시 서초구 반포대로 00, 3층",
        majors: JSON.stringify(r.majors),
        isOpen: true,
        arrivalNotice: "입실시간: 오전 9:30 / 주차: 건물 지하 1~2층 (2시간 무료)",
      },
    });
  }

  // 데모 학생 (마이페이지/리포트 확인용)
  const demo = await db.student.upsert({
    where: { loginId: "demo01" },
    update: { passwordHash: await bcrypt.hash("demo1234", 10) },
    create: {
      loginId: "demo01",
      name: "김수연",
      phone: "010-1234-5678",
      email: "demo@suyeon.test",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });
  const demoApp = await ensureApplication(demo.id, open.id, {
    majors: JSON.stringify(["피아노"]),
    targetSchool: "서울대학교",
    pieceCount: 2,
    pieces: JSON.stringify(["Chopin Etude Op.10 No.4", "Beethoven Sonata Op.57"]),
    advisorName: "이지도",
    status: "확정",
  });
  await db.application.update({ where: { id: demoApp.id }, data: { paid: true } });
  await setScores(demoApp.id, [
    [88, 90, 86, 92, 84],
    [91, 89, 92, 87, 90],
  ]);
  const in15days = new Date(Date.now() + 15 * 86_400_000);
  if ((await db.mediaAsset.count({ where: { applicationId: demoApp.id } })) === 0) {
    await db.mediaAsset.createMany({
      data: [
        {
          applicationId: demoApp.id,
          type: "feedback",
          url: "https://example.com/feedback/demo01.mp4",
          downloadable: false,
          expiresAt: in15days,
        },
        {
          applicationId: demoApp.id,
          type: "performance",
          url: "https://example.com/performance/demo01.mp4",
          downloadable: true,
        },
      ],
    });
  }

  // 전공별 더미 학생 1명씩 + 신청 + 점수
  const DUMMIES = [
    {
      major: "피아노",
      loginId: "piano01",
      name: "김하늘",
      school: "서울대학교",
      pieces: ["Chopin Ballade No.1", "Liszt Consolation No.3"],
      scores: [
        [92, 88, 95, 90, 87],
        [89, 91, 86, 93, 90],
      ],
    },
    {
      major: "성악",
      loginId: "vocal01",
      name: "이서준",
      school: "한국예술종합학교",
      pieces: ["Caro mio ben", "Nessun dorma"],
      scores: [
        [85, 90, 88, 82, 91],
        [87, 84, 89, 90, 86],
      ],
    },
    {
      major: "현악",
      loginId: "string01",
      name: "박지우",
      school: "연세대학교",
      pieces: ["Bach Cello Suite No.1 Prelude", "Elgar Cello Concerto 1악장"],
      scores: [
        [94, 91, 96, 89, 93],
        [90, 92, 88, 95, 91],
      ],
    },
    {
      major: "관악",
      loginId: "wind01",
      name: "최도윤",
      school: "한양대학교",
      pieces: ["Mozart Clarinet Concerto 1악장", "Debussy Première Rhapsodie"],
      scores: [
        [80, 85, 78, 88, 83],
        [82, 79, 86, 84, 81],
      ],
    },
    {
      major: "작곡",
      loginId: "compose01",
      name: "정하은",
      school: "서울대학교",
      pieces: ["Piano Trio 'Fragments'", "String Quartet No.1"],
      scores: [
        [88, 92, 85, 90, 89],
        [91, 87, 93, 86, 90],
      ],
    },
  ];

  for (let i = 0; i < DUMMIES.length; i++) {
    const d = DUMMIES[i];
    const s = await db.student.upsert({
      where: { loginId: d.loginId },
      update: { passwordHash: await bcrypt.hash("test1234", 10) },
      create: {
        loginId: d.loginId,
        name: d.name,
        phone: `010-2025-${1000 + i}`,
        email: `${d.loginId}@suyeon.test`,
        passwordHash: await bcrypt.hash("test1234", 10),
      },
    });
    const app = await ensureApplication(s.id, open.id, {
      majors: JSON.stringify([d.major]),
      targetSchool: d.school,
      pieceCount: d.pieces.length,
      pieces: JSON.stringify(d.pieces),
      status: "확정",
    });
    // 더미 절반만 입금 확인된 상태로
    await db.application.update({
      where: { id: app.id },
      data: { paid: i % 2 === 0 },
    });
    await setScores(app.id, d.scores);
  }

  console.log(
    "seed 완료: 관리자 admin/admin · 학생 demo01/demo1234 · 전공별 더미 piano01·vocal01·string01·wind01·compose01 (비번 test1234)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
