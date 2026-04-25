import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const siteDescription =
  "進捗、レビュー、ファイルを一画面で追える初心者にも扱いやすい進捗管理ダッシュボードMVPです。";

export const metadata: Metadata = {
  metadataBase: new URL("https://pm.ymt-systems.com"),
  applicationName: "ClawBoard",
  title: {
    default: "ClawBoard | 進捗管理ダッシュボード",
    template: "%s | ClawBoard",
  },
  description: siteDescription,
  openGraph: {
    title: "ClawBoard",
    description: siteDescription,
    url: "/",
    siteName: "ClawBoard",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ClawBoard",
    description: siteDescription,
  },
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
