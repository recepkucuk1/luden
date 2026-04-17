import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Floating theme toggle — top-right on every auth page */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle
          variant="compact"
          className="bg-card/70 backdrop-blur-md border border-border/60 shadow-sm hover:bg-card"
        />
      </div>
      {children}
    </>
  );
}
