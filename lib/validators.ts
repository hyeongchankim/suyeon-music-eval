import { z } from "zod";

export const MAJORS = ["피아노", "성악", "현악", "관악", "작곡"] as const;

/** 5.2 신청서 — 3-step 폼 전체 payload */
export const applicationSchema = z
  .object({
    // Step 1
    name: z.string().trim().min(1, "참가자명을 입력하세요"),
    advisorName: z.string().trim().optional().or(z.literal("")),
    majors: z.array(z.enum(MAJORS)).min(1, "전공을 1개 이상 선택하세요"),
    roundIds: z.array(z.string()).min(1, "참가 희망 회차를 1개 이상 선택하세요"),
    targetSchool: z.string().trim().min(1, "희망 목표(지망학교)를 입력하세요"),
    pieceCount: z.coerce.number().int().min(1).max(5),
    pieces: z.array(z.string().trim()).min(1),
    // Step 2 (전부 선택)
    wantsScale: z.boolean().default(false),
    wantsBlind: z.boolean().default(false),
    wantsScoreReview: z.boolean().default(false),
    preferredTime: z.string().trim().optional().or(z.literal("")),
    questionForJudge: z.string().trim().optional().or(z.literal("")),
    // Step 3
    loginId: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9]+$/, "영문과 숫자만 사용할 수 있습니다")
      .min(4, "4자 이상 입력하세요"),
    phone: z
      .string()
      .trim()
      .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "휴대폰번호 형식이 올바르지 않습니다"),
    email: z.string().trim().email("이메일 형식이 올바르지 않습니다"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력하세요"),
    agreedNotice: z.boolean().refine((v) => v === true, "유의사항 확인이 필요합니다"),
    agreePrivacy: z
      .boolean()
      .refine((v) => v === true, "개인정보 수집·이용 동의가 필요합니다"),
  })
  .superRefine((val, ctx) => {
    for (let i = 0; i < val.pieceCount; i++) {
      if (!val.pieces[i] || val.pieces[i].trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `참가곡명 ${i + 1}을(를) 입력하세요`,
          path: ["pieces", i],
        });
      }
    }
    if (val.password !== val.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "비밀번호가 일치하지 않습니다",
        path: ["passwordConfirm"],
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** 5.3 로그인 — ID + 비밀번호 */
export const loginSchema = z.object({
  loginId: z.string().trim().min(1, "ID를 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "아이디를 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});
