import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const THEME_INIT_SCRIPT = `
  try {
    var t = window.localStorage.getItem("theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextHome",
  description: "A learning clone of NextHome's help-marketplace flow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <div className="app-shell flex min-h-screen flex-col">
          <ThemeSwitcher />
          <div className="flex-1 pb-2">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
