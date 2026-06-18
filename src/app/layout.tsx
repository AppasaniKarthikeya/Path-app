import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Path (पथ) — AI Career Guidance Mentor",
  description:
    "Your free AI career mentor. Get practical, honest guidance for your education and career in tech. Built by students, for students.",
  keywords: [
    "career guidance",
    "AI mentor",
    "software engineering",
    "tech career",
    "student guide",
    "career roadmap",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col bg-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
