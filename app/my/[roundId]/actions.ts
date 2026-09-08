"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";

async function ownApplication(applicationId: string) {
  const session = await requireStudent();
  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app || app.studentId !== session.studentId) return null;
  return app;
}

// 5.4 탭03 그룹랭킹 — 참여 신청/취소
export async function toggleRankingOptIn(applicationId: string, optIn: boolean) {
  const app = await ownApplication(applicationId);
  if (!app) return { error: "권한이 없습니다" };
  await db.application.update({ where: { id: applicationId }, data: { rankingOptIn: optIn } });
  revalidatePath(`/my/${app.roundId}`);
  return { ok: true };
}

// 5.4 탭05 음원공유 — 참여 신청/취소
export async function toggleAudioOptIn(applicationId: string, optIn: boolean) {
  const app = await ownApplication(applicationId);
  if (!app) return { error: "권한이 없습니다" };
  await db.application.update({ where: { id: applicationId }, data: { audioOptIn: optIn } });
  revalidatePath(`/my/${app.roundId}`);
  return { ok: true };
}
