export const metadata = { title: "개인정보처리방침 · 수연음악학원" };

// 0. 확인이 필요한 실제 값 — 실제 사업자정보/보유기간 확정 후 법률 검토 필요.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-form px-5 py-section-m sm:py-section">
      <h1 className="text-2xl font-bold sm:text-3xl">개인정보처리방침</h1>
      <div className="mt-6 space-y-4 text-[15px] text-ink/80">
        <p>
          수연음악학원(이하 &ldquo;학원&rdquo;)은 입시모의평가 접수 및 결과 제공을 위하여
          아래와 같이 개인정보를 수집·이용합니다.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink">1. 수집 항목</h2>
        <p>참가자명, 지도교수명, 전공, 지망학교, 참가곡명, ID, 비밀번호, 휴대폰번호, 이메일</p>
        <h2 className="pt-2 text-lg font-bold text-ink">2. 수집 목적</h2>
        <p>모의평가 접수·운영, 결과 및 안내서 제공, 회차 관련 안내 연락</p>
        <h2 className="pt-2 text-lg font-bold text-ink">3. 보유 기간</h2>
        <p>수집일로부터 1년 후 파기 (관계 법령에 따른 보존 필요 시 해당 기간 동안 보관)</p>
        <h2 className="pt-2 text-lg font-bold text-ink">4. 동의 거부 권리</h2>
        <p>동의를 거부할 수 있으나, 이 경우 모의평가 접수가 제한됩니다.</p>
        <p className="pt-4 text-sm text-ink/50">본 방침은 임시 문안이며 시행 전 법률 검토가 필요합니다.</p>
      </div>
    </article>
  );
}
