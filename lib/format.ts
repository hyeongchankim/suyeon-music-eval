const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatRoundDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}(${WEEKDAYS[d.getDay()]})`;
}

/** D-day: 오늘 기준 남은 일수. 지났으면 음수. */
export function dday(target: Date): number {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);
}

export function ddayLabel(target: Date): string {
  const n = dday(target);
  if (n === 0) return "D-DAY";
  return n > 0 ? `D-${n}` : `종료`;
}

export function parseList(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
