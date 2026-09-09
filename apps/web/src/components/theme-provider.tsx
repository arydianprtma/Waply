"use client";

import React, { createContext, useContext, useEffect } from "react";

type Theme = "light";

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
  useEffect(() => {
    // Enforce 100% Light Mode globally across all pages
    document.documentElement.setAttribute("data-theme", "waplyLight");
    document.documentElement.classList.remove("dark");

    // Clean up any old dark mode storage or cookies
    try {
      localStorage.removeItem("waply_theme");
      document.cookie = "waply_theme=light; path=/; max-age=31536000; SameSite=Lax";
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        isDark: false,
        toggleTheme: () => {},
        setTheme: () => {},
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
 * Inline script to prevent FOUC and enforce pure Waply Light theme
 */
export const themeInitScript = `
(function() {
  try {
    document.documentElement.setAttribute('data-theme', 'waplyLight');
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('waply_theme');
  } catch (e) {}
})();
`;

