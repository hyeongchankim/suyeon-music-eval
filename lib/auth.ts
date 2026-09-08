import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface StudentSession {
  studentId?: string;
  loginId?: string;
  name?: string;
}

export interface AdminSession {
  adminId?: string;
  username?: string;
  role?: string;
}

const password = process.env.SESSION_PASSWORD as string;
const secure = process.env.NODE_ENV === "production";

const studentOpts = {
  password,
  cookieName: "suyeon_student",
  cookieOptions: { secure },
};
const adminOpts = {
  password,
  cookieName: "suyeon_admin",
  cookieOptions: { secure },
};

export function getStudentSession(): Promise<IronSession<StudentSession>> {
  return getIronSession<StudentSession>(cookies(), studentOpts);
}

export function getAdminSession(): Promise<IronSession<AdminSession>> {
  return getIronSession<AdminSession>(cookies(), adminOpts);
}

/** 로그인 필수 영역 가드 — 미로그인 시 리다이렉트 */
export async function requireStudent() {
  const s = await getStudentSession();
  if (!s.studentId) redirect("/login");
  return s;
}

export async function requireAdmin() {
  const s = await getAdminSession();
  if (!s.adminId) redirect("/admin/login");
  return s;
}
