"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseList } from "@/lib/format";
import { MAJORS } from "@/lib/validators";
import {
  parseHM,
  kstHM,
  majorUniverse,
  effectiveMajorOrder,
  sortForTimetable,
} from "@/lib/timetable";

const PATH = "/admin/timetable";

/** 시간표 대상 = 입금 확인 완료 + 취소 아님 */
const ELIGIBLE = { paid: true, status: { not: "취소" } } as const;

async function load(roundId: string) {
  const round = await db.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("회차를 찾을 수 없습니다");
  const apps = await db.application.findMany({
    where: { roundId, ...ELIGIBLE },
    orderBy: { createdAt: "asc" },
  });
  const universe = majorUniverse(parseList(round.majors), apps, MAJORS);
  const order = effectiveMajorOrder(parseList(round.ttMajorOrder), universe);
  return { round, apps, order };
}

// 시작 시간 · 시간당 인원
export async function saveTimetableSettings(roundId: string, formData: FormData) {
  await requireAdmin();
  const startTime = String(formData.get("startTime") ?? "");
  if (parseHM(startTime) === null) return;
  const perHour = Math.min(60, Math.max(1, Math.floor(Number(formData.get("perHour"))) || 10));
  await db.round.update({ where: { id: roundId }, data: { ttStartTime: startTime, ttPerHour: perHour } });
  revalidatePath(PATH);
}

// 전공 진행 순서 변경 (반영하려면 시간표를 다시 생성)
export async function moveMajor(roundId: string, major: string, dir: "up" | "down") {
  await requireAdmin();
  const { order } = await load(roundId);
  const i = order.indexOf(major);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  await db.round.update({ where: { id: roundId }, data: { ttMajorOrder: JSON.stringify(order) } });
  revalidatePath(PATH);
}

// 시간표 (재)생성 — 전공 순서 → 지망학교 → 신청순으로 배치
export async function generateTimetable(roundId: string) {
  await requireAdmin();
  const { round, apps, order } = await load(roundId);
  const sorted = sortForTimetable(apps, order);
  await db.$transaction([
    db.application.updateMany({ where: { roundId }, data: { ttOrder: null } }),
    ...sorted.map((a, i) => db.application.update({ where: { id: a.id }, data: { ttOrder: i } })),
    db.round.update({
      where: { id: roundId },
      data: {
        ttMajorOrder: JSON.stringify(order),
        ttStartTime: round.ttStartTime ?? kstHM(round.date),
      },
    }),
  ]);
  revalidatePath(PATH);
}

// 시간표 안에서 한 칸 위/아래로 이동 (이웃과 순서 교환)
export async function moveSlot(appId: string, dir: "up" | "down") {
  await requireAdmin();
  const app = await db.application.findUnique({ where: { id: appId } });
  if (!app || app.ttOrder === null) return;
  const list = await db.application.findMany({
    where: { roundId: app.roundId, ...ELIGIBLE, ttOrder: { not: null } },
    orderBy: { ttOrder: "asc" },
    select: { id: true, ttOrder: true },
  });
  const i = list.findIndex((x) => x.id === appId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  await db.$transaction([
    db.application.update({ where: { id: list[i].id }, data: { ttOrder: list[j].ttOrder! } }),
    db.application.update({ where: { id: list[j].id }, data: { ttOrder: list[i].ttOrder! } }),
  ]);
  revalidatePath(PATH);
}

// 생성 이후 입금 확인된 신청자를 맨 뒤에 추가
export async function addToTimetable(appId: string) {
  await requireAdmin();
  const app = await db.application.findUnique({ where: { id: appId } });
  if (!app) return;
  const last = await db.application.aggregate({
    where: { roundId: app.roundId, ttOrder: { not: null } },
    _max: { ttOrder: true },
  });
  await db.application.update({
    where: { id: appId },
    data: { ttOrder: (last._max.ttOrder ?? -1) + 1 },
  });
  revalidatePath(PATH);
}

// 시간표 전송 — 참가자 마이페이지에 개인별 연주 시간 + 안내 문구 공개
export async function sendTimetable(roundId: string) {
  await requireAdmin();
  const round = await db.round.findUnique({ where: { id: roundId } });
  const placed = await db.application.count({
    where: { roundId, ...ELIGIBLE, ttOrder: { not: null } },
  });
  if (!round?.ttStartTime || placed === 0) return;
  await db.round.update({ where: { id: roundId }, data: { ttSentAt: new Date() } });
  revalidatePath(PATH);
  revalidatePath("/my");
}
