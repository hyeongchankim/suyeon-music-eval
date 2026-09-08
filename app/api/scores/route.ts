import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// 5.5 /admin/scores — 곡별 점수 입력(심사위원1~3), 평균 자동계산, PDF 리포트 URL
export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  if (!body?.applicationId || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "요청 형식 오류" }, { status: 400 });
  }
  const { applicationId, reportFileUrl } = body as {
    applicationId: string;
    reportFileUrl?: string;
  };

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return NextResponse.json({ error: "신청서를 찾을 수 없습니다" }, { status: 404 });

  const rows = (body.rows as { pieceNo: number; judge1?: number; judge2?: number; judge3?: number }[])
    .map((r) => ({
      pieceNo: Number(r.pieceNo),
      judge1: r.judge1 ?? null,
      judge2: r.judge2 ?? null,
      judge3: r.judge3 ?? null,
    }));

  await db.$transaction([
    db.score.deleteMany({ where: { applicationId } }),
    db.score.createMany({
      data: rows.map((r) => ({
        applicationId,
        pieceNo: r.pieceNo,
        judge1: r.judge1,
        judge2: r.judge2,
        judge3: r.judge3,
        average: avg([r.judge1, r.judge2, r.judge3]),
        reportFileUrl: reportFileUrl || null,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
