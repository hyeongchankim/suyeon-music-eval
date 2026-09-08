"use client";

import { useTransition } from "react";
import { setApplicationStatus } from "@/app/admin/actions";

const OPTIONS = ["접수", "확정", "취소"];

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      className="field !min-h-0 !py-1 !text-sm"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setApplicationStatus(id, e.target.value))}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
