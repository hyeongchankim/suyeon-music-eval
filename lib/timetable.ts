import { parseList } from "./format";

/** 연주 시작 N분 전까지 도착해서 연습해야 함 */
export const ARRIVE_BEFORE_MIN = 30;

/** "HH:mm" → 자정 기준 분. 형식이 틀리면 null */
export function parseHM(s: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** 자정 기준 분 → "HH:mm" (24시간 순환) */
export function fmtHM(totalMin: number): string {
  const t = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; // 9:00 (시는 0 패딩 없음)
}

/** 서버 타임존과 무관하게 한국 시간 기준 "YYYY-MM-DD HH:mm" */
export function kstDateTime(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** 한국 시간 기준 "HH:mm" */
export const kstHM = (d: Date) => kstDateTime(d).slice(11);

/** 회차에서 다룰 전공 목록 = 회차 응시 전공 ∪ 배정 대상자의 전공 (MAJORS 순서 유지) */
export function majorUniverse(
  roundMajors: string[],
  apps: { majors: string }[],
  all: readonly string[],
): string[] {
  const present = [...roundMajors, ...apps.flatMap((a) => parseList(a.majors))];
  const uniq = present.filter((m, i) => present.indexOf(m) === i);
  return [...all.filter((m) => uniq.includes(m)), ...uniq.filter((m) => !all.includes(m))];
}

/** 저장된 전공 순서 + 빠진 전공은 뒤에 붙여 항상 전체 목록을 반환 */
export function effectiveMajorOrder(saved: string[], universe: string[]): string[] {
  const kept = saved.filter((m) => universe.includes(m));
  return [...kept, ...universe.filter((m) => !kept.includes(m))];
}

/** 복수 전공 신청자는 진행 순서가 가장 빠른 전공으로 배정 */
export function primaryMajor(majorsJson: string, order: string[]): string {
  const ms = parseList(majorsJson);
  const rank = (m: string) => (order.indexOf(m) === -1 ? 999 : order.indexOf(m));
  return ms.reduce((best, m) => (rank(m) < rank(best) ? m : best), ms[0] ?? "");
}

/** 생성용 정렬: 전공 진행 순서 → 지망학교(가나다) → 신청 순 */
export function sortForTimetable<
  T extends { majors: string; targetSchool: string; createdAt: Date },
>(apps: T[], order: string[]): T[] {
  const rank = (a: T) => {
    const i = order.indexOf(primaryMajor(a.majors, order));
    return i === -1 ? 999 : i;
  };
  return [...apps].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      a.targetSchool.localeCompare(b.targetSchool, "ko") ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/** 한 조가 차지하는 시간(분) */
export const SLOT_MIN = 30;

/** 시간당 perHour 명 → 30분(1조)당 인원 */
export const perSlot = (perHour: number) =>
  Math.max(1, Math.round((perHour * SLOT_MIN) / 60));

/**
 * 순서가 정해진 신청자 목록에 조와 시간을 붙인다.
 * - 조: (전공, 지망학교)가 바뀌거나 한 조가 perSlot 명을 채우면 새 조
 * - 시간: 조마다 30분 블록 — 1조 시작시각, 2조 +30분 … (같은 조는 모두 같은 시각, 학생별 분 단위 없음)
 */
export function buildSchedule<T extends { majors: string; targetSchool: string }>(
  apps: T[],
  startMin: number,
  perHour: number,
  order: string[],
) {
  const cap = perSlot(perHour);
  let group = 0;
  let inGroup = 0;
  let prevKey = "";
  return apps.map((a, i) => {
    const major = primaryMajor(a.majors, order);
    const key = `${major}|${a.targetSchool}`;
    if (key !== prevKey || inGroup >= cap) {
      group++;
      inGroup = 0;
      prevKey = key;
    }
    inGroup++;
    const groupStart = startMin + (group - 1) * SLOT_MIN;
    return {
      ...a,
      major,
      group,
      no: i + 1,
      start: fmtHM(groupStart),
      end: fmtHM(groupStart + SLOT_MIN),
      arrive: fmtHM(groupStart - ARRIVE_BEFORE_MIN),
    };
  });
}

/** 참가자에게 보낼 안내 문구 (30분 전 도착·연습 안내 포함) */
export function timetableMessage(p: {
  name: string;
  date: string;
  roundNo: number;
  group: number;
  start: string;
  arrive: string;
  venue: string;
  address: string;
}): string {
  return [
    `[수연음악학원] ${p.name}님, ${p.date} ${p.roundNo}차 모의평가 연주 시간표 안내드립니다.`,
    `▶ 연주 시간: ${p.group}조 ${p.start}`,
    `▶ 연주 시간 ${ARRIVE_BEFORE_MIN}분 전(${p.arrive})까지 도착하셔서 연습을 진행해 주세요.`,
    `▶ 장소: ${p.venue} (${p.address})`,
  ].join("\n");
}
