"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession, requireAdmin } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validators";

export async function adminLogin(_prev: unknown, formData: FormData) {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "입력값을 확인하세요" };

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  const session = await getAdminSession();
  session.adminId = admin.id;
  session.email = admin.email;
  session.role = admin.role;
  await session.save();
  redirect("/admin");
}

// 5.5 /admin/rounds — 회차 개설/마감/장소/도착공지
export async function createRound(formData: FormData) {
  await requireAdmin();
  await db.round.create({
    data: {
      term: String(formData.get("term") || "피아노 Season I"),
      roundNo: Number(formData.get("roundNo") || 1),
      date: new Date(String(formData.get("date"))),
      venue: String(formData.get("venue") || ""),
      venueAddress: String(formData.get("venueAddress") || ""),
      isOpen: true,
    },
  });
  revalidatePath("/admin/rounds");
}

export async function toggleRound(id: string, isOpen: boolean) {
  await requireAdmin();
  await db.round.update({ where: { id }, data: { isOpen } });
  revalidatePath("/admin/rounds");
}

// 신청 인원이 없는 회차만 삭제 가능
export async function deleteRound(id: string) {
  await requireAdmin();
  const count = await db.application.count({ where: { roundId: id } });
  if (count > 0) return; // UI에서 버튼을 숨기지만 방어적으로 한 번 더 확인
  await db.round.delete({ where: { id } });
  revalidatePath("/admin/rounds");
}

export async function updateNotice(id: string, formData: FormData) {
  await requireAdmin();
  await db.round.update({
    where: { id },
    data: { arrivalNotice: String(formData.get("arrivalNotice") || "") },
  });
  revalidatePath("/admin/rounds");
}

// 5.5 /admin/applications — 상태 변경(접수/확정/취소)
export async function setApplicationStatus(id: string, status: string) {
  await requireAdmin();
  await db.application.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
}

// /admin/members — 인원(참가자) 관리
export async function updateMember(id: string, formData: FormData) {
  await requireAdmin();
  await db.student.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    },
  });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function resetMemberPassword(id: string) {
  await requireAdmin();
  const temp = Math.random().toString(36).slice(2, 10); // 8자 임시 비밀번호
  await db.student.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(temp, 10), loginCount: 0 },
  });
  revalidatePath("/admin/members");
  return { ok: true, tempPassword: temp };
}

export async function deleteMember(id: string) {
  await requireAdmin();
  // SQLite onDelete 미설정 — 자식 레코드부터 순서대로 정리
  await db.$transaction([
    db.score.deleteMany({ where: { application: { studentId: id } } }),
    db.selfNote.deleteMany({ where: { application: { studentId: id } } }),
    db.mediaAsset.deleteMany({ where: { application: { studentId: id } } }),
    db.application.deleteMany({ where: { studentId: id } }),
    db.student.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/members");
  return { ok: true };
}
