"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ loginId: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "로그인에 실패했습니다");
      return;
    }
    router.push("/my");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-form px-5 py-section-m sm:py-section">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">결과 조회 로그인</h1>
        <p className="mt-2 text-sm text-ink/60">
          신청 시 등록한 ID와 비밀번호로 로그인하세요.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">ID</label>
            <input
              className="field"
              value={form.loginId}
              onChange={(e) => setForm({ ...form, loginId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button className="btn-accent w-full" disabled={busy}>
            {busy ? "확인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          아직 신청 전이신가요?{" "}
          <Link href="/apply" className="font-medium text-primary">
            모의평가 신청하기
          </Link>
        </p>
      </div>
    </div>
  );
}
