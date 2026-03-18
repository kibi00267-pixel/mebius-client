import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WakiVerse - テスト作成プラットフォーム",
  description: "次世代教育テスト作成システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-slate-950 text-white" style={{ fontFamily: "'Yu Gothic', 'Hiragino Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
