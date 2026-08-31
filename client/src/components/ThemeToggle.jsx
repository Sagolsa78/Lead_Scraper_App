import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all duration-300 text-xs font-bold shadow-xs cursor-pointer"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;

