import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "신청 완료 · 수연음악학원" };

export default function ApplyCompletePage({
  searchParams,
}: {
  searchParams: { no?: string; count?: string };
}) {
  const count = Number(searchParams.count ?? 1);
  return (
    <div className="mx-auto max-w-form px-5 py-section-m sm:py-section">
      <div className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
        <h1 className="mt-4 text-2xl font-bold">
          {count > 1 ? `${count}개 회차 신청이 접수되었습니다` : "신청이 접수되었습니다"}
        </h1>
        {searchParams.no && (
          <p className="mt-2 text-sm text-ink/60">
            신청번호: <span className="font-mono font-semibold">{searchParams.no}</span>
            {count > 1 && " 외"}
          </p>
        )}
        <p className="mt-4 text-[15px] text-ink/80">
          회차 2일 전, 입력하신 휴대폰번호로 개별 안내 문자를 발송해 드립니다.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login" className="btn-primary">
            로그인하고 결과 조회하기
          </Link>
          <Link href="/" className="btn-ghost">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
