import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});

const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans.ttf",
  weight: "200 800",
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Operly | A calmer way to work", template: "%s | Operly" },
  description: "A thoughtful workspace for your projects, tasks, and team. Keep your everyday work moving with Operly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
