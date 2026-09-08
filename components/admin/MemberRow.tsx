"use client";

import { useState, useTransition } from "react";
import { updateMember, resetMemberPassword, deleteMember } from "@/app/admin/actions";

export type Member = {
  id: string;
  loginId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  hasPassword: boolean;
  applications: { id: string; roundLabel: string; status: string }[];
};

export default function MemberRow({ m }: { m: Member }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok?: boolean; error?: string; tempPassword?: string }>) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      if (r?.error) setMsg(r.error);
      else if (r?.tempPassword) setMsg(`임시 비밀번호: ${r.tempPassword} (본인에게 전달 후 재설정 안내)`);
      else if (r?.ok) setMsg("완료되었습니다.");
    });
  }

  return (
    <>
      <tr className="border-b border-line align-top">
        <td className="p-3">
          <button className="font-medium hover:underline" onClick={() => setOpen((v) => !v)}>
            {m.name}
          </button>
          <div className="text-xs text-ink/50">{m.loginId}</div>
        </td>
        <td className="p-3">{m.phone}</td>
        <td className="p-3">{m.email}</td>
        <td className="p-3 text-center">{m.applications.length}</td>
        <td className="p-3 text-ink/60">{m.createdAt.slice(0, 10)}</td>
        <td className="p-3">
          <span className={m.hasPassword ? "text-accent" : "text-coral"}>
            {m.hasPassword ? "설정됨" : "없음"}
          </span>
        </td>
        <td className="p-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <button className="text-primary hover:underline" onClick={() => setEditing((v) => !v)}>
              수정
            </button>
            <button
              className="text-primary hover:underline"
              disabled={pending}
              onClick={() => run(() => resetMemberPassword(m.id))}
            >
              비밀번호 초기화
            </button>
            <button
              className="text-coral hover:underline"
              disabled={pending}
              onClick={() => {
                if (confirm(`${m.name}(${m.loginId}) 님과 모든 신청·점수 기록을 삭제합니다. 계속할까요?`))
                  run(() => deleteMember(m.id));
              }}
            >
              삭제
            </button>
          </div>
          {msg && <p className="mt-1 text-xs text-ink/60">{msg}</p>}
        </td>
      </tr>

      {editing && (
        <tr className="border-b border-line bg-surface">
          <td colSpan={7} className="p-3">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(() => updateMember(m.id, fd));
                setEditing(false);
              }}
            >
              <label className="text-xs">
                이름
                <input name="name" defaultValue={m.name} className="field !min-h-0 !py-1 block" />
              </label>
              <label className="text-xs">
                휴대폰
                <input name="phone" defaultValue={m.phone} className="field !min-h-0 !py-1 block" />
              </label>
              <label className="text-xs">
                이메일
                <input name="email" defaultValue={m.email} className="field !min-h-0 !py-1 block" />
              </label>
              <button className="btn-primary !min-h-0 !py-1.5">저장</button>
            </form>
          </td>
        </tr>
      )}

      {open && m.applications.length > 0 && (
        <tr className="border-b border-line bg-surface">
          <td colSpan={7} className="p-3 text-xs text-ink/70">
            <p className="mb-1 font-medium text-ink">신청 내역</p>
            <ul className="space-y-0.5">
              {m.applications.map((a) => (
                <li key={a.id}>
                  · {a.roundLabel} — {a.status}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
