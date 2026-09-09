"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trimmedMean } from "@/lib/score";

const JUDGES = ["judge1", "judge2", "judge3", "judge4", "judge5"] as const;
type JudgeKey = (typeof JUDGES)[number];
type Row = { pieceNo: number } & Record<JudgeKey, string>;

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
    const m = trimmedMean(JUDGES.map((k) => num(r[k]) ?? null));
    return m === null ? "-" : m.toFixed(2);
  };

  function set(i: number, key: JudgeKey, value: string) {
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
          ...Object.fromEntries(JUDGES.map((k) => [k, num(r[k])])),
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
      <p className="text-xs text-ink/50">
        평균은 최고점·최저점 각 1개를 제외하고 계산됩니다. (유효 점수 3개 미만이면 단순 평균)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="p-2">곡</th>
              {JUDGES.map((_, idx) => (
                <th key={idx} className="p-2">
                  심사{idx + 1}
                </th>
              ))}
              <th className="p-2">평균</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.pieceNo} className="border-b border-line">
                <td className="p-2">
                  {r.pieceNo}. {pieces[r.pieceNo - 1] ?? "-"}
                </td>
                {JUDGES.map((k) => (
                  <td key={k} className="p-2">
                    <input
                      className="field !min-h-0 w-16 !py-1"
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
