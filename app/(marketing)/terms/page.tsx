export const metadata = { title: "이용약관 · 수연음악학원" };

// 0. 확인이 필요한 실제 값 — 실제 상호/환불 정책 확정 후 법률 검토 필요.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-form px-5 py-section-m sm:py-section">
      <h1 className="text-2xl font-bold sm:text-3xl">이용약관</h1>
      <div className="mt-6 space-y-4 text-[15px] text-ink/80">
        <h2 className="pt-2 text-lg font-bold text-ink">제1조 (목적)</h2>
        <p>본 약관은 수연음악학원이 제공하는 입시모의평가 접수 서비스의 이용 조건을 정합니다.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">제2조 (접수와 확정)</h2>
        <p>신청서 제출 시 &ldquo;접수&rdquo; 상태가 되며, 학원의 확인 후 &ldquo;확정&rdquo;됩니다.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">제3조 (취소·환불)</h2>
        <p>회차 2일 전까지 취소 요청 시 전액 환불하며, 이후에는 환불이 제한될 수 있습니다.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">제4조 (결과 제공)</h2>
        <p>평가 결과 및 안내서는 회차 종료 후 마이페이지를 통해 제공됩니다.</p>
        <p className="pt-4 text-sm text-ink/50">본 약관은 임시 문안이며 시행 전 법률 검토가 필요합니다.</p>
      </div>
    </article>
  );
}
