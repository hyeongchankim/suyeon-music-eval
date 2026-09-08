"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { setPassword } from "@/app/my/actions";

export default function PasswordBanner({ urge }: { urge: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await setPassword(new FormData(e.currentTarget));
    if (res?.ok) {
      setDone(true);
    } else {
      setMsg(res?.error ?? "저장에 실패했습니다");
    }
  }

  return (
    <div
      className={`card p-5 ${urge ? "border-coral bg-coral/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">
            {urge
              ? "계정 보호를 위해 비밀번호를 설정해 주세요"
              : "비밀번호가 설정되어 있지 않습니다"}
          </p>
          <p className="mt-1 text-sm text-ink/70">
            비밀번호를 설정하면 이후 ID + 비밀번호로도 로그인할 수 있습니다.
          </p>

          {!open ? (
            <div className="mt-3 flex gap-2">
              <button className="btn-primary" onClick={() => setOpen(true)}>
                지금 설정하기
              </button>
              {!urge && (
                <button className="btn-ghost" onClick={() => setDone(true)}>
                  나중에
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
              <input
                name="password"
                type="password"
                className="field max-w-xs"
                placeholder="새 비밀번호 (8자 이상)"
                required
              />
              <button className="btn-accent">저장</button>
              {msg && <p className="w-full text-sm text-coral">{msg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
