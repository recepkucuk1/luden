"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { motion, AnimatePresence, useInView } from "framer-motion";

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
    <div className="divide-y divide-[#F4B2A6]/30 rounded-2xl border border-[#F4B2A6]/30 bg-white overflow-hidden shadow-sm">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={cn(
              "flex w-full items-center justify-between px-6 py-5 text-left text-sm font-medium transition-colors",
              open === i ? "text-[#023435] bg-[#F4B2A6]/5" : "text-zinc-900 hover:bg-[#F4B2A6]/10"
            )}
          >
            <span className="flex items-center gap-3">
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300",
                open === i ? "bg-[#FE703A] text-white" : "bg-[#F4B2A6]/20 text-[#023435]/40"
              )}>{i + 1}</span>
              {item.q}
            </span>
            <motion.svg
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-4 w-4 text-zinc-400 shrink-0 ml-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key={`faq-${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 pl-[3.25rem] text-sm text-zinc-500 leading-relaxed">
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── How It Works — helper components ────────────────────────────────────────

function CarouselTag({ children, color }: {
  children: React.ReactNode;
  color: "blue" | "orange" | "green" | "yellow";
}) {
  const cls: Record<string, string> = {
    blue:   "bg-[rgba(16,121,150,0.1)] text-[#107996]",
    orange: "bg-[rgba(254,112,58,0.1)] text-[#FE703A]",
    green:  "bg-[rgba(2,52,53,0.1)] text-[#023435]",
    yellow: "bg-[rgba(244,174,16,0.15)] text-amber-800",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", cls[color])}>
      {children}
    </span>
  );
}

function MockDropdown({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[rgba(2,52,53,0.45)] mb-1">{label}</p>
      <div className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
        highlight
          ? "border-[#FE703A] bg-[#FE703A]/5 text-[#023435] font-medium"
          : "border-[rgba(2,52,53,0.12)] bg-[#f8fafa] text-[#023435]"
      )}>
        <span>{value}</span>
        <svg className="h-4 w-4 shrink-0 text-[#023435]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function MockPdfCard({ header, tags, rows, cta }: {
  header: string;
  tags: React.ReactNode;
  rows: { label: string; title?: string; body: string }[];
  cta: string;
}) {
  return (
    <div className="max-w-xl mx-auto rounded-xl border border-[rgba(2,52,53,0.12)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-[rgba(2,52,53,0.08)] px-5 py-3">
        <span className="font-bold text-[#023435]">Luden<span className="text-[#FE703A]">Lab</span></span>
        <span className="text-xs text-[rgba(2,52,53,0.4)]">{header}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-[rgba(2,52,53,0.06)]">{tags}</div>
      <div className="px-5 py-4 space-y-3">
        {rows.map((s) => (
          <div key={s.label}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#023435]/40 mb-1">{s.label}</p>
            {s.title && <p className="text-sm font-semibold text-[#023435] mb-0.5">{s.title}</p>}
            <p className="text-xs text-[rgba(2,52,53,0.6)] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(2,52,53,0.08)] px-5 py-3">
        <span className="text-[11px] text-[rgba(2,52,53,0.4)]">{cta}</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#107996]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PDF İndir
        </span>
      </div>
    </div>
  );
}

// ── ÖĞRENME KARTI slides ──────────────────────────────────────────────────────
function KartSlide1() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <MockDropdown label="Çalışma alanı" value="Dil — Söz Dönemi" highlight />
        <MockDropdown label="Yaş grubu" value="3-6 yaş" highlight />
        <MockDropdown label="Zorluk" value="Başlangıç" />
        <MockDropdown label="Tanı türü" value="Dil Gelişim Gecikmesi" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-xl bg-[#f0f7f7] border border-[rgba(2,52,53,0.1)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(2,52,53,0.45)] mb-3">Seçilen müfredat hedefi</p>
          <div className="space-y-2.5">
            {[
              { code: "2.2.1", title: "Dili anlar (tek sözcük → cümle düzeyi)", active: false },
              { code: "2.2.3", title: "Sözcük dağarcığını genişletir", active: true },
            ].map((g) => (
              <div key={g.code} className="flex items-start gap-2.5">
                <span className={cn("shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", g.active ? "bg-[#FE703A]/15 text-[#FE703A]" : "bg-[#023435]/10 text-[#023435]")}>✓</span>
                <span className="text-xs text-[rgba(2,52,53,0.65)]"><span className="font-semibold text-[#023435]">{g.code}</span><span className="ml-1.5">{g.title}</span></span>
              </div>
            ))}
          </div>
        </div>
        <Link href="/register" className="block w-full rounded-[9px] bg-[#FE703A] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors">
          ✦ Öğrenme Kartı Üret
        </Link>
      </div>
    </div>
  );
}
function KartSlide2() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="blue">Dil · Söz Dönemi</CarouselTag>
        <CarouselTag color="orange">3-6 yaş</CarouselTag>
        <CarouselTag color="green">Başlangıç</CarouselTag>
        <CarouselTag color="yellow">Dil Gelişim Gecikmesi</CarouselTag>
        <span className="inline-flex items-center rounded-full bg-[rgba(16,121,150,0.08)] border border-[#107996]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#107996]">Hedef 2.2.3</span>
      </div>
      <h3 className="text-lg font-bold text-[#023435]">Nesne Adlandırma Oyunu</h3>
      <p className="text-sm text-[rgba(2,52,53,0.65)] leading-relaxed">Uzman, günlük yaşamda sık kullanılan 5-8 nesneyi teker teker gösterir. Öğrenci her nesneyi adlandırmaya çalışır. Bilmediği nesnelerde uzman sözcüğü söyler, öğrenci tekrar eder.</p>
      <div className="space-y-2">
        {["Masaya 5 nesne koy, öğrencinin dikkatini çek","Her nesneyi göstererek \"Bu ne?\" diye sor","Yanıt 3 saniye içinde gelmezse model ol","Tüm nesneler tamamlanınca tekrar sıra yap"].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-[#023435] flex items-center justify-center text-[11px] font-bold text-white">{i + 1}</span>
            <span className="text-sm text-[rgba(2,52,53,0.7)] pt-0.5">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function KartSlide3() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl bg-[#fffaf7] px-4 py-3.5 border border-l-4 border-[rgba(254,112,58,0.2)] border-l-[#FE703A]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FE703A] mb-2">UZMAN NOTU</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Öğrencinin doğal ortamındaki nesnelerle başlayın — tanıdık nesneler daha hızlı dil kazanımı sağlar. Sözel ödül yerine içsel motivasyonu destekleyen geri bildirimler kullanın.</p>
        <p className="text-[11px] text-[rgba(2,52,53,0.4)] mt-2">Hedef 2.2.3 — Sözcük dağarcığını genişletir</p>
      </div>
      <div className="border-t border-[rgba(2,52,53,0.08)]" />
      <div className="rounded-xl bg-[#f0f7f7] border border-[rgba(16,121,150,0.15)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#107996] mb-2">GENELLEŞTİRME ÖNERİSİ</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Veliye aynı nesne listesini verin. Ev rutinleri sırasında (kahvaltı, banyo) aynı sözcükleri tekrar ettirmeleri sözcük yerleşimini 3-4 kat hızlandırır.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="green">İçsel motivasyon</CarouselTag>
        <CarouselTag color="blue">Oyun temelli</CarouselTag>
        <CarouselTag color="yellow">Genelleme odaklı</CarouselTag>
        <CarouselTag color="orange">Veli katılımı</CarouselTag>
      </div>
    </div>
  );
}
function KartSlide4() {
  return (
    <MockPdfCard
      header="Luden Özel Keşif · Mart 2026"
      tags={<><CarouselTag color="blue">Dil · Söz Dönemi</CarouselTag><CarouselTag color="orange">3-6 yaş</CarouselTag><CarouselTag color="green">Başlangıç</CarouselTag><span className="inline-flex items-center rounded-full bg-[rgba(16,121,150,0.08)] border border-[#107996]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#107996]">Hedef 2.2.3</span></>}
      rows={[
        { label: "ETKİNLİK", title: "Nesne Adlandırma Oyunu", body: "Günlük yaşam nesnelerini adlandırma ve sözcük dağarcığını genişletme çalışması" },
        { label: "UYGULAMA", body: "5 nesne masaya koy → \"Bu ne?\" sor → 3 sn içinde yanıt gelmezse model ol → tüm nesneler bitince tekrar sıra yap" },
        { label: "UZMAN NOTU", body: "Tanıdık nesnelerle başlayın. İçsel motivasyonu destekleyen geri bildirimler kullanın. Veliye nesne listesini verin." },
      ]}
      cta="MEB Talim Terbiye Kurulu müfredatına uygundur"
    />
  );
}

// ── ARTİKÜLASYON slides ───────────────────────────────────────────────────────
function ArtSlide1() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <MockDropdown label="Hedef fonem" value="/r/ — Akıcı ünsüz" highlight />
        <MockDropdown label="Konum" value="Sözcük başı" highlight />
        <MockDropdown label="Yaş grubu" value="6-9 yaş" />
        <MockDropdown label="Zorluk seviyesi" value="Orta" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-xl bg-[#f0f7f7] border border-[rgba(2,52,53,0.1)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(2,52,53,0.45)] mb-3">Önerilen egzersiz türleri</p>
          <div className="space-y-2.5">
            {[
              { label: "Yalıtılmış ses", active: true },
              { label: "Hece tekrarı (ra, re, ri…)", active: true },
              { label: "Sözcük düzeyinde", active: false },
            ].map((g) => (
              <div key={g.label} className="flex items-center gap-2.5">
                <span className={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", g.active ? "bg-[#FE703A]/15 text-[#FE703A]" : "bg-[#023435]/10 text-[#023435]/40")}>✓</span>
                <span className={cn("text-xs", g.active ? "text-[#023435]" : "text-[rgba(2,52,53,0.4)]")}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Link href="/register" className="block w-full rounded-[9px] bg-[#FE703A] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors">
          ✦ Artikülasyon Kartı Üret
        </Link>
      </div>
    </div>
  );
}
function ArtSlide2() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="blue">/r/ — Akıcı ünsüz</CarouselTag>
        <CarouselTag color="orange">Sözcük başı</CarouselTag>
        <CarouselTag color="green">6-9 yaş · Orta</CarouselTag>
      </div>
      <h3 className="text-lg font-bold text-[#023435]">/r/ Sesi Hece Tekrar Çalışması</h3>
      <p className="text-sm text-[rgba(2,52,53,0.65)] leading-relaxed">Ayna önünde dil pozisyonu gösterilerek /r/ sesinin yalıtılmış üretimi pekiştirilir; ardından ra-re-ri-ro-ru hece zinciri oluşturulur.</p>
      <div className="space-y-2">
        {[
          "Aynayı öğrencinin önüne koy, dil ucunun konumunu göster",
          "Tek başına /r/ sesini model ol, 5 kez tekrarlat",
          "\"Ra\" hecesiyle başla, ritimli şekilde ilerle",
          "Doğru üretimleri hemen pekiştir, hatalarda dil pozisyonuna dön",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-[#023435] flex items-center justify-center text-[11px] font-bold text-white">{i + 1}</span>
            <span className="text-sm text-[rgba(2,52,53,0.7)] pt-0.5">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function ArtSlide3() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl bg-[#fffaf7] px-4 py-3.5 border border-l-4 border-[rgba(254,112,58,0.2)] border-l-[#FE703A]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FE703A] mb-2">UZMAN NOTU</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Dil ucunu damağa değdirme egzersizini bağımsız yapabiliyorsa hece düzeyine geçin. Yorulma işareti görülürse seans süresini kısaltın; fazla tekrar kas gerginliğini artırır.</p>
        <p className="text-[11px] text-[rgba(2,52,53,0.4)] mt-2">/r/ · Sözcük başı pozisyon çalışması</p>
      </div>
      <div className="border-t border-[rgba(2,52,53,0.08)]" />
      <div className="rounded-xl bg-[#f0f7f7] border border-[rgba(16,121,150,0.15)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#107996] mb-2">GENELLEŞTİRME ÖNERİSİ</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Öğrenciye kısa bir sözcük listesi verin ("rüzgar, resim, renk"). Gün içinde bu sözcükleri bilinçli kullanmasını isteyin; aile de sessizce dinleyip geri bildirim versin.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="green">Motor planlama</CarouselTag>
        <CarouselTag color="blue">Ayna tekniği</CarouselTag>
        <CarouselTag color="orange">Hece zinciri</CarouselTag>
        <CarouselTag color="yellow">Ev genellemesi</CarouselTag>
      </div>
    </div>
  );
}
function ArtSlide4() {
  return (
    <MockPdfCard
      header="Artikülasyon Kartı · Mart 2026"
      tags={<><CarouselTag color="blue">/r/ Akıcı ünsüz</CarouselTag><CarouselTag color="orange">Sözcük başı</CarouselTag><CarouselTag color="green">6-9 yaş</CarouselTag></>}
      rows={[
        { label: "HEDEF SES", title: "/r/ — Hece Tekrar Çalışması", body: "Yalıtılmış /r/ üretiminden ra/re/ri/ro/ru hece zincirine geçiş" },
        { label: "UYGULAMA", body: "Ayna önünde dil pozisyonu göster → yalıtılmış ses × 5 → hece zinciri → doğru üretimleri anında pekiştir" },
        { label: "VELİ NOTU", body: "Günlük 5 dakika \"rüzgar, resim, renk\" sözcüklerini bilinçli kullandırın. Seans dışı pratik kalıcılığı artırır." },
      ]}
      cta="MEB Talim Terbiye Kurulu müfredatına uygundur"
    />
  );
}

// ── EV ÖDEVİ slides ───────────────────────────────────────────────────────────
function EvSlide1() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <MockDropdown label="Aktivite türü" value="Sözcük Eşleştirme" highlight />
        <MockDropdown label="Günlük süre" value="10 dakika" highlight />
        <MockDropdown label="Zorluk" value="Başlangıç" />
        <MockDropdown label="Hedef alan" value="Sözcük dağarcığı" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-xl bg-[#f0f7f7] border border-[rgba(2,52,53,0.1)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(2,52,53,0.45)] mb-3">Haftalık program</p>
          <div className="space-y-1.5">
            {["Pazartesi — Eşleştirme kartları","Çarşamba — Resim-sözcük oyunu","Cuma — Tekrar & değerlendirme"].map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[rgba(2,52,53,0.65)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE703A] shrink-0" />
                {d}
              </div>
            ))}
          </div>
        </div>
        <Link href="/register" className="block w-full rounded-[9px] bg-[#FE703A] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors">
          ✦ Ev Ödevi Oluştur
        </Link>
      </div>
    </div>
  );
}
function EvSlide2() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="blue">Sözcük Eşleştirme</CarouselTag>
        <CarouselTag color="orange">10 dk/gün</CarouselTag>
        <CarouselTag color="green">Başlangıç</CarouselTag>
      </div>
      <h3 className="text-lg font-bold text-[#023435]">Resim-Sözcük Eşleştirme Ödevi</h3>
      <p className="text-sm text-[rgba(2,52,53,0.65)] leading-relaxed">8 resim kartı ve yazılı sözcük etiketiyle eşleştirme yapılır. Öğrenci her resmi ilgili sözcükle eşleştirir, veli sonucu tabloya işler.</p>
      <div className="space-y-2">
        {[
          "8 resim kartını ve sözcük etiketlerini masa üzerine karışık yay",
          "Öğrenciden resimleri sözcükleriyle eşleştirmesini iste",
          "Her doğru eşleştirme için sözlü pekiştireç ver",
          "Sonuçları takip formuna işle, terapiste fotoğraf gönder",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-[#023435] flex items-center justify-center text-[11px] font-bold text-white">{i + 1}</span>
            <span className="text-sm text-[rgba(2,52,53,0.7)] pt-0.5">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function EvSlide3() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl bg-[#fffaf7] px-4 py-3.5 border border-l-4 border-[rgba(254,112,58,0.2)] border-l-[#FE703A]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FE703A] mb-2">VELİ TALİMATI</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Etkinliği her gün aynı saatte yapın — rutin öğrenmeyi kolaylaştırır. Öğrenci hata yaparsa sözcüğü siz söyleyin, onu tekrar ettirin; olumsuz geri bildirimden kaçının.</p>
      </div>
      <div className="border-t border-[rgba(2,52,53,0.08)]" />
      <div className="rounded-xl bg-[#f0f7f7] border border-[rgba(16,121,150,0.15)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#107996] mb-2">TERAPİST NOTU</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Veli takip formunu bir sonraki seansta getirsin. Hangi sözcüklerin güçlük çıkardığını görmek hedef güncellemesine yardımcı olur.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="green">Aile katılımı</CarouselTag>
        <CarouselTag color="blue">Günlük rutin</CarouselTag>
        <CarouselTag color="orange">Takip formu</CarouselTag>
        <CarouselTag color="yellow">Veli rehberi</CarouselTag>
      </div>
    </div>
  );
}
function EvSlide4() {
  return (
    <MockPdfCard
      header="Ev Ödevi · Mart 2026"
      tags={<><CarouselTag color="blue">Sözcük Eşleştirme</CarouselTag><CarouselTag color="orange">10 dk/gün</CarouselTag><CarouselTag color="green">Başlangıç</CarouselTag></>}
      rows={[
        { label: "ETKİNLİK", title: "Resim-Sözcük Eşleştirme", body: "8 resim kartını sözcük etiketleriyle eşleştirme çalışması — Pzt / Çrş / Cum" },
        { label: "VELİ TALİMATI", body: "Günde 10 dk, aynı saatte uygulayın. Hatada model olun, olumsuz geri bildirimden kaçının." },
        { label: "TAKİP", body: "Her seanstan önce formu doldurun ve terapiste fotoğraf gönderin." },
      ]}
      cta="Veliye teslim edilmek üzere hazırlanmıştır"
    />
  );
}

// ── SESLETİM slides ───────────────────────────────────────────────────────────
function SesSlide1() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <MockDropdown label="Ses grubu" value="Rezonans — Nazal" highlight />
        <MockDropdown label="Egzersiz türü" value="Nefes desteği" highlight />
        <MockDropdown label="Yaş grubu" value="9-14 yaş" />
        <MockDropdown label="Seviye" value="Orta" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-xl bg-[#f0f7f7] border border-[rgba(2,52,53,0.1)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(2,52,53,0.45)] mb-3">Seans hedefleri</p>
          <div className="space-y-2.5">
            {[
              { label: "Diyafragma nefesi yerleştirme", active: true },
              { label: "Rezonans farkındalığı", active: true },
              { label: "Nazal / oral ayrımı", active: false },
            ].map((g) => (
              <div key={g.label} className="flex items-center gap-2.5">
                <span className={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", g.active ? "bg-[#FE703A]/15 text-[#FE703A]" : "bg-[#023435]/10 text-[#023435]/40")}>✓</span>
                <span className={cn("text-xs", g.active ? "text-[#023435]" : "text-[rgba(2,52,53,0.4)]")}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Link href="/register" className="block w-full rounded-[9px] bg-[#FE703A] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors">
          ✦ Sesletim Kartı Üret
        </Link>
      </div>
    </div>
  );
}
function SesSlide2() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="blue">Rezonans · Nazal</CarouselTag>
        <CarouselTag color="orange">Nefes desteği</CarouselTag>
        <CarouselTag color="green">9-14 yaş · Orta</CarouselTag>
      </div>
      <h3 className="text-lg font-bold text-[#023435]">Diyafragma Nefesi + Rezonans Farkındalığı</h3>
      <p className="text-sm text-[rgba(2,52,53,0.65)] leading-relaxed">Derin diyafragma nefesi alışkanlığı yerleştirildikten sonra nazal titreşim farkındalığı "hmmm" tutma egzersizleriyle geliştirilir.</p>
      <div className="space-y-2">
        {[
          "Sırt düz otur, bir el göğse, bir el karına koy",
          "Burundan 4 say nefes al — karnın şişmeli, göğsün hareketsiz kalmalı",
          "\"Hmmm\" sesi çıkararak 5 saniye tut, titreşimi hisset",
          "Dudaklara dokunarak nazal rezonansı fark et",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-[#023435] flex items-center justify-center text-[11px] font-bold text-white">{i + 1}</span>
            <span className="text-sm text-[rgba(2,52,53,0.7)] pt-0.5">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SesSlide3() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl bg-[#fffaf7] px-4 py-3.5 border border-l-4 border-[rgba(254,112,58,0.2)] border-l-[#FE703A]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FE703A] mb-2">UZMAN NOTU</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Nefes egzersizlerini asla aç karnına yaptırmayın. Baş dönmesi olursa molaya geçin. Titreşim farkındalığını pekiştirmek için öğrencinin kendi alnına ya da elmacık kemiğine dokunmasını isteyin.</p>
      </div>
      <div className="border-t border-[rgba(2,52,53,0.08)]" />
      <div className="rounded-xl bg-[#f0f7f7] border border-[rgba(16,121,150,0.15)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#107996] mb-2">GENELLEŞTİRME</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Günlük 3 dakika sabah nefes rutini önerin. Öğrenci okul öncesi bu egzersizi yaparsa seans verimliliği belirgin biçimde artar.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="green">Diyafragma</CarouselTag>
        <CarouselTag color="blue">Rezonans</CarouselTag>
        <CarouselTag color="orange">Farkındalık</CarouselTag>
        <CarouselTag color="yellow">Sabah rutini</CarouselTag>
      </div>
    </div>
  );
}
function SesSlide4() {
  return (
    <MockPdfCard
      header="Sesletim Kartı · Mart 2026"
      tags={<><CarouselTag color="blue">Rezonans · Nazal</CarouselTag><CarouselTag color="orange">Nefes desteği</CarouselTag><CarouselTag color="green">9-14 yaş</CarouselTag></>}
      rows={[
        { label: "EGZERSIZ", title: "Diyafragma Nefesi + Rezonans Farkındalığı", body: "Karna nefes → \"Hmmm\" 5 sn tut → titreşimi hisset" },
        { label: "UYGULAMA", body: "Sırt düz otur → 4 sayı nefes al → Hmmm tut → dudak/elmacık temas kontrolü" },
        { label: "UZMAN NOTU", body: "Aç karnına yaptırmayın. Baş dönmesinde molaya geçin. Sabah 3 dk rutin önerin." },
      ]}
      cta="Ses terapisti gözetiminde uygulanmalıdır"
    />
  );
}

// ── HEDEF TAKİP slides ────────────────────────────────────────────────────────
function HedefSlide1() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <MockDropdown label="Öğrenci" value="Ahmet Y. — 7 yaş" highlight />
        <MockDropdown label="Hedef kodu" value="2.2.3 Sözcük dağarcığı" highlight />
        <MockDropdown label="Dönem" value="2025-2026 / 2. Dönem" />
        <MockDropdown label="Ölçüm birimi" value="% doğru yanıt" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-xl bg-[#f0f7f7] border border-[rgba(2,52,53,0.1)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(2,52,53,0.45)] mb-3">Başlangıç kriterleri</p>
          <div className="space-y-1.5">
            {["Başlangıç: %30 doğru yanıt","Kısa dönem hedef: %60","Uzun dönem hedef: %80"].map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[rgba(2,52,53,0.65)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#107996] shrink-0" />
                {d}
              </div>
            ))}
          </div>
        </div>
        <Link href="/register" className="block w-full rounded-[9px] bg-[#FE703A] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors">
          ✦ Hedef Tablosu Oluştur
        </Link>
      </div>
    </div>
  );
}
function HedefSlide2() {
  const rows = [
    { tarih: "10 Mar", oran: 32, not: "Başlangıç ölçümü" },
    { tarih: "17 Mar", oran: 45, not: "Nesne adlandırma" },
    { tarih: "24 Mar", oran: 58, not: "Resim kartları" },
    { tarih: "31 Mar", oran: 64, not: "Kısa dönem ✓" },
  ];
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="blue">Ahmet Y.</CarouselTag>
        <CarouselTag color="orange">Hedef 2.2.3</CarouselTag>
        <CarouselTag color="green">2. Dönem</CarouselTag>
      </div>
      <h3 className="text-lg font-bold text-[#023435]">İlerleme Tablosu — Sözcük Dağarcığı</h3>
      <div className="rounded-xl border border-[rgba(2,52,53,0.1)] overflow-hidden">
        <div className="grid grid-cols-3 bg-[#f0f7f7] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[rgba(2,52,53,0.45)]">
          <span>Tarih</span><span>Doğru %</span><span>Not</span>
        </div>
        {rows.map((r) => (
          <div key={r.tarih} className="grid grid-cols-3 px-4 py-2.5 text-xs text-[rgba(2,52,53,0.7)] border-t border-[rgba(2,52,53,0.06)] items-center">
            <span className="font-medium text-[#023435]">{r.tarih}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-[rgba(2,52,53,0.08)]">
                <div className="h-full rounded-full bg-[#FE703A]" style={{ width: `${r.oran}%` }} />
              </div>
              <span className="font-semibold text-[#FE703A] shrink-0">{r.oran}%</span>
            </div>
            <span>{r.not}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[rgba(2,52,53,0.5)]">Kısa dönem hedef (%60) 3. haftada aşıldı. Uzun dönem hedef: %80.</p>
    </div>
  );
}
function HedefSlide3() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl bg-[#fffaf7] px-4 py-3.5 border border-l-4 border-[rgba(254,112,58,0.2)] border-l-[#FE703A]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FE703A] mb-2">DÖNEM ANALİZİ</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Ahmet, 3 hafta içinde %30&rsquo;dan %64&rsquo;e ilerledi. Kısa dönem hedef aşıldı; uzun dönem hedef olan %80&rsquo;e ulaşmak için 2-3 seans daha gerekebilir. Nesne adlandırma aktiviteleri en yüksek kazanımı sağladı.</p>
      </div>
      <div className="border-t border-[rgba(2,52,53,0.08)]" />
      <div className="rounded-xl bg-[#f0f7f7] border border-[rgba(16,121,150,0.15)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#107996] mb-2">SONRAKİ ADIM ÖNERİSİ</p>
        <p className="text-sm text-[rgba(2,52,53,0.7)] leading-relaxed">Sözcük dağarcığını cümle düzeyine taşımak için 3.1.1 hedefine geçiş planlanabilir. Ev ödevi frekansını haftada 3&rsquo;ten 5&rsquo;e çıkarmak ilerlemeyi hızlandırır.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CarouselTag color="green">%34 ilerleme</CarouselTag>
        <CarouselTag color="blue">Hedef aşıldı</CarouselTag>
        <CarouselTag color="orange">Geçiş önerisi</CarouselTag>
        <CarouselTag color="yellow">3 hafta</CarouselTag>
      </div>
    </div>
  );
}
function HedefSlide4() {
  return (
    <MockPdfCard
      header="Dönem Raporu · Mart 2026"
      tags={<><CarouselTag color="blue">Ahmet Y. · 7 yaş</CarouselTag><CarouselTag color="orange">Hedef 2.2.3</CarouselTag><CarouselTag color="green">2. Dönem</CarouselTag></>}
      rows={[
        { label: "HEDEF", title: "Sözcük Dağarcığını Genişletir (2.2.3)", body: "Başlangıç: %30 · Kısa dönem: %60 · Uzun dönem: %80" },
        { label: "SONUÇ", body: "3 hafta içinde %64'e ulaşıldı. Kısa dönem hedef aşıldı. 2-3 seans içinde uzun dönem hedef beklenmektedir." },
        { label: "ÖNERİ", body: "Hedef 3.1.1'e geçiş planlanabilir. Ev ödevi frekansı artırılması önerilir." },
      ]}
      cta="Veli ve okul dosyasına eklenebilir"
    />
  );
}

// ── TOOLS config ──────────────────────────────────────────────────────────────
const TOOLS_CONFIG = [
  {
    id: "kart",
    label: "Öğrenme Kartı",
    icon: "🃏",
    headline: "Saniyeler içinde kişiselleştirilmiş kart",
    subtitle: "Alan, yaş grubu ve hedefi seçin — yapay zeka gerisini halleder",
    slides: [
      { title: "Parametreleri seç",   desc: "Alan, yaş grubu, tanı ve müfredat hedefini belirle", Panel: KartSlide1 },
      { title: "Kartı incele",        desc: "Yapay zeka MEB müfredatına uygun kart üretti",        Panel: KartSlide2 },
      { title: "Uzman notlarını gör", desc: "Uzman önerileri, genelleme ve veli notları eklendi",  Panel: KartSlide3 },
      { title: "PDF olarak indir",    desc: "Yazdırılabilir PDF — Pro plan ile indirilebilir",     Panel: KartSlide4 },
    ],
  },
  {
    id: "artikulasyon",
    label: "Artikülasyon",
    icon: "🗣️",
    headline: "Hedef foneme özel artikülasyon kartı",
    subtitle: "Sesi, konumu ve yaş grubunu seçin — egzersiz protokolü hazır",
    slides: [
      { title: "Fonem & konum seç",   desc: "Hedef ses, pozisyon ve yaş grubunu belirle",        Panel: ArtSlide1 },
      { title: "Egzersizi gör",       desc: "Adım adım artikülasyon protokolü oluşturuldu",       Panel: ArtSlide2 },
      { title: "Uzman ipuçları",      desc: "Motor planlama notları ve genelleme önerileri",       Panel: ArtSlide3 },
      { title: "PDF olarak indir",    desc: "Yazdırılabilir egzersiz kartı — Pro plan ile",        Panel: ArtSlide4 },
    ],
  },
  {
    id: "ev-odevi",
    label: "Ev Ödevi",
    icon: "📝",
    headline: "Veliye teslim edilmeye hazır ev ödevi",
    subtitle: "Aktivite türü ve hedefi seçin — veli rehberi otomatik oluşturulsun",
    slides: [
      { title: "Aktivite & süre seç", desc: "Ödev türünü, günlük süreyi ve hedef alanı belirle", Panel: EvSlide1 },
      { title: "Ödevi incele",        desc: "Adım adım uygulama talimatları hazırlandı",          Panel: EvSlide2 },
      { title: "Veli talimatları",    desc: "Veli rehberi ve terapist notları eklendi",            Panel: EvSlide3 },
      { title: "PDF olarak indir",    desc: "Veliye teslim hazır ödev formu — Pro plan ile",      Panel: EvSlide4 },
    ],
  },
  {
    id: "sesletim",
    label: "Sesletim",
    icon: "🎵",
    headline: "Nefes ve rezonans egzersiz kartı",
    subtitle: "Ses grubunu ve egzersiz türünü seçin — protokol saniyeler içinde hazır",
    slides: [
      { title: "Ses & egzersiz seç",  desc: "Ses grubunu, egzersiz türünü ve seviyeyi belirle",  Panel: SesSlide1 },
      { title: "Protokolü gör",       desc: "Adım adım sesletim egzersiz protokolü oluşturuldu", Panel: SesSlide2 },
      { title: "Terapi ipuçları",     desc: "Uzman notları ve genelleme önerileri eklendi",       Panel: SesSlide3 },
      { title: "PDF olarak indir",    desc: "Yazdırılabilir sesletim kartı — Pro plan ile",       Panel: SesSlide4 },
    ],
  },
  {
    id: "hedef",
    label: "Hedef Takip",
    icon: "📊",
    headline: "Dönem boyunca hedef takip tablosu",
    subtitle: "Öğrenci ve hedef kodunu seçin — ilerleme tablosu ve rapor hazır",
    slides: [
      { title: "Öğrenci & hedef seç", desc: "Öğrenci, hedef kodu ve dönem bilgisini gir",        Panel: HedefSlide1 },
      { title: "Tabloyu gör",         desc: "İlerleme verileri tabloda görselleştirildi",         Panel: HedefSlide2 },
      { title: "Analiz & öneriler",   desc: "Dönem analizi ve sonraki adım önerileri oluşturuldu",Panel: HedefSlide3 },
      { title: "Rapor olarak indir",  desc: "Veli ve okul dosyasına eklenebilir rapor",           Panel: HedefSlide4 },
    ],
  },
];

function HowItWorksCarousel() {
  const [activeTool, setActiveTool] = useState(0);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const currentTool = TOOLS_CONFIG[activeTool];
  const slides = currentTool.slides;
  const count = slides.length;

  const switchTool = (i: number) => {
    setActiveTool(i);
    setActive(0);
    setDirection(1);
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setDirection(1);
      setActive((p) => (p + 1) % count);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, count, activeTool]);

  const goTo = (i: number) => {
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const { Panel } = slides[active];

  return (
    <section ref={sectionRef} className="py-20 px-6" style={{ background: "#f8fafa" }}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#FE703A] mb-3">NASIL ÇALIŞIR</p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={`h-${activeTool}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-bold text-[#023435] mb-2"
            >
              {currentTool.headline}
            </motion.h2>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`p-${activeTool}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-[rgba(2,52,53,0.5)]"
            >
              {currentTool.subtitle}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Tool tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {TOOLS_CONFIG.map((tool, i) => (
            <button
              key={tool.id}
              onClick={() => switchTool(i)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                i === activeTool
                  ? "bg-[#023435] text-white shadow-sm"
                  : "border border-[rgba(2,52,53,0.12)] bg-white text-[#023435]/60 hover:bg-white hover:text-[#023435] hover:border-[rgba(2,52,53,0.25)]"
              )}
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </motion.div>

        <div className="flex gap-6">
          {/* Left — Step indicators */}
          <div className="hidden md:flex flex-col gap-2 pt-4 shrink-0 w-48">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-300",
                  i === active
                    ? "bg-white shadow-sm border border-[rgba(2,52,53,0.1)]"
                    : "hover:bg-white/60"
                )}
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-300",
                  i === active
                    ? "bg-[#FE703A] text-white"
                    : "bg-[rgba(2,52,53,0.08)] text-[#023435]/40"
                )}>{i + 1}</span>
                <div>
                  <p className={cn(
                    "text-xs font-semibold transition-colors duration-300",
                    i === active ? "text-[#023435]" : "text-[#023435]/50"
                  )}>{slide.title}</p>
                  <p className={cn(
                    "text-[11px] mt-0.5 leading-snug transition-colors duration-300",
                    i === active ? "text-[rgba(2,52,53,0.55)]" : "text-[rgba(2,52,53,0.3)]"
                  )}>{slide.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right — Slide panel */}
          <div
            className="relative flex-1 bg-white rounded-2xl border border-[rgba(2,52,53,0.1)] shadow-sm overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[rgba(2,52,53,0.06)] z-10">
              <motion.div
                className="h-full bg-[#FE703A]"
                animate={{ width: `${((active + 1) / count) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Animated slide */}
            <div className="px-7 pt-8 pb-4 md:px-10 md:pt-10 min-h-[420px] md:min-h-[480px] flex flex-col justify-start overflow-y-auto relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${activeTool}-${active}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <Panel />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom bar — mobile nav */}
            <div className="flex items-end justify-between gap-4 px-7 pb-6 md:px-10 md:pb-8">
              <div className="md:hidden">
                <p className="text-sm font-semibold text-[#023435]">{slides[active].title}</p>
                <p className="text-xs text-[rgba(2,52,53,0.45)] mt-0.5">{slides[active].desc}</p>
              </div>
              <div className="hidden md:block" />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setDirection(-1); setActive((a) => (a - 1 + count) % count); }}
                  className="h-8 w-8 rounded-[9px] bg-white border border-[rgba(2,52,53,0.2)] flex items-center justify-center text-[#023435]/50 hover:bg-[#023435] hover:text-white hover:border-[#023435] transition-colors"
                  aria-label="Önceki"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === active ? "w-6 bg-[#FE703A]" : "w-2 bg-[rgba(2,52,53,0.2)] hover:bg-[rgba(2,52,53,0.4)]"
                    )}
                    aria-label={`Slayt ${i + 1}`}
                  />
                ))}
                <button
                  onClick={() => { setDirection(1); setActive((a) => (a + 1) % count); }}
                  className="h-8 w-8 rounded-[9px] bg-white border border-[rgba(2,52,53,0.2)] flex items-center justify-center text-[#023435]/50 hover:bg-[#023435] hover:text-white hover:border-[#023435] transition-colors"
                  aria-label="Sonraki"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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

// ─── Features Section (Bento Grid) ───────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="features" className="bg-white py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#FE703A] mb-3">ÖZELLİKLER</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Her şey tek platformda</h2>
          <p className="text-sm text-zinc-500">Terapistlerin ihtiyaç duyduğu tüm araçlar, basit ve hızlı.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "group relative rounded-2xl border border-zinc-100 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#FE703A]/5 hover:border-[#FE703A]/20",
                // First two cards span wider on large screens
                i < 2 && "lg:col-span-1",
              )}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FE703A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FE703A]/10 text-[#FE703A] group-hover:bg-[#FE703A] group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-zinc-900">{feature.title}</h3>
                  {feature.soon && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      Yakında
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────
function FaqSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="faq" className="px-6 py-20 bg-[#F4B2A6]/10">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#FE703A] mb-3">SSS</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Sık sorulan sorular</h2>
          <p className="text-sm text-zinc-500">Aklınızdaki soruların cevabı burada.</p>
        </motion.div>
        <FaqAccordion />

        {/* CTA below FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 rounded-2xl bg-white border border-[#F4B2A6]/30 p-6 text-center shadow-sm"
        >
          <p className="text-sm font-medium text-zinc-700 mb-1">Sorunuzu bulamadınız mı?</p>
          <p className="text-xs text-zinc-400 mb-4">Bize yazın, en kısa sürede yanıt verelim.</p>
          <a
            href="mailto:merhaba@ludenlab.com"
            className="inline-flex items-center gap-2 rounded-xl bg-[#023435] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#023435]/90 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Bize Yazın
          </a>
        </motion.div>
      </div>
    </section>
  );
}

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
// ─── Social Proof Band ────────────────────────────────────────────────────────
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString("tr-TR")}{suffix}</span>;
}

function SocialProofBand() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const stats = [
    { value: 500, suffix: "+", label: "Aktif Uzman" },
    { value: 12000, suffix: "+", label: "Üretilen Kart" },
    { value: 98, suffix: "%", label: "Memnuniyet" },
    { value: 50, suffix: "+", label: "Klinik" },
  ];

  return (
    <section ref={ref} className="relative bg-[#023435] border-t border-white/5">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl md:text-3xl font-bold text-white">
                <CountUp target={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-xs text-white/50 mt-1 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_LINKS = [
    { href: "#features", label: "Özellikler" },
    { href: "#pricing", label: "Fiyatlandırma" },
    { href: "#faq", label: "SSS" },
  ];

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
            {/* Mobile hamburger */}
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

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden"
            >
              <nav className="flex flex-col gap-1 pt-3 pb-2 border-t border-white/10 mt-3">
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
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <GlowyWavesHero />

      {/* ── Social Proof ── */}
      <SocialProofBand />

      {/* ── How It Works ── */}
      <HowItWorksCarousel />

      {/* ── Features ── */}
      <FeaturesSection />

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-zinc-50">
        <Pricing plans={PLANS} creditNote={CREDIT_NOTE} />
        <div className="flex flex-col items-center gap-2 mt-8 pb-10">
          <p className="text-sm text-[#023435]/50">
            Tüm ödemeler iyzico güvencesiyle gerçekleştirilir.
          </p>
          <Image
            src="/images/payment/logo_band_white.svg"
            alt="iyzico ile Öde - Visa, Mastercard, Troy"
            width={240}
            height={20}
            className="opacity-40 invert"
          />
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

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
                {[
                  { href: "/register", label: "Kayıt Ol" },
                  { href: "/login", label: "Giriş Yap" },
                  { href: "#features", label: "Özellikler" },
                  { href: "#pricing", label: "Fiyatlandırma" },
                  { href: "#faq", label: "SSS" },
                  { href: "/delivery-return", label: "Teslimat ve İade" },
                  { href: "/privacy", label: "Gizlilik Politikası" },
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
