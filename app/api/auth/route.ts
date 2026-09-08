import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { getStudentSession } from "@/lib/auth";

// 5.3 로그인 — ID + 비밀번호
export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값을 확인하세요" }, { status: 400 });
  }
  const { loginId, password } = parsed.data;

  const student = await db.student.findUnique({ where: { loginId } });
  const fail = () =>
    NextResponse.json({ error: "ID 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
  if (!student || !student.passwordHash) return fail();

  const ok = await bcrypt.compare(password, student.passwordHash);
  if (!ok) return fail();

  await db.student.update({
    where: { id: student.id },
    data: { loginCount: { increment: 1 } },
  });

  const session = await getStudentSession();
  session.studentId = student.id;
  session.loginId = student.loginId;
  session.name = student.name;
  await session.save();

  return NextResponse.json({ ok: true });
}
