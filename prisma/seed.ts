import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // 관리자 (5.5)
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
    update: { majors: JSON.stringify(["피아노", "성악"]) },
    create: {
      id: "seed-round-open",
      term: "피아노 Season I",
      roundNo: 1,
      date: new Date("2026-09-13T10:00:00+09:00"),
      venue: "수연음악학원 대강당",
      venueAddress: "서울시 서초구 반포대로 00, 3층",
      majors: JSON.stringify(["피아노", "성악"]),
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

  // 데모 학생 + 신청 + 점수 (마이페이지/리포트 확인용)
  const student = await db.student.upsert({
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

  const existing = await db.application.findFirst({
    where: { studentId: student.id, roundId: open.id },
  });
  if (!existing) {
    const app = await db.application.create({
      data: {
        studentId: student.id,
        roundId: open.id,
        majors: JSON.stringify(["피아노"]),
        targetSchool: "서울대학교",
        pieceCount: 2,
        pieces: JSON.stringify(["Chopin Etude Op.10 No.4", "Beethoven Sonata Op.57"]),
        advisorName: "이지도",
        status: "확정",
      },
    });
    await db.score.createMany({
      data: [
        { applicationId: app.id, pieceNo: 1, judge1: 88, judge2: 90, judge3: 86, average: 88 },
        { applicationId: app.id, pieceNo: 2, judge1: 91, judge2: 89, judge3: 92, average: 90.67 },
      ],
    });
    const in15days = new Date(Date.now() + 15 * 86_400_000);
    await db.mediaAsset.createMany({
      data: [
        {
          applicationId: app.id,
          type: "feedback",
          url: "https://example.com/feedback/demo01.mp4",
          downloadable: false,
          expiresAt: in15days,
        },
        {
          applicationId: app.id,
          type: "performance",
          url: "https://example.com/performance/demo01.mp4",
          downloadable: true,
        },
      ],
    });
  }

  console.log("seed 완료: 관리자 admin / admin, 학생 demo01 / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
