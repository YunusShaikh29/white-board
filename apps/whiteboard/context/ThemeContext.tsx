"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "rgb(24,24,27)" | "rgb(255,255,255)";

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("rgb(255,255,255)");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") as Theme;
    const savedIsDarkMode = localStorage.getItem("isDarkMode") === "true";
    if (savedTheme) {
      setTheme(savedTheme);
      setIsDarkMode(savedIsDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    const newTheme = newIsDarkMode ? "rgb(24,24,27)" : "rgb(255,255,255)";
    setIsDarkMode(newIsDarkMode);
    setTheme(newTheme);
    // Save to localStorage
    localStorage.setItem("theme", newTheme);
    localStorage.setItem("isDarkMode", String(newIsDarkMode));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
