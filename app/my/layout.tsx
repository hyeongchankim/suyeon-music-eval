import Link from "next/link";
import { requireStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent();
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5">
          <Link href="/my" className="font-bold text-primary">
            수연음악학원 · 마이페이지
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink/60">{session.name}님</span>
            <a href="/my/logout" className="text-ink/60 hover:text-primary">
              로그아웃
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-content flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
