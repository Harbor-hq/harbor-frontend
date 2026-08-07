import type { Metadata } from "next";
import localFont from "next/font/local";
import Nav from "@/components/Nav";
import EnvWarning from "@/components/EnvWarning";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Harbor — Payroll",
  description:
    "On-chain batch payroll for the hedegpay_batch Soroban contract",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 min-h-screen`}
      >
        <Nav />
        <EnvWarning />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
