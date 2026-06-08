import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SupplyFlow — Nhật-Việt ERP",
  description: "Hệ thống quản lý hàng hóa B2B Nhật-Việt",
  icons: {
    icon: "/logo-tt.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
