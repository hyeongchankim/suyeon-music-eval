import type { Config } from "tailwindcss";

/**
 * 3. 디자인 컨셉 "Clean Studio" — 디자인 토큰
 * 4. 반응형 가이드 — Breakpoints: 모바일 ~639 / 태블릿 640~1023 / 데스크톱 1024~
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px", // 태블릿
      lg: "1024px", // 데스크톱
    },
    extend: {
      colors: {
        bg: "#FFFFFF",
        surface: "#F7F8FA",
        ink: "#1A1D29",
        line: "#E7E9EE",
        primary: { DEFAULT: "#22335F" },
        accent: { DEFAULT: "#14B8A6" },
        coral: { DEFAULT: "#FF7A59" },
      },
      fontFamily: {
        sans: ["Pretendard", "Pretendard Variable", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        btn: "10px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(20,30,50,0.06)",
      },
      spacing: {
        section: "80px", // PC 섹션 간 여백
        "section-m": "48px", // 모바일 섹션 간 여백
      },
      maxWidth: {
        form: "720px", // 신청서 카드 폭
        content: "1120px",
      },
    },
  },
  plugins: [],
};
export default config;
