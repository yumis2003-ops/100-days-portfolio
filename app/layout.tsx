import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "100日チャレンジ | Webアプリ制作ポートフォリオ",
  description:
    "100日間で作ったWebアプリを一覧にまとめたポートフォリオ。カードをクリックすると実際に動くアプリが開きます。",
  openGraph: {
    title: "100日チャレンジ | Webアプリ制作ポートフォリオ",
    description: "100日間で作ったWebアプリの一覧。カードから実物に飛べます。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
