import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawBoard | 進捗管理ダッシュボード",
  description:
    "進捗、レビュー、ファイルを一画面で追える初心者にも扱いやすい進捗管理ダッシュボードMVPです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
