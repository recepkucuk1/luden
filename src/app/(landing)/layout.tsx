"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Özellikler" },
  { href: "/#pricing", label: "Fiyatlandırma" },
  { href: "/#faq", label: "SSS" },
];

const FOOTER_LINKS = [
  { href: "/register", label: "Kayıt Ol" },
  { href: "/login", label: "Giriş Yap" },
  { href: "/#features", label: "Özellikler" },
  { href: "/#pricing", label: "Fiyatlandırma" },
  { href: "/#faq", label: "SSS" },
  { href: "/delivery-return", label: "Teslimat ve İade" },
  { href: "/privacy", label: "Gizlilik Politikası" },
  { href: "/cookie-policy", label: "Çerez Politikası" },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Header ── */}
      <header className={cn(
        "sticky top-0 z-40 px-6 transition-all duration-300 bg-[#023435]",
        scrolled ? "py-2 shadow-lg shadow-black/20" : "py-3"
      )}>
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="LudenLab"
              width={200}
              height={72}
              className={cn("w-auto brightness-0 invert transition-all duration-300", scrolled ? "h-12" : "h-16")}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#FE703A] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE703A]/90 transition-colors"
            >
              Ücretsiz Başla
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Menü"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col gap-1 pt-3 pb-2 border-t border-white/10 mt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="sm:hidden rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Giriş Yap
            </Link>
          </nav>
        )}
      </header>

      {/* ── Page Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#023435] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Sol: Logo + açıklama */}
            <div>
              <Image
                src="/logo.svg"
                alt="LudenLab"
                width={200}
                height={72}
                className="h-14 w-auto mb-3 brightness-0 invert"
              />
              <p className="text-xs text-white/60 leading-relaxed max-w-[200px]">
                Dil, konuşma ve işitme uzmanları için AI destekli öğrenme kartı platformu.
              </p>
            </div>

            {/* Orta: Linkler */}
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Platform</p>
              <ul className="grid grid-rows-4 grid-flow-col gap-x-4 gap-y-2">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sağ: İletişim */}
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">İletişim</p>
              <a
                href="mailto:info@ludenlab.com"
                className="text-sm text-white/60 hover:text-white transition-colors block mb-4"
              >
                info@ludenlab.com
              </a>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/ludenlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/ludenlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 py-4 border-t border-white/10 mt-10">
            <span className="text-xs text-white/40">Güvenli Ödeme</span>
            <Image
              src="/images/payment/logo_band_white.svg"
              alt="iyzico ile Öde - Visa, Mastercard, Troy"
              width={280}
              height={24}
              className="opacity-60 hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="pt-4 pb-2 text-center text-xs text-white/40">
            © {new Date().getFullYear()} LudenLab. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
