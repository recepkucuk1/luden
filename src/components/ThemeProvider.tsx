"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * 3-state theme provider backed by next-themes.
 *   - "light" / "dark" / "system"
 *   - class-based (.dark on <html>)
 *   - persisted via localStorage key `luden-theme`
 *   - disableTransitionOnChange: avoids color flicker on toggle
 *
 * FOUC is prevented by the inline script in `app/layout.tsx` (sets
 * .dark on <html> before React hydrates).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="luden-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
