import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "K-복지 스마트 포털 | 지능형 통합 복지행정 자동화 시스템",
  description: "국군복지단 행정 신뢰도 제고를 위한 지능형 통합 복지행정 자동화 시스템 — 기숙사 자동 배정 & 입찰 적격심사 엔진",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
