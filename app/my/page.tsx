import Link from "next/link";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import PasswordBanner from "@/components/my/PasswordBanner";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await requireStudent();
  const student = await db.student.findUnique({
    where: { id: session.studentId! },
    include: {
      applications: { include: { round: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* 정보 카드 */}
      <section className="card p-6">
        <h1 className="text-lg font-bold">내 정보</h1>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="이름" value={student.name} />
          <Row label="ID" value={student.loginId} />
          <Row label="휴대폰" value={student.phone} />
          <Row label="이메일" value={student.email} />
          <Row label="신청 회차 수" value={`${student.applications.length}건`} />
        </dl>
      </section>

      {!student.passwordHash && (
        <PasswordBanner urge={student.loginCount >= 3} />
      )}

      {/* 신청 회차 리스트 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">신청 회차</h2>
        {student.applications.length === 0 ? (
          <div className="card p-6 text-sm text-ink/60">
            신청 내역이 없습니다.{" "}
            <Link href="/apply" className="font-medium text-primary">
              모의평가 신청하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {student.applications.map((a) => (
              <Link
                key={a.id}
                href={`/my/${a.roundId}`}
                className="card block p-5 transition hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">
                    {a.round.term} {a.round.roundNo}차
                  </p>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink/70">
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {formatRoundDate(a.round.date)} · {a.round.venue}
                </p>
                <p className="mt-2 text-xs text-ink/50">
                  {parseList(a.majors).join(", ")} · {a.targetSchool} · {a.pieceCount}곡
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5 sm:block sm:border-0 sm:py-0">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
