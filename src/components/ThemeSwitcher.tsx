"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { key: "brand", label: "Brand", swatch: "#eb0a6e" },
  { key: "sunset", label: "Sunset", swatch: "#f59e0b" },
  { key: "mono", label: "Mono", swatch: "#0a0a0a" },
] as const;

type ThemeKey = (typeof THEMES)[number]["key"];

function readStoredTheme(): ThemeKey {
  if (typeof window === "undefined") return "brand";
  const stored = window.localStorage.getItem("theme") as ThemeKey | null;
  return stored ?? "brand";
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeKey>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="fixed right-3 top-3 z-40 flex gap-1.5 rounded-full border border-brand-border bg-white/90 p-1.5 shadow-md backdrop-blur">
      {THEMES.map((t) => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key)}
          aria-label={`Switch to ${t.label} theme`}
          title={t.label}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            theme === t.key ? "scale-110 border-neutral-900" : "border-transparent"
          }`}
          style={{ backgroundColor: t.swatch }}
        />
      ))}
    </div>
  );
}
