import Link from "next/link";

// 0. 확인이 필요한 실제 값 — 아래 사업자정보는 임시값. 실제 정보로 교체 필요.
export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-content px-5 py-12 text-sm text-ink/70">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-base font-bold text-primary">수연음악학원</p>
            <p className="mt-2">대표: 000 · 사업자등록번호: 000-00-00000</p>
            <p>통신판매업 신고: 0000-서울-0000</p>
            <p>서울시 서초구 반포대로 00, 3층</p>
            <p>문의: 카카오톡 채널 @수연음악학원 · suyeon@example.com</p>
          </div>
          <nav className="flex gap-4">
            <Link href="/terms" className="hover:text-primary">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              개인정보처리방침
            </Link>
            <Link href="/admin/login" className="hover:text-primary">
              관리자
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-ink/50">
          © {new Date().getFullYear()} 수연음악학원. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
