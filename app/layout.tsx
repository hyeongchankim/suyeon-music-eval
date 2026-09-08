import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "수연음악학원 입시모의평가",
  description:
    "입시 현장과 같은 환경에서 미리 평가받고, 솔직한 피드백으로 다음 무대를 준비하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
