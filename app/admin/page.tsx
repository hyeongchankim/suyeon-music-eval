import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const [upcoming, newCount, applications, memberCount] = await Promise.all([
    db.round.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.application.count({ where: { status: "접수" } }),
    db.application.findMany({ include: { scores: true, round: true } }),
    db.student.count(),
  ]);

  const ungraded = applications.filter(
    (a) => a.round.date < now && a.scores.length === 0,
  ).length;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">대시보드</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="다가오는 회차" value={`${upcoming.length}`} href="/admin/rounds" />
        <Stat label="참가자 수" value={`${memberCount}`} href="/admin/members" />
        <Stat label="신규 신청 (접수)" value={`${newCount}`} href="/admin/applications" />
        <Stat label="미채점 건수" value={`${ungraded}`} href="/admin/scores" />
      </div>

      <section>
        <h2 className="mb-3 font-bold">다가오는 회차</h2>
        <div className="card divide-y divide-line">
          {upcoming.length === 0 && (
            <p className="p-4 text-sm text-ink/60">예정된 회차가 없습니다.</p>
          )}
          {upcoming.map((r) => (
            <div key={r.id} className="flex justify-between p-4 text-sm">
              <span>
                {formatRoundDate(r.date)} · {r.term} {r.roundNo}차
              </span>
              <span className={r.isOpen ? "text-accent" : "text-ink/40"}>
                {r.isOpen ? "신청 열림" : "마감"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="card p-5 transition hover:border-primary">
      <p className="text-sm text-ink/50">{label}</p>
      <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
    </Link>
  );
}
