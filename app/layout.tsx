import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawBoard | AI開発管制",
  description:
    "AIエージェントのWebワークツリー、プレビュー、PR、レビュー判断をブラウザで扱うノーコード開発管制MVPです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
