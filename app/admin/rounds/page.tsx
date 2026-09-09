import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import { MAJORS } from "@/lib/validators";
import {
  createRound,
  toggleRound,
  updateNotice,
  updateRoundMajors,
  deleteRound,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminRoundsPage() {
  await requireAdmin();
  const rounds = await db.round.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">회차 관리</h1>

      {/* 새 회차 개설 */}
      <form action={createRound} className="card grid gap-3 p-6 sm:grid-cols-2">
        <p className="font-bold sm:col-span-2">새 회차 개설</p>
        <label className="block">
          <span className="label">기수</span>
          <input name="term" className="field" defaultValue="피아노 Season I" />
        </label>
        <label className="block">
          <span className="label">회차 번호</span>
          <input name="roundNo" type="number" className="field" defaultValue={1} min={1} />
        </label>
        <label className="block">
          <span className="label">일시</span>
          <input name="date" type="datetime-local" className="field" required />
        </label>
        <label className="block">
          <span className="label">장소</span>
          <input name="venue" className="field" required />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">주소</span>
          <input name="venueAddress" className="field" required />
        </label>
        <div className="sm:col-span-2">
          <span className="label">응시 가능 전공</span>
          <div className="flex flex-wrap gap-2">
            {MAJORS.map((m) => (
              <label
                key={m}
                className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-btn border border-line px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input type="checkbox" name="majors" value={m} defaultChecked={m === "피아노"} />
                {m}
              </label>
            ))}
          </div>
        </div>
        <button className="btn-primary sm:col-span-2">개설</button>
      </form>

      {/* 회차 목록 */}
      <div className="space-y-4">
        {rounds.map((r) => {
          const roundMajors = parseList(r.majors);
          return (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {r.term} {r.roundNo}차{" "}
                    <span className="ml-2 text-sm font-normal text-ink/50">
                      {formatRoundDate(r.date)} · {r.venue}
                    </span>
                  </p>
                  <p className="text-sm text-ink/50">
                    신청 {r._count.applications}건 ·{" "}
                    <span className={r.isOpen ? "text-accent" : "text-coral"}>
                      {r.isOpen ? "신청 열림" : "마감"}
                    </span>
                    {" · 전공 "}
                    {roundMajors.length ? roundMajors.join(", ") : "미지정"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleRound.bind(null, r.id, !r.isOpen)}>
                    <button className="btn-ghost">{r.isOpen ? "마감하기" : "다시 열기"}</button>
                  </form>
                  {r._count.applications === 0 && (
                    <form action={deleteRound.bind(null, r.id)}>
                      <button className="btn-ghost !text-coral">삭제</button>
                    </form>
                  )}
                </div>
              </div>

              {/* 응시 가능 전공 */}
              <form action={updateRoundMajors.bind(null, r.id)} className="mt-4">
                <span className="label">응시 가능 전공</span>
                <div className="flex flex-wrap gap-2">
                  {MAJORS.map((m) => (
                    <label
                      key={m}
                      className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-btn border border-line px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="checkbox"
                        name="majors"
                        value={m}
                        defaultChecked={roundMajors.includes(m)}
                      />
                      {m}
                    </label>
                  ))}
                </div>
                <button className="btn-ghost mt-2">전공 저장</button>
              </form>

              {/* 도착공지 */}
              <form action={updateNotice.bind(null, r.id)} className="mt-4">
                <span className="label">도착·공지 (입실시간 / 주차 / 운영진 공지)</span>
                <textarea
                  name="arrivalNotice"
                  defaultValue={r.arrivalNotice ?? ""}
                  className="field min-h-[80px] py-2"
                />
                <button className="btn-ghost mt-2">공지 저장</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
