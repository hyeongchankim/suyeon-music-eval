"use client";

import { forwardRef, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { applicationSchema, type ApplicationInput, MAJORS } from "@/lib/validators";
import { formatRoundDate } from "@/lib/format";

type Round = {
  id: string;
  term: string;
  roundNo: number;
  date: string;
  venue: string;
  majors: string[]; // 이 회차에서 응시 가능한 전공 (빈 배열이면 전체 허용)
};

const STEP_FIELDS: (keyof ApplicationInput)[][] = [
  ["name", "advisorName", "majors", "roundId", "targetSchool", "pieceCount", "pieces"],
  ["wantsScale", "wantsBlind", "wantsScoreReview", "preferredTime", "questionForJudge"],
  ["loginId", "phone", "email", "password", "passwordConfirm", "agreedNotice", "agreePrivacy"],
];

export default function ApplyForm({ rounds }: { rounds: Round[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idCheck, setIdCheck] = useState<null | "ok" | "dup" | "bad">(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationInput>,
    defaultValues: {
      majors: [],
      pieceCount: 1,
      pieces: [],
      wantsScale: false,
      wantsBlind: false,
      wantsScoreReview: false,
      agreedNotice: false,
      agreePrivacy: false,
    },
    mode: "onTouched",
  });

  const pieceCount = Number(watch("pieceCount") || 1);

  // 선택한 회차의 응시 가능 전공만 노출 (회차 미선택 또는 미지정이면 전체)
  const selectedRoundId = watch("roundId");
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const allowedMajors: readonly string[] =
    selectedRound && selectedRound.majors.length > 0 ? selectedRound.majors : MAJORS;

  useEffect(() => {
    const current = (getValues("majors") ?? []) as string[];
    const pruned = current.filter((m) => allowedMajors.includes(m));
    if (pruned.length !== current.length) {
      setValue("majors", pruned as ApplicationInput["majors"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId]);

  async function next() {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, 2));
  }

  async function checkId() {
    const loginId = getValues("loginId")?.trim() ?? "";
    if (!/^[a-zA-Z0-9]{4,}$/.test(loginId)) return setIdCheck("bad");
    const res = await fetch(`/api/applications?loginId=${encodeURIComponent(loginId)}`);
    const json = await res.json();
    setIdCheck(json.available ? "ok" : "dup");
  }

  async function onSubmit(values: ApplicationInput) {
    setSubmitError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitError(j.error ?? "제출 중 오류가 발생했습니다");
      return;
    }
    const { id } = await res.json();
    router.push(`/apply/complete?no=${id}`);
  }

  const err = (name: string) =>
    (errors as Record<string, { message?: string }>)[name]?.message;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-form px-5 py-8 sm:py-section-m"
    >
      {/* 진행바 1/3 · 2/3 · 3/3 */}
      <div className="sticky top-16 z-10 -mx-5 mb-8 bg-bg/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-accent" : "bg-line"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-ink/60">
          {step + 1} / 3 —{" "}
          {["참가자 정보", "연주자별 선택사항", "연락처 및 동의"][step]}
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="참가자명" required error={err("name")}>
              <input className="field" {...register("name")} />
            </Field>
            <Field label="지도교수명" error={err("advisorName")}>
              <input className="field" {...register("advisorName")} />
            </Field>

            <div>
              <p className="label">
                전공 <span className="text-coral">*</span>{" "}
                <span className="font-normal text-ink/50">(복수선택 가능)</span>
              </p>
              {selectedRound && (
                <p className="mb-1.5 text-xs text-ink/50">
                  선택한 회차에서 응시 가능한 전공만 표시됩니다.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {allowedMajors.map((m) => (
                  <label
                    key={m}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-btn border border-line px-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input type="checkbox" value={m} {...register("majors")} />
                    {m}
                  </label>
                ))}
              </div>
              {err("majors") && <ErrorText>{err("majors")}</ErrorText>}
            </div>

            <div>
              <p className="label">
                참가 희망 회차 <span className="text-coral">*</span>
              </p>
              <div className="space-y-2">
                {rounds.length === 0 && (
                  <p className="text-sm text-ink/60">
                    현재 열린 회차가 없습니다. 관리자에게 문의하세요.
                  </p>
                )}
                {rounds.map((r) => (
                  <label
                    key={r.id}
                    className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-btn border border-line px-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input type="radio" value={r.id} {...register("roundId")} />
                    <span>
                      {formatRoundDate(new Date(r.date))} · {r.term} {r.roundNo}차 —{" "}
                      {r.venue}
                    </span>
                  </label>
                ))}
              </div>
              {err("roundId") && <ErrorText>{err("roundId")}</ErrorText>}
            </div>

            <Field
              label="희망 목표(지망학교)"
              required
              error={err("targetSchool")}
              hint="복수 기재 시 우선순위 순으로 입력하세요."
            >
              <input className="field" {...register("targetSchool")} />
            </Field>

            <Field label="참가곡수" required error={err("pieceCount")}>
              <select className="field" {...register("pieceCount")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}곡
                  </option>
                ))}
              </select>
            </Field>

            <div className="space-y-2">
              {Array.from({ length: pieceCount }).map((_, i) => (
                <Field key={i} label={`참가곡명 ${i + 1}`} required error={err(`pieces.${i}`)}>
                  <input className="field" {...register(`pieces.${i}` as const)} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-ink/60">아래 항목은 모두 선택 사항입니다.</p>
            <Toggle label="스케일 연주 희망" {...register("wantsScale")} />
            <Toggle label="블라인드 심사 희망" {...register("wantsBlind")} />
            <Toggle label="악보 심사평 체크 희망" {...register("wantsScoreReview")} />
            <Field
              label="연주 희망 시간대"
              hint='"10시~15시 중 12시-13시" 형식으로 입력하세요.'
            >
              <input className="field" {...register("preferredTime")} />
            </Field>
            <Field
              label="심사위원에게 질문"
              hint="합격 가능성 등 예측성 질문은 제외해 주세요."
            >
              <textarea className="field min-h-[96px] py-3" {...register("questionForJudge")} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Field
                label="ID"
                required
                error={err("loginId")}
                hint="영문+숫자, 4자 이상. 로그인에 사용됩니다."
              >
                <div className="flex gap-2">
                  <input className="field" {...register("loginId")} />
                  <button type="button" className="btn-ghost shrink-0" onClick={checkId}>
                    중복확인
                  </button>
                </div>
              </Field>
              {idCheck === "ok" && <ErrorText ok>사용 가능한 ID입니다.</ErrorText>}
              {idCheck === "dup" && <ErrorText>이미 사용 중인 ID입니다.</ErrorText>}
              {idCheck === "bad" && <ErrorText>영문+숫자 4자 이상으로 입력하세요.</ErrorText>}
            </div>
            <Field label="휴대폰번호" required error={err("phone")} hint="로그인에 사용됩니다.">
              <input className="field" placeholder="010-1234-5678" {...register("phone")} />
            </Field>
            <Field label="이메일" required error={err("email")}>
              <input className="field" type="email" {...register("email")} />
            </Field>
            <Field
              label="비밀번호"
              required
              error={err("password")}
              hint="8자 이상. 결과 조회 로그인에 사용됩니다."
            >
              <input className="field" type="password" {...register("password")} />
            </Field>
            <Field label="비밀번호 확인" required error={err("passwordConfirm")}>
              <input
                className="field"
                type="password"
                {...register("passwordConfirm")}
              />
            </Field>
            <Toggle label="유의사항을 확인하였습니다. *" {...register("agreedNotice")} />
            {err("agreedNotice") && <ErrorText>{err("agreedNotice")}</ErrorText>}

            <div className="rounded-btn border border-line bg-surface p-4 text-sm text-ink/70">
              <p className="font-medium text-ink">개인정보 수집·이용 동의 (필수)</p>
              <p className="mt-1">
                수집항목: 참가자명·연락처·이메일·지망학교·참가곡명 등 / 목적: 모의평가 접수·운영 및
                결과 제공 / 보유기간: 수집일로부터 1년.
              </p>
            </div>
            <Toggle label="개인정보 수집·이용에 동의합니다. *" {...register("agreePrivacy")} />
            {err("agreePrivacy") && <ErrorText>{err("agreePrivacy")}</ErrorText>}
          </div>
        )}

        {submitError && <ErrorText>{submitError}</ErrorText>}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={() => setStep((s) => s - 1)}
            >
              이전
            </button>
          )}
          {step < 2 ? (
            <button type="button" className="btn-primary flex-1" onClick={next}>
              다음
            </button>
          ) : (
            <button type="submit" className="btn-accent flex-1" disabled={isSubmitting}>
              {isSubmitting ? "제출 중..." : "신청서 제출"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <p className={`mt-1 text-xs ${ok ? "text-accent" : "text-coral"}`}>{children}</p>
  );
}

const Toggle = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Toggle({ label, ...props }, ref) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
      <input type="checkbox" ref={ref} {...props} />
      <span className="text-[15px]">{label}</span>
    </label>
  );
});
