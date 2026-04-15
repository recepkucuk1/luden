"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2, ClipboardList, Gamepad2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolItem {
  title: string;
  href: string;
  desc: string;
  active: boolean;
}

interface ToolSection {
  title: string;
  Icon: React.ElementType;
  color: string;
  items: ToolItem[];
}

const SECTIONS: ToolSection[] = [
  {
    title: "Üretici",
    Icon: Wand2,
    color: "#107996",
    items: [
      { title: "Öğrenme Kartı", href: "/generate", desc: "Müfredat hedefine uygun öğrenme kartları", active: true },
      { title: "Sosyal Hikaye", href: "/tools/social-story", desc: "Carol Gray formatında sosyal hikayeler", active: true },
      { title: "Artikülasyon Alıştırması", href: "/tools/articulation", desc: "Hedef ses bazlı alıştırma kartları", active: true },
      { title: "Ev Ödevi Materyali", href: "/tools/homework", desc: "Veli yönlendirmeli ev egzersizleri", active: true },
    ],
  },
  {
    title: "Organizatör",
    Icon: ClipboardList,
    color: "#FE703A",
    items: [
      { title: "Haftalık Çalışma Planı", href: "/tools/weekly-plan", desc: "Öğrenci bazlı haftalık ders planı", active: true  },
      { title: "Hedef Takip Tablosu", href: "/tools/goal-tracker", desc: "BEP hedeflerini görselleştirin", active: true },
      { title: "Oturum Özeti", href: "/tools/session-summary", desc: "Ders sonrası yapılandırılmış not", active: true },
    ],
  },
  {
    title: "Aktiviteler",
    Icon: Gamepad2,
    color: "#F4AE10",
    items: [
      { title: "Kelime Eşleştirme", href: "/tools/matching-game", desc: "Kelime-tanım eşleştirme kartları", active: true },
      { title: "Sesletim", href: "/tools/phonation", desc: "Oyunlaştırılmış ses çalışmaları", active: true },
      { title: "İletişim Panosu", href: "/tools/comm-board", desc: "Görsel iletişim panoları", active: true  },
    ],
  },
];

const TABS = ["Tümü", ...SECTIONS.map((s) => s.title)];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ToolCard({ item, section }: { item: ToolItem; section: ToolSection }) {
  const { color } = section;
  
  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-4 transition-all duration-300",
        item.active 
          ? "bg-white/60 dark:bg-gray-800/60 border-white/80 dark:border-gray-700/80 shadow-[0_4px_24px_rgba(2,52,53,0.03)] hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)] hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-gray-700/80" 
          : "bg-[rgba(255,255,255,0.4)] dark:bg-gray-800/30 border-white/30 dark:border-gray-700/30 cursor-not-allowed grayscale-[0.2]"
      )}
      style={{
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Glow Effect / Accent Line on Top */}
      {item.active && (
        <div 
          className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} 
        />
      )}

      {/* Background Decorator for Inactive */}
      {!item.active && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)" }}></div>
      )}
      
      <div className="relative z-10 flex items-start gap-3 mb-2">
        {/* Icon Container */}
        <div 
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-300 group-hover:scale-110"
          style={{ 
            backgroundColor: item.active ? hexToRgba(color, 0.1) : "rgba(100,116,139,0.1)",
            color: item.active ? color : "rgba(100,116,139,0.5)"
          }}
        >
          <section.Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        
        <div className="flex-1 mt-0.5">
          <div className="flex items-center justify-between gap-1">
            <h3 className={cn("text-[14px] leading-tight font-bold tracking-tight", item.active ? "text-[#023435] dark:text-gray-100" : "text-[#023435]/50 dark:text-gray-500")}>
              {item.title}
            </h3>
            {!item.active && (
              <span className="shrink-0 rounded-full bg-[#023435]/5 dark:bg-gray-800 px-2 py-0.5 text-[9px] font-bold text-[#023435]/40 dark:text-gray-500 tracking-wide uppercase border border-[#023435]/5 dark:border-gray-700">
                Yakında
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <p className={cn("text-[12px] leading-snug", item.active ? "text-[#023435]/60 dark:text-gray-400" : "text-[#023435]/40 dark:text-gray-600")}>
          {item.desc}
        </p>
      </div>
      
      {/* Decorative Blur for Active Items */}
      {item.active && (
        <div 
          className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-[0.15]" 
          style={{ backgroundColor: color }} 
        />
      )}
    </div>
  );

  if (!item.active) return content;
  return <Link href={item.href} className="block outline-none focus:ring-4 focus:ring-[#FE703A]/20 rounded-[24px]">{content}</Link>;
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("Tümü");

  const filteredSections = SECTIONS.filter(
    (s) => activeTab === "Tümü" || s.title === activeTab
  );

  return (
    <div 
      className="min-h-full flex-1 w-full flex flex-col relative overflow-y-auto custom-scrollbar dark:bg-gray-900"
      style={{ background: "linear-gradient(135deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%)" }}
    >
      <style jsx>{`
        div {
          --bg-start: #f0f7f7;
          --bg-mid: #e8f4f4;
          --bg-end: #f5fafa;
        }
        :global(.dark) div {
          --bg-start: #111827;
          --bg-mid: #111827;
          --bg-end: #111827;
        }
      `}</style>
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#107996]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#FE703A]/5 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="mx-auto w-full max-w-[1200px] px-6 py-6 pb-12 relative z-10 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-white/60 dark:bg-zinc-800/60 border border-[rgba(2,52,53,0.1)] dark:border-white/10 text-[#FE703A] text-[10px] font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3 h-3" /> Devamlı Gelişen Koleksiyon
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#023435] dark:text-zinc-100 tracking-tight">
              Terapist Araçları
            </h1>
            <p className="mt-1 text-[13px] sm:text-sm text-[#023435]/60 dark:text-zinc-400 max-w-xl">
              Seanslarınızı daha verimli hale getirin. Materyal üretin, plan yapın ve izleyin.
            </p>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6 w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex p-1.5 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-gray-700/60 shadow-[0_2px_12px_rgba(2,52,53,0.03)] backdrop-blur-md w-full sm:w-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 outline-none flex-1 sm:flex-none whitespace-nowrap",
                    isActive 
                      ? "text-white dark:text-gray-100 shadow-md shadow-[#023435]/10 dark:shadow-black/20" 
                      : "text-[#023435]/50 dark:text-gray-400 hover:text-[#023435] dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50"
                  )}
                >
                  {isActive && (
                    <span 
                      className="absolute inset-0 rounded-xl bg-[#023435] dark:bg-gray-700" 
                      style={{ 
                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 12px rgba(2,52,53,0.15)"
                      }} 
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.title} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {/* Section Header */}
              {(activeTab === "Tümü") && (
                <div className="mb-3 flex items-center gap-2">
                  <div 
                    className="flex h-7 w-7 items-center justify-center rounded-[8px]" 
                    style={{ backgroundColor: hexToRgba(section.color, 0.1), color: section.color }}
                  >
                    <section.Icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#023435] dark:text-zinc-100">
                    {section.title}
                  </h2>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {section.items.map((item) => (
                  <ToolCard key={item.title} item={item} section={section} />
                ))}
              </div>
            </div>
          ))}

          {/* Empty State Fallback */}
          {filteredSections.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="h-16 w-16 mb-4 rounded-3xl bg-white/60 dark:bg-gray-800/60 flex items-center justify-center text-[#023435]/20 dark:text-gray-500 shadow-sm border border-white dark:border-gray-700">
                 <Wand2 className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-bold text-[#023435] dark:text-gray-100">Bu kategoride henüz araç yok</h3>
               <p className="mt-1 text-sm text-[#023435]/50 dark:text-gray-400">Yakında yeni materyaller eklenecektir.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
