"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { pieceNo: number; judge1: string; judge2: string; judge3: string };

export default function ScoreForm({
  applicationId,
  pieces,
  initialRows,
  initialReportUrl,
}: {
  applicationId: string;
  pieces: string[];
  initialRows: Row[];
  initialReportUrl: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [reportUrl, setReportUrl] = useState(initialReportUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
  const rowAvg = (r: Row) => {
    const v = [r.judge1, r.judge2, r.judge3].map(num).filter((x): x is number => x != null);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "-";
  };

  function set(i: number, key: keyof Row, value: string) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicationId,
        reportFileUrl: reportUrl,
        rows: rows.map((r) => ({
          pieceNo: r.pieceNo,
          judge1: num(r.judge1),
          judge2: num(r.judge2),
          judge3: num(r.judge3),
        })),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("저장되었습니다.");
      router.refresh();
    } else {
      setMsg("저장에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="p-2">곡</th>
              <th className="p-2">심사1</th>
              <th className="p-2">심사2</th>
              <th className="p-2">심사3</th>
              <th className="p-2">평균</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.pieceNo} className="border-b border-line">
                <td className="p-2">
                  {r.pieceNo}. {pieces[r.pieceNo - 1] ?? "-"}
                </td>
                {(["judge1", "judge2", "judge3"] as const).map((k) => (
                  <td key={k} className="p-2">
                    <input
                      className="field !min-h-0 w-20 !py-1"
                      inputMode="decimal"
                      value={r[k]}
                      onChange={(e) => set(i, k, e.target.value)}
                    />
                  </td>
                ))}
                <td className="p-2 font-semibold">{rowAvg(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="block">
        <span className="label">결과 안내서 PDF URL (선택)</span>
        <input
          className="field"
          placeholder="https://..."
          value={reportUrl}
          onChange={(e) => setReportUrl(e.target.value)}
        />
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "저장 중..." : "점수 저장"}
        </button>
        {msg && <span className="text-sm text-ink/60">{msg}</span>}
      </div>
    </div>
  );
}
