import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#04070c",
  viewportFit: "cover",
};
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANATOMY ARCADE",
  description: "Enter the body. Save the patient. Learn how it works. A playable 3D biology game: pilot a medical nano-robot through the human body and respond to biological emergencies.",
  keywords: ["anatomy", "biology game", "3D", "WebGL", "education", "heart", "science"],
  authors: [{ name: "Anatomy Arcade" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ANATOMY ARCADE",
    description:
      "Become a nano-robot, enter the human body, and complete medical missions while learning how your body works.",
    siteName: "Anatomy Arcade",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANATOMY ARCADE",
    description:
      "Become a nano-robot, enter the human body, and complete medical missions while learning how your body works.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
