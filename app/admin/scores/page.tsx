import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import ScoreForm from "@/components/admin/ScoreForm";

export const dynamic = "force-dynamic";

export default async function AdminScoresPage({
  searchParams,
}: {
  searchParams: { app?: string };
}) {
  await requireAdmin();

  if (!searchParams.app) {
    const apps = await db.application.findMany({
      orderBy: { createdAt: "desc" },
      include: { student: true, round: true, scores: true },
    });
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">점수 입력</h1>
        <p className="text-sm text-ink/60">점수를 입력할 신청서를 선택하세요.</p>
        <div className="card divide-y divide-line">
          {apps.map((a) => (
            <Link
              key={a.id}
              href={`/admin/scores?app=${a.id}`}
              className="flex items-center justify-between p-4 text-sm hover:bg-surface"
            >
              <span>
                <span className="font-medium">{a.student.name}</span> ·{" "}
                {formatRoundDate(a.round.date)} {a.round.roundNo}차 · {a.pieceCount}곡
              </span>
              <span className={a.scores.length ? "text-accent" : "text-ink/40"}>
                {a.scores.length ? "입력됨" : "미입력"}
              </span>
            </Link>
          ))}
          {apps.length === 0 && <p className="p-4 text-ink/50">신청 내역이 없습니다.</p>}
        </div>
      </div>
    );
  }

  const app = await db.application.findUnique({
    where: { id: searchParams.app },
    include: { student: true, round: true, scores: { orderBy: { pieceNo: "asc" } } },
  });
  if (!app) {
    return <p className="text-ink/60">신청서를 찾을 수 없습니다.</p>;
  }

  const pieces = parseList(app.pieces);
  const initialRows = Array.from({ length: app.pieceCount }).map((_, i) => {
    const s = app.scores.find((x) => x.pieceNo === i + 1);
    return {
      pieceNo: i + 1,
      judge1: s?.judge1?.toString() ?? "",
      judge2: s?.judge2?.toString() ?? "",
      judge3: s?.judge3?.toString() ?? "",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/scores" className="text-sm text-ink/50 hover:text-primary">
          ← 목록
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          {app.student.name} — {app.round.term} {app.round.roundNo}차
        </h1>
        <p className="text-sm text-ink/60">
          {app.targetSchool} · {parseList(app.majors).join(", ")}
        </p>
      </div>

      <div className="card p-6">
        <ScoreForm
          applicationId={app.id}
          pieces={pieces}
          initialRows={initialRows}
          initialReportUrl={app.scores.find((s) => s.reportFileUrl)?.reportFileUrl ?? ""}
        />
      </div>
    </div>
  );
}
