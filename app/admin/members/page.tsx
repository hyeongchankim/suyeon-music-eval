import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate } from "@/lib/format";
import MemberRow, { type Member } from "@/components/admin/MemberRow";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  await requireAdmin();

  const students = await db.student.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      applications: { include: { round: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const members: Member[] = students.map((s) => ({
    id: s.id,
    loginId: s.loginId,
    name: s.name,
    phone: s.phone,
    email: s.email,
    createdAt: s.createdAt.toISOString(),
    hasPassword: !!s.passwordHash,
    applications: s.applications.map((a) => ({
      id: a.id,
      roundLabel: `${formatRoundDate(a.round.date)} ${a.round.term} ${a.round.roundNo}차`,
      status: a.status,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">인원 관리</h1>
        <p className="mt-1 text-sm text-ink/60">
          참가자 계정 {members.length}명 · 이름을 누르면 신청 내역이 펼쳐집니다.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="p-3">이름 / ID</th>
              <th className="p-3">휴대폰</th>
              <th className="p-3">이메일</th>
              <th className="p-3">신청</th>
              <th className="p-3">가입일</th>
              <th className="p-3">비밀번호</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow key={m.id} m={m} />
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink/50">
                  등록된 참가자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
