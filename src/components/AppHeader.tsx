"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Öğrenciler" },
  { href: "/", label: "Kart Üret", exact: true },
];

export function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white px-6 py-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        {/* Sol: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
            TM
          </div>
          <span className="text-base font-bold text-zinc-900">TerapiMat</span>
        </Link>

        {/* Orta: Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sağ: Kullanıcı dropdown */}
        {session?.user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <span className="max-w-[120px] truncate">{session.user.name}</span>
              <svg
                className={cn(
                  "h-3.5 w-3.5 text-zinc-400 transition-transform duration-150",
                  open && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-zinc-200 bg-white shadow-lg py-1.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Profil
                </Link>
                <button
                  disabled
                  className="flex w-full items-center justify-between px-4 py-2 text-sm text-zinc-400 cursor-not-allowed"
                >
                  <span>Ayarlar</span>
                  <span className="text-xs text-zinc-300">Yakında</span>
                </button>
                <button
                  disabled
                  className="flex w-full items-center justify-between px-4 py-2 text-sm text-zinc-400 cursor-not-allowed"
                >
                  <span>Üyelik</span>
                  <span className="text-xs text-zinc-300">Yakında</span>
                </button>
                <button
                  disabled
                  className="flex w-full items-center justify-between px-4 py-2 text-sm text-zinc-400 cursor-not-allowed"
                >
                  <span>Kullanım</span>
                  <span className="text-xs text-zinc-300">Yakında</span>
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
