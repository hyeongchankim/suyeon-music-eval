"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const nav = [
  { href: "/apply", label: "모의평가 신청" },
  { href: "/login", label: "결과 조회" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5">
        <Link href="/" className="text-lg font-bold text-primary">
          수연음악학원
          <span className="ml-2 text-sm font-medium text-ink/60">입시모의평가</span>
        </Link>

        {/* PC: 가로 메뉴 */}
        <nav className="hidden items-center gap-6 sm:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-[15px] text-ink/80 hover:text-primary">
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="btn-ghost">
            My 로그인
          </Link>
        </nav>

        {/* 모바일: 햄버거 */}
        <button
          className="sm:hidden"
          aria-label="메뉴 열기"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* 모바일 슬라이드 메뉴 */}
      {open && (
        <nav className="border-t border-line bg-bg px-5 py-4 sm:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block py-3 text-[15px] text-ink/80"
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="btn-ghost mt-2 w-full" onClick={() => setOpen(false)}>
            My 로그인
          </Link>
        </nav>
      )}
    </header>
  );
}
