"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminLogin } from "@/app/admin/actions";

const initial: { error?: string } = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" disabled={pending}>
      {pending ? "확인 중..." : "로그인"}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(adminLogin, initial);

  return (
    <div className="mx-auto max-w-sm px-5 py-section-m sm:py-section">
      <div className="card p-8">
        <h1 className="text-xl font-bold">관리자 로그인</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="label">이메일</label>
            <input name="email" type="email" className="field" required />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input name="password" type="password" className="field" required />
          </div>
          {state?.error && <p className="text-sm text-coral">{state.error}</p>}
          <SubmitBtn />
        </form>
      </div>
    </div>
  );
}
