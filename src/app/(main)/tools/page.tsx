"use client";

import Link from "next/link";
import { Wand2, ClipboardList, Gamepad2 } from "lucide-react";
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
  borderColor: string;
  items: ToolItem[];
}

const SECTIONS: ToolSection[] = [
  {
    title: "Üretici",
    Icon: Wand2,
    borderColor: "#107996",
    items: [
      { title: "Öğrenme Kartı", href: "/generate", desc: "Müfredat hedefine uygun öğrenme kartları", active: true },
      { title: "Sosyal Hikaye", href: "/tools/social-story", desc: "Carol Gray formatında sosyal hikayeler", active: true },
      { title: "Artikülasyon Alıştırması", href: "/tools/articulation", desc: "Hedef ses bazlı alıştırma kartları", active: true },
      { title: "Ev Ödevi Materyali", href: "/tools/homework", desc: "Veli yönlendirmeli ev egzersizleri", active: false },
    ],
  },
  {
    title: "Organizatörler",
    Icon: ClipboardList,
    borderColor: "#FE703A",
    items: [
      { title: "Haftalık Çalışma Planı", href: "/tools/weekly-plan", desc: "Öğrenci bazlı haftalık ders planı", active: false },
      { title: "Hedef Takip Tablosu", href: "/tools/goal-tracker", desc: "BEP hedeflerini görselleştirin", active: false },
      { title: "Oturum Özeti", href: "/tools/session-summary", desc: "Ders sonrası yapılandırılmış not", active: false },
    ],
  },
  {
    title: "Aktiviteler",
    Icon: Gamepad2,
    borderColor: "#F4AE10",
    items: [
      { title: "Kelime Eşleştirme", href: "/tools/matching-game", desc: "Kelime-tanım eşleştirme kartları", active: false },
      { title: "Sesletim Aktivitesi", href: "/tools/phonation", desc: "Oyunlaştırılmış ses çalışmaları", active: false },
      { title: "İletişim Panosu", href: "/tools/comm-board", desc: "Görsel iletişim panoları", active: false },
    ],
  },
];

function ToolCard({ item, borderColor }: { item: ToolItem; borderColor: string }) {
  const card = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow",
        item.active
          ? "hover:shadow-md cursor-pointer"
          : "opacity-50 pointer-events-none cursor-default"
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-800">{item.title}</span>
          {!item.active && (
            <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
              Yakında
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
      </div>
    </div>
  );

  if (!item.active) return card;
  return <Link href={item.href}>{card}</Link>;
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#023435]">Araçlar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Öğrencileriniz için kişiselleştirilmiş materyaller üretin.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section header */}
              <div className="mb-4 flex items-center gap-2">
                <section.Icon className="h-4 w-4 text-zinc-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {section.title}
                </h2>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <ToolCard key={item.href} item={item} borderColor={section.borderColor} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
