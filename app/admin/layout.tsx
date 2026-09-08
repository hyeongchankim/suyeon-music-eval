import Link from "next/link";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/rounds", label: "회차관리" },
  { href: "/admin/members", label: "인원관리" },
  { href: "/admin/applications", label: "신청자조회" },
  { href: "/admin/scores", label: "점수입력" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // 미로그인 시 (로그인 페이지 등) 셸 없이 그대로 렌더 — 개별 페이지가 requireAdmin() 처리
  if (!session.adminId) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-primary text-white">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <span className="font-bold">수연 관리자</span>
            <nav className="hidden gap-4 text-sm sm:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-white/80 hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <a href="/admin/logout" className="text-sm text-white/80 hover:text-white">
            로그아웃
          </a>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-5 pb-2 text-sm sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-white/80">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-content flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
