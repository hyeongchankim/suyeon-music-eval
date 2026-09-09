import Link from "next/link";
import {
  Mic2,
  Users,
  ShieldCheck,
  BarChart3,
  Trophy,
  Music4,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatRoundDate, ddayLabel, parseList } from "@/lib/format";
import TestimonialSlider from "@/components/marketing/TestimonialSlider";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Mic2, title: "실전 무대 평가", desc: "입시 현장과 동일한 동선·조명·긴장감 속에서 연주합니다." },
  { icon: Users, title: "다양한 무대 경험", desc: "회차를 거듭할수록 무대 적응력이 쌓입니다." },
  { icon: ShieldCheck, title: "검증된 심사위원", desc: "현직 교수·연주자 3인 체제로 평가합니다." },
  { icon: BarChart3, title: "세분화된 평가 모델", desc: "곡별·항목별 점수와 코멘트를 따로 제공합니다." },
  { icon: Trophy, title: "그룹 랭킹 제공", desc: "같은 목표를 둔 지원자 사이 상대 위치를 확인합니다. (Phase 2)" },
  { icon: Music4, title: "음원 공유", desc: "동일 조건 그룹끼리 연주 음원을 공유합니다. (Phase 2)" },
];

export default async function LandingPage() {
  const nextRound = await db.round.findFirst({
    where: { isOpen: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
  const courses = await db.round.findMany({
    where: { isOpen: true },
    orderBy: { date: "asc" },
  });
  const majorsForCourses = Array.from(
    new Set(
      (
        await db.application.findMany({ select: { majors: true } })
      ).flatMap((a) => parseList(a.majors)),
    ),
  );
  const courseTypes = majorsForCourses.length ? majorsForCourses : ["피아노"];

  return (
    <>
      {/* 히어로 */}
      <section className="bg-surface">
        <div className="relative isolate overflow-hidden">
          {/* 배경 이미지 (불투명도 40%) */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[url('/main2.jpeg')] bg-cover bg-center opacity-40"
          />
          <div className="mx-auto grid max-w-content gap-10 px-5 py-section-m sm:py-section lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
              당신의 무대는,
              <br />
              실전처럼.
            </h1>
            <p className="mt-5 text-base text-ink/80 sm:text-lg">
              입시 현장과 같은 환경에서 미리 평가받고,{" "}
              <br className="hidden sm:block" />
              솔직한 피드백으로 다음 무대를 준비하세요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/apply" className="btn-accent">
                모의평가 신청하기
              </Link>
              <Link href="/login" className="btn-ghost">
                결과 조회 로그인
              </Link>
            </div>
            {nextRound && (
              <p className="mt-6 inline-flex items-center gap-2 rounded-btn bg-bg px-4 py-2 text-sm text-ink/80 shadow-card">
                다음 회차: {formatRoundDate(nextRound.date)} · {nextRound.term}{" "}
                {nextRound.roundNo}차
                <span className="font-bold text-coral">
                  {ddayLabel(nextRound.date)}
                </span>
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card">
              <div className="absolute -left-10 top-6 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="card relative flex h-full items-center justify-center">
                <Music4 className="h-24 w-24 text-primary/40" />
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* 과정 소개 */}
      <section className="mx-auto max-w-content px-5 py-section-m sm:py-section">
        <h2 className="text-2xl font-bold sm:text-3xl">과정 소개</h2>
        <p className="mt-2 text-ink/70">현재 운영 중인 모의평가 과정입니다.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courseTypes.map((type) => (
            <div key={type} className="card p-6">
              <p className="text-lg font-bold text-primary">{type}</p>
              <p className="mt-1 text-sm text-ink/70">피아노 Season I</p>
              <ul className="mt-4 space-y-1 text-sm text-ink/80">
                {courses.map((r) => (
                  <li key={r.id}>
                    · {formatRoundDate(r.date)} {r.roundNo}차 — {r.venue}
                  </li>
                ))}
                {courses.length === 0 && <li>· 다음 회차 준비 중</li>}
              </ul>
              <Link href="/apply" className="btn-primary mt-6 w-full">
                신청하기
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 차별점 6가지 (2×3) */}
      <section className="bg-surface">
        <div className="mx-auto max-w-content px-5 py-section-m sm:py-section">
          <h2 className="text-2xl font-bold sm:text-3xl">수연 모의평가가 다른 점</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <f.icon className="h-8 w-8 text-accent" />
                <p className="mt-4 font-bold">{f.title}</p>
                <p className="mt-1 text-sm text-ink/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 후기 */}
      <section className="mx-auto max-w-content px-5 py-section-m sm:py-section">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
          먼저 경험한 분들의 이야기
        </h2>
        <TestimonialSlider />
      </section>

      {/* CTA 배너 */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-content flex-col items-center gap-5 px-5 py-section-m text-center sm:py-section">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            다음 무대, 준비되셨나요?
          </h2>
          <p className="text-white/80">지금 모의평가를 신청하고 실전 피드백을 받아보세요.</p>
          <Link href="/apply" className="btn-accent">
            모의평가 신청하기
          </Link>
        </div>
      </section>
    </>
  );
}
