/**
 * 심사 점수 평균 — 최고점·최저점 각 1개를 제외하고 나머지 평균 (절사평균).
 * 유효 점수가 3개 미만이면 단순 평균, 하나도 없으면 null.
 */
export function trimmedMean(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
  if (v.length === 0) return null;
  if (v.length < 3) return v.reduce((a, b) => a + b, 0) / v.length;
  const sorted = [...v].sort((a, b) => a - b).slice(1, -1); // 최저 1 + 최고 1 제외
  return sorted.reduce((a, b) => a + b, 0) / sorted.length;
}
