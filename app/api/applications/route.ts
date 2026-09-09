import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validators";

// 5.2 Step3 — 참가자ID 중복확인
export async function GET(req: Request) {
  const loginId = new URL(req.url).searchParams.get("loginId")?.trim() ?? "";
  if (!/^[a-zA-Z0-9]{4,}$/.test(loginId)) {
    return NextResponse.json({ available: false, reason: "형식 오류" });
  }
  const existing = await db.student.findUnique({ where: { loginId } });
  return NextResponse.json({ available: !existing });
}

// 5.2 제출 로직 — Student(신규 생성 / 기존 ID 매칭) + Application 생성
export async function POST(req: Request) {
  const parsed = applicationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값을 확인하세요", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const rounds = await db.round.findMany({ where: { id: { in: d.roundIds } } });
  if (rounds.length !== d.roundIds.length || rounds.some((r) => !r.isOpen)) {
    return NextResponse.json(
      { error: "신청할 수 없는 회차가 포함되어 있습니다" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(d.password, 10);
  let student = await db.student.findUnique({ where: { loginId: d.loginId } });
  if (!student) {
    student = await db.student.create({
      data: {
        loginId: d.loginId,
        name: d.name,
        phone: d.phone,
        email: d.email,
        passwordHash,
      },
    });
  } else if (!student.passwordHash) {
    // 비밀번호가 아직 없는 기존 학생이면 이번 입력값으로 설정 (재신청 시)
    await db.student.update({
      where: { id: student.id },
      data: { passwordHash },
    });
  }

  const common = {
    studentId: student.id,
    majors: JSON.stringify(d.majors),
    advisorName: d.advisorName || null,
    targetSchool: d.targetSchool,
    pieceCount: d.pieceCount,
    pieces: JSON.stringify(d.pieces.slice(0, d.pieceCount)),
    wantsScale: d.wantsScale,
    wantsBlind: d.wantsBlind,
    wantsScoreReview: d.wantsScoreReview,
    preferredTime: d.preferredTime || null,
    questionForJudge: d.questionForJudge || null,
    agreedNotice: d.agreedNotice,
  };

  // 선택한 회차마다 신청서 1건씩 생성
  const created = await db.$transaction(
    rounds.map((r) =>
      db.application.create({ data: { ...common, roundId: r.id } }),
    ),
  );

  return NextResponse.json({ id: created[0].id, count: created.length });
}
