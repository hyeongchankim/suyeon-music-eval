"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

// 5.3 / 5.4 — 비밀번호 설정
export async function setPassword(formData: FormData) {
  const session = await requireStudent();
  const pw = String(formData.get("password") ?? "");
  if (pw.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다" };
  await db.student.update({
    where: { id: session.studentId! },
    data: { passwordHash: await bcrypt.hash(pw, 10) },
  });
  revalidatePath("/my");
  return { ok: true };
}
