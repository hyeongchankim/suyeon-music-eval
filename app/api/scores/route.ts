import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { trimmedMean } from "@/lib/score";

type RowIn = {
  pieceNo: number;
  judge1?: number;
  judge2?: number;
  judge3?: number;
  judge4?: number;
  judge5?: number;
};

// 5.5 /admin/scores — 곡별 점수 입력(심사위원 1~5), 최고·최저 제외 평균 자동계산, PDF 리포트 URL
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

  const rows = (body.rows as RowIn[]).map((r) => {
    const judges = [r.judge1, r.judge2, r.judge3, r.judge4, r.judge5].map((x) =>
      typeof x === "number" ? x : null,
    );
    return {
      pieceNo: Number(r.pieceNo),
      judge1: judges[0],
      judge2: judges[1],
      judge3: judges[2],
      judge4: judges[3],
      judge5: judges[4],
      average: trimmedMean(judges),
      reportFileUrl: reportFileUrl || null,
    };
  });

  await db.$transaction([
    db.score.deleteMany({ where: { applicationId } }),
    db.score.createMany({ data: rows.map((r) => ({ applicationId, ...r })) }),
  ]);

  return NextResponse.json({ ok: true });
}
