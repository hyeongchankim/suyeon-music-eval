"use client";

import { useTransition } from "react";
import { setApplicationPaid } from "@/app/admin/actions";

export default function PaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
      <input
        type="checkbox"
        defaultChecked={paid}
        disabled={pending}
        onChange={(e) => start(() => setApplicationPaid(id, e.target.checked))}
      />
      <span className={paid ? "text-accent" : "text-ink/50"}>
        {paid ? "확인" : "미확인"}
      </span>
    </label>
  );
}
