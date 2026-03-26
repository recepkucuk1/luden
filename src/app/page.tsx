"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero-shadcnui";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";
import {
  IconSparkles,
  IconUsers,
  IconFileDownload,
  IconTarget,
  IconLock,
  IconBuilding,
} from "@tabler/icons-react";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Ücretsiz plan ne kadar süre geçerli?",
    a: "Ücretsiz plan süre sınırı olmaksızın kullanılabilir. 2 öğrenci ve 40 başlangıç kredisiyle başlamak için idealdir.",
  },
  {
    q: "Kredi sistemi nasıl çalışıyor?",
    a: "Her öğrenme kartı üretimi veya AI eğitim profili oluşturma 20 kredi harcar. Pro planda dönem başında 2.000, Advanced planda 10.000 kredi yüklenir.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Tüm veriler şifrelenmiş bağlantılar üzerinden aktarılır ve güvenli sunucularda saklanır. Öğrenci bilgileri yalnızca size aittir, üçüncü taraflarla paylaşılmaz.",
  },
  {
    q: "Kaç öğrenci ekleyebilirim?",
    a: "Ücretsiz planda 2 öğrenci, Pro planda 200 öğrenci ekleyebilirsiniz. Advanced ve Enterprise planlarda sınır yoktur.",
  },
  {
    q: "Fatura ve ödeme nasıl işliyor?",
    a: "Kredi kartı ve havale seçenekleriyle aylık veya yıllık abonelik alabilirsiniz. Yıllık abonelikte %15 indirim uygulanır.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-[#F4B2A6]/30 rounded-2xl border border-[#F4B2A6]/30 bg-white overflow-hidden">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-medium text-zinc-900 hover:bg-[#F4B2A6]/10 transition-colors"
          >
            <span>{item.q}</span>
            <svg
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-4",
                open === i && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <IconSparkles size={24} />,
    title: "AI Destekli Kart Üretimi",
    desc: "Claude AI ile saniyeler içinde öğrenciye özel, pedagojik açıdan zengin öğrenme kartları oluşturun.",
  },
  {
    icon: <IconUsers size={24} />,
    title: "Öğrenci Yönetimi",
    desc: "Tüm öğrencilerinizi tek yerden takip edin. Profil, tanı, yaş ve çalışma alanı bilgilerini kaydedin.",
  },
  {
    icon: <IconFileDownload size={24} />,
    title: "PDF İndirme",
    desc: "Oluşturduğunuz kartları profesyonel PDF formatında indirin, yazdırın ve seanslarınızda kullanın.",
  },
  {
    icon: <IconTarget size={24} />,
    title: "Kişiselleştirilebilir İçerik",
    desc: "Kategori, zorluk seviyesi ve yaş grubuna göre özelleştirilmiş kartlar üretin.",
  },
  {
    icon: <IconLock size={24} />,
    title: "Güvenli ve Özel",
    desc: "Verileriniz şifreli bağlantılar üzerinden aktarılır. Öğrenci bilgileri yalnızca size aittir.",
  },
  {
    icon: <IconBuilding size={24} />,
    title: "Çoklu Uzman Desteği",
    desc: "Kliniğinizdeki tüm terapistlerin ortak platform üzerinden çalışmasını sağlayın.",
    soon: true,
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────
const CREDIT_NOTE = "Her öğrenme kartı veya eğitim profili 20 kredi harcar. Krediler dönem başında yüklenir.";

const PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    period: "ay",
    description: "Başlamak için ideal",
    features: [
      "2 öğrenci",
      "40 başlangıç kredisi",
      "Kart üretimi: 20 kredi",
      "PDF indirme yok",
    ],
    buttonText: "Hemen Başla",
    href: "/register",
    isPopular: false,
  },
  {
    name: "Pro",
    price: 379,
    yearlyPrice: 3865.80,
    period: "ay",
    yearlyPeriod: "yıl",
    description: "Bireysel terapistler için",
    features: [
      "200 öğrenci",
      "2.000 kredi / dönem",
      "Kart üretimi: 20 kredi",
      "Eğitim profili: 20 kredi",
      "PDF indirme ✓",
    ],
    buttonText: "Satın Al",
    href: "/register",
    isPopular: true,
  },
  {
    name: "Advanced",
    price: 1499,
    yearlyPrice: 15289.80,
    period: "ay",
    yearlyPeriod: "yıl",
    description: "Yoğun çalışan uzmanlar için",
    features: [
      "Sınırsız öğrenci",
      "10.000 kredi / dönem",
      "Kart üretimi: 20 kredi",
      "Eğitim profili: 20 kredi",
      "PDF indirme ✓",
    ],
    buttonText: "Satın Al",
    href: "/register",
    isPopular: false,
  },
  {
    name: "Enterprise",
    price: null,
    yearlyPrice: null,
    period: "",
    description: "Klinikler ve kurumlar için",
    features: [
      "Sınırsız öğrenci",
      "Özel kredi paketi",
      "Tüm özellikler",
      "PDF indirme ✓",
      "Öncelikli destek",
    ],
    buttonText: "İletişime Geç",
    href: "mailto:merhaba@ludenlab.com",
    isPopular: false,
    customPriceLabel: "İletişim",
  },
];

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (status === "loading" || (status === "authenticated")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Header ── */}
      <header className={cn(
        "sticky top-0 z-40 px-6 py-3 transition-colors duration-300 bg-[#023435]",
        scrolled && "shadow-lg"
      )}>
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="LudenLab"
              width={120}
              height={44}
              className="h-9 w-auto brightness-0 invert"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#FE703A] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE703A]/90 transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <GlowyWavesHero />

      {/* ── Features ── */}
      <section id="features" className="bg-white">
        <div className="mx-auto max-w-5xl px-6 pt-20">
          <div className="text-center mb-0">
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">Her şey tek platformda</h2>
            <p className="text-sm text-zinc-500">Terapistlerin ihtiyaç duyduğu tüm araçlar, basit ve hızlı.</p>
          </div>
        </div>
        <FeaturesSectionWithHoverEffects features={FEATURES} />
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-zinc-50">
        <Pricing plans={PLANS} creditNote={CREDIT_NOTE} />
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-20 bg-[#F4B2A6]/10">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">Sık sorulan sorular</h2>
            <p className="text-sm text-zinc-500">Aklınızdaki soruların cevabı burada.</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#023435] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Sol: Logo + açıklama */}
            <div>
              <Image
                src="/logo.svg"
                alt="LudenLab"
                width={120}
                height={44}
                className="h-8 w-auto mb-3 brightness-0 invert"
              />
              <p className="text-xs text-white/60 leading-relaxed max-w-[200px]">
                Dil, konuşma ve işitme uzmanları için AI destekli öğrenme kartı platformu.
              </p>
            </div>

            {/* Orta: Linkler */}
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-4">Platform</p>
              <ul className="space-y-2">
                {[
                  { href: "#features", label: "Özellikler" },
                  { href: "#pricing", label: "Fiyatlandırma" },
                  { href: "#faq", label: "SSS" },
                  { href: "/login", label: "Giriş Yap" },
                  { href: "/register", label: "Kayıt Ol" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
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
                href="mailto:merhaba@ludenlab.com"
                className="text-sm text-white/60 hover:text-white transition-colors block mb-4"
              >
                merhaba@ludenlab.com
              </a>
              <div className="flex items-center gap-3">
                {/* Instagram */}
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
                {/* LinkedIn */}
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

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} LudenLab. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
