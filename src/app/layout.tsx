import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { connection } from "next/server";
import { getClock, isSimulate, simNow } from "@/lib/sim/state";

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
  title: "SwapCommunity",
  description: "SwapCommunity: give away and pick up items in your community.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Always render per request. Whether simulate mode is on is only known when the server runs,
  // not at build time, so a page pre-rendered during the build (such as /post) would otherwise
  // miss the simulated clock and the banner. Every other page is already per request anyway.
  await connection();

  // Simulate mode: give the browser the simulated clock, and show a banner so nobody mistakes
  // a simulated session for real data.
  let simClock: string | null = null;
  let simBanner: string | null = null;
  if (isSimulate()) {
    const clock = getClock();
    simClock = clock ? JSON.stringify(clock) : null;
    const speed = clock ? (clock.speed === 0 ? "frozen" : `x${clock.speed}`) : "real time";
    simBanner = `SIMULATE · ${simNow().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · ${speed}`;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {simClock && (
          <script dangerouslySetInnerHTML={{ __html: `window.__SIM_CLOCK = ${simClock};` }} />
        )}
      </head>
      <body className="min-h-full">
        {simBanner && (
          <a
            href="/sim"
            data-testid="sim-banner"
            className="block bg-amber-400 py-1 pl-3 pr-28 text-left text-xs font-bold text-black underline-offset-2 hover:underline"
          >
            {simBanner} · open controls
          </a>
        )}
        <div className="app-shell flex min-h-screen flex-col">
          <ThemeSwitcher />
          <div className="flex-1 pb-2">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
