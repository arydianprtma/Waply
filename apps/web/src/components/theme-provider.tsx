"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("light");
  const isAppRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  const applyTheme = (nextTheme: Theme, forceLight = false) => {
    if (forceLight) {
      document.documentElement.setAttribute("data-theme", "sendoraLight");
      document.documentElement.classList.remove("dark");
      return;
    }

    const dataTheme = nextTheme === "dark" ? "sendoraDark" : "sendoraLight";
    document.documentElement.setAttribute("data-theme", dataTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (!isAppRoute) {
      // Landing, Login, Register, Public pages: Always default to light mode
      applyTheme("light", true);
      return;
    }

    // Inside Dashboard & Admin: Load user's saved preference
    const saved = localStorage.getItem("sendora_theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      const initial: Theme = "light";
      setThemeState(initial);
      applyTheme(initial);
    }
  }, [pathname, isAppRoute]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    if (isAppRoute) {
      applyTheme(nextTheme);
    }
    try {
      localStorage.setItem("sendora_theme", nextTheme);
      document.cookie = `sendora_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: isAppRoute && theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Inline script to prevent FOUC (Flash of unstyled content) on initial page load
 * Only applies dark mode if entering /dashboard or /admin
 */
export const themeInitScript = `
(function() {
  try {
    var path = window.location.pathname || '';
    var isApp = path.indexOf('/dashboard') === 0 || path.indexOf('/admin') === 0;
    if (isApp) {
      var saved = localStorage.getItem('sendora_theme');
      var isDark = saved === 'dark';
      var themeName = isDark ? 'sendoraDark' : 'sendoraLight';
      document.documentElement.setAttribute('data-theme', themeName);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'sendoraLight');
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;
