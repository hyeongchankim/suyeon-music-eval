import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import StatusSelect from "@/components/admin/StatusSelect";
import PaidToggle from "@/components/admin/PaidToggle";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { round?: string };
}) {
  await requireAdmin();
  const rounds = await db.round.findMany({ orderBy: { date: "desc" } });
  const apps = await db.application.findMany({
    where: searchParams.round ? { roundId: searchParams.round } : undefined,
    orderBy: { createdAt: "desc" },
    include: { student: true, round: true, scores: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">신청자 조회</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/applications"
          className={`rounded-full px-3 py-1.5 ${
            !searchParams.round ? "bg-primary text-white" : "border border-line"
          }`}
        >
          전체
        </Link>
        {rounds.map((r) => (
          <Link
            key={r.id}
            href={`/admin/applications?round=${r.id}`}
            className={`rounded-full px-3 py-1.5 ${
              searchParams.round === r.id ? "bg-primary text-white" : "border border-line"
            }`}
          >
            {formatRoundDate(r.date)} {r.roundNo}차
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="p-3">신청일</th>
              <th className="p-3">참가자</th>
              <th className="p-3">ID</th>
              <th className="p-3">참가일</th>
              <th className="p-3">전공</th>
              <th className="p-3">지망학교</th>
              <th className="p-3">곡수</th>
              <th className="p-3">상태</th>
              <th className="p-3">입금확인</th>
              <th className="p-3">점수</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-b border-line align-top">
                <td className="p-3 text-ink/60">
                  {a.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="p-3 font-medium">
                  {a.student.name}
                  <div className="text-xs text-ink/50">{a.student.phone}</div>
                </td>
                <td className="p-3">{a.student.loginId}</td>
                <td className="p-3 whitespace-nowrap">
                  {formatRoundDate(a.round.date)} ({a.round.roundNo}차)
                </td>
                <td className="p-3">{parseList(a.majors).join(", ")}</td>
                <td className="p-3">{a.targetSchool}</td>
                <td className="p-3">{a.pieceCount}</td>
                <td className="p-3">
                  <StatusSelect id={a.id} status={a.status} />
                </td>
                <td className="p-3">
                  <PaidToggle id={a.id} paid={a.paid} />
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/scores?app=${a.id}`}
                    className="text-primary hover:underline"
                  >
                    {a.scores.length > 0 ? "수정" : "입력"}
                  </Link>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-ink/50">
                  신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
