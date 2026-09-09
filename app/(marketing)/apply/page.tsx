import { db } from "@/lib/db";
import { parseList } from "@/lib/format";
import ApplyForm from "@/components/apply/ApplyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "모의평가 신청 · 수연음악학원" };

export default async function ApplyPage() {
  const rounds = await db.round.findMany({
    where: { isOpen: true },
    orderBy: { date: "asc" },
    select: { id: true, term: true, roundNo: true, date: true, venue: true, majors: true },
  });

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-form px-5 pt-section-m">
        <h1 className="text-2xl font-bold sm:text-3xl">모의평가 신청</h1>
        <p className="mt-2 text-ink/70">3단계로 나누어 신청 정보를 입력합니다.</p>
      </div>
      <ApplyForm
        rounds={rounds.map((r) => ({
          ...r,
          date: r.date.toISOString(),
          majors: parseList(r.majors),
        }))}
      />
    </div>
  );
}
