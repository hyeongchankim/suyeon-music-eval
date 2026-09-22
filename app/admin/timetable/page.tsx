import { Fragment } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRoundDate, parseList } from "@/lib/format";
import { MAJORS } from "@/lib/validators";
import {
  ARRIVE_BEFORE_MIN,
  SLOT_MIN,
  MAX_GROUP_SIZE,
  MAX_GROUP_PIECES,
  parseHM,
  kstHM,
  kstDateTime,
  majorUniverse,
  effectiveMajorOrder,
  buildSchedule,
  timetableMessage,
} from "@/lib/timetable";
import ConfirmButton from "@/components/admin/ConfirmButton";
import CopyButton from "@/components/admin/CopyButton";
import {
  saveTimetableSettings,
  moveMajor,
  generateTimetable,
  moveSlot,
  addToTimetable,
  sendTimetable,
} from "./actions";

export const dynamic = "force-dynamic";

const arrowBtn =
  "flex h-7 w-7 items-center justify-center rounded border border-line text-xs hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30";

/** "현재 학교 학년 이름" — 미입력 항목은 건너뜀 (레거시 데이터 대비) */
function displayName(s: { name: string; currentSchool: string | null; grade: string | null }) {
  return [s.currentSchool, s.grade, s.name].filter(Boolean).join(" ");
}

export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: { round?: string };
}) {
  await requireAdmin();

  const rounds = await db.round.findMany({ orderBy: { date: "asc" } });
  if (rounds.length === 0) return <p className="text-ink/60">등록된 회차가 없습니다.</p>;

  const now = Date.now();
  const round =
    rounds.find((r) => r.id === searchParams.round) ??
    rounds.find((r) => r.date.getTime() >= now - 86_400_000) ??
    rounds[rounds.length - 1];

  const apps = await db.application.findMany({
    where: { roundId: round.id },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });
  const eligible = apps.filter((a) => a.paid && a.status !== "취소");
  const placed = eligible
    .filter((a) => a.ttOrder !== null)
    .sort((a, b) => a.ttOrder! - b.ttOrder!);
  const unplaced = eligible.filter((a) => a.ttOrder === null);

  const universe = majorUniverse(parseList(round.majors), eligible, MAJORS);
  const order = effectiveMajorOrder(parseList(round.ttMajorOrder), universe);
  const startHM = round.ttStartTime ?? kstHM(round.date);

  const rows = buildSchedule(placed, parseHM(startHM) ?? 0, order);
  const groups: { no: number; major: string; school: string; rows: typeof rows }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.no === r.group) last.rows.push(r);
    else groups.push({ no: r.group, major: r.major, school: r.targetSchool, rows: [r] });
  }

  const dateLabel = formatRoundDate(round.date);
  const msgOf = (name: string, group: number, start: string, arrive: string) =>
    timetableMessage({
      name,
      date: dateLabel,
      roundNo: round.roundNo,
      group,
      start,
      arrive,
      venue: round.venue,
      address: round.venueAddress,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">시간표 제작</h1>
        <p className="mt-1 text-sm text-ink/60">
          입금 확인이 완료된 신청자를 전공 · 지망학교 별로 조를 짜서 시간표를 만듭니다.
        </p>
      </div>

      {/* 회차 선택 */}
      <div className="flex flex-wrap gap-2 text-sm">
        {rounds.map((r) => (
          <Link
            key={r.id}
            href={`/admin/timetable?round=${r.id}`}
            className={`rounded-full px-3 py-1.5 ${
              r.id === round.id ? "bg-primary text-white" : "border border-line"
            }`}
          >
            {formatRoundDate(r.date)} {r.roundNo}차
          </Link>
        ))}
      </div>

      {/* 진행 설정 */}
      <section className="card space-y-5 p-6">
        <h2 className="font-bold">
          {dateLabel} {round.roundNo}차 진행 설정
        </h2>

        <form
          action={saveTimetableSettings.bind(null, round.id)}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="block">
            <span className="label">시작 시간</span>
            <input
              key={startHM}
              type="time"
              name="startTime"
              defaultValue={startHM}
              required
              className="field w-36"
            />
          </label>
          <button className="btn-ghost">설정 저장</button>
          <p className="text-xs text-ink/50">
            한 조는 최대 {MAX_GROUP_SIZE}명, 총 곡수 {MAX_GROUP_PIECES}곡을 넘지 않는 선에서
            자동으로 나뉘고, 조마다 {SLOT_MIN}분 단위로 배치됩니다.
          </p>
        </form>

        <div>
          <p className="label">전공 진행 순서</p>
          {order.length === 0 ? (
            <p className="text-sm text-ink/50">대상 전공이 없습니다.</p>
          ) : (
            <ol className="flex flex-wrap gap-2">
              {order.map((m, i) => (
                <li
                  key={m}
                  className="flex items-center gap-1.5 rounded-btn border border-line px-3 py-1.5 text-sm"
                >
                  <span className="text-ink/40">{i + 1}</span>
                  <span className="font-medium">{m}</span>
                  <form action={moveMajor.bind(null, round.id, m, "up")}>
                    <button className={arrowBtn} disabled={i === 0} aria-label={`${m} 앞으로`}>
                      ←
                    </button>
                  </form>
                  <form action={moveMajor.bind(null, round.id, m, "down")}>
                    <button
                      className={arrowBtn}
                      disabled={i === order.length - 1}
                      aria-label={`${m} 뒤로`}
                    >
                      →
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-xs text-ink/50">
            시작 시간·전공 순서를 바꾼 뒤에는 아래 &lsquo;시간표 생성&rsquo;을 눌러야 반영됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <form action={generateTimetable.bind(null, round.id)}>
            {placed.length > 0 ? (
              <ConfirmButton
                className="btn-primary"
                message="시간표를 다시 생성하면 직접 바꾼 순서가 모두 초기화됩니다. 계속할까요?"
              >
                시간표 재생성
              </ConfirmButton>
            ) : (
              <button className="btn-primary" disabled={eligible.length === 0}>
                시간표 생성
              </button>
            )}
          </form>
          <p className="text-sm text-ink/60">
            입금 확인 완료 <b className="text-ink">{eligible.length}명</b>
            {apps.length - eligible.length > 0 && (
              <>
                {" "}
                · 제외(입금 미확인·취소) {apps.length - eligible.length}명{" "}
                <Link href={`/admin/applications?round=${round.id}`} className="text-primary underline">
                  입금 확인하러 가기
                </Link>
              </>
            )}
          </p>
        </div>
      </section>

      {/* 시간표 */}
      {placed.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink/50">
          {eligible.length === 0
            ? "입금 확인이 완료된 신청자가 없습니다."
            : "아직 시간표가 생성되지 않았습니다. 위에서 시작 시간을 확인하고 '시간표 생성'을 눌러주세요."}
        </div>
      ) : (
        <section className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/50">
                <th className="p-3">순서</th>
                <th className="p-3">참가자</th>
                <th className="p-3">전공</th>
                <th className="p-3">지망학교</th>
                <th className="p-3">연락처</th>
                <th className="p-3">순서 변경</th>
                <th className="p-3">안내</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.no}>
                  <tr className="border-b border-line bg-surface">
                    <td colSpan={7} className="p-3 text-primary">
                      <span className="text-base font-bold">
                        {g.no}조 {g.rows[0].start}
                      </span>
                      <span className="ml-2 font-semibold">
                        {g.major} · {g.school}
                      </span>
                      <span className="ml-2 font-normal text-ink/50">
                        {g.rows.length}명 · {g.rows[0].arrive}까지 도착
                      </span>
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.id} className="border-b border-line">
                      <td className="p-3 text-ink/50">{r.no}</td>
                      <td className="p-3">
                        {displayName(r.student)}
                        <div className="text-xs text-ink/50">{r.student.loginId}</div>
                      </td>
                      <td className="p-3">{r.major}</td>
                      <td className="p-3">{r.targetSchool}</td>
                      <td className="p-3 whitespace-nowrap">{r.student.phone}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <form action={moveSlot.bind(null, r.id, "up")}>
                            <button className={arrowBtn} disabled={r.no === 1} aria-label="위로">
                              ↑
                            </button>
                          </form>
                          <form action={moveSlot.bind(null, r.id, "down")}>
                            <button
                              className={arrowBtn}
                              disabled={r.no === rows.length}
                              aria-label="아래로"
                            >
                              ↓
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="p-3">
                        <CopyButton text={msgOf(r.student.name, r.group, r.start, r.arrive)} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 생성 이후 입금 확인된 미배정 인원 */}
      {placed.length > 0 && unplaced.length > 0 && (
        <section className="card p-5">
          <p className="font-bold">미배정 ({unplaced.length}명)</p>
          <p className="text-sm text-ink/60">
            시간표 생성 이후 입금 확인된 신청자입니다. 맨 뒤에 추가한 뒤 순서를 조정하세요.
          </p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {unplaced.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>
                  {displayName(a.student)} · {parseList(a.majors).join(", ")} · {a.targetSchool}
                </span>
                <form action={addToTimetable.bind(null, a.id)}>
                  <button className="btn-ghost !min-h-0 !py-1 text-xs">맨 뒤에 추가</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 시간표 전송 */}
      {placed.length > 0 && (
        <section className="card space-y-4 p-6">
          <h2 className="font-bold">시간표 전송</h2>
          <p className="text-sm text-ink/70">
            전송하면 참가자 <b>마이페이지(도착·공지)</b>에 개인별 연주 시간과 아래 안내 문구가
            표시됩니다. 문자로 알릴 때는 표의 &lsquo;문구 복사&rsquo;로 각자 문구를 복사해 보내세요.
          </p>
          <pre className="whitespace-pre-wrap rounded-btn bg-surface p-4 text-sm text-ink/80">
            {msgOf("OOO", rows[0].group, rows[0].start, rows[0].arrive)}
          </pre>
          <p className="text-xs text-ink/50">
            모든 참가자에게 &lsquo;연주 시간 {ARRIVE_BEFORE_MIN}분 전까지 도착해서 연습&rsquo; 안내가
            함께 나갑니다.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <form action={sendTimetable.bind(null, round.id)}>
              <ConfirmButton
                className="btn-accent"
                message={`입금 확인된 ${placed.length}명의 마이페이지에 시간표를 공개합니다. 전송할까요?`}
              >
                {round.ttSentAt ? "시간표 다시 전송" : "시간표 전송"}
              </ConfirmButton>
            </form>
            {round.ttSentAt ? (
              <span className="text-sm text-accent">
                마지막 전송 {kstDateTime(round.ttSentAt)}
              </span>
            ) : (
              <span className="text-sm text-ink/50">아직 전송하지 않았습니다.</span>
            )}
          </div>
          {round.ttSentAt && (
            <p className="text-xs text-coral">
              전송 이후 순서를 바꾸면 이미 안내한 시간과 달라질 수 있어요. 변경했다면 다시 전송해
              주세요.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
