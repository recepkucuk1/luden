"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
} from "@/lib/constants";

interface DashboardStats {
  students: number;
  cards: number;
  byCategory: Record<string, number>;
}

interface RecentCard {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  createdAt: string;
  student: { id: string; name: string } | null;
}

interface RecentStudent {
  id: string;
  name: string;
  workArea: string;
  createdAt: string;
  cardCount: number;
}

const CATEGORY_ITEMS = [
  { key: "speech", label: "Konuşma" },
  { key: "language", label: "Dil" },
  { key: "hearing", label: "İşitme" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCards, setRecentCards] = useState<RecentCard[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStats(data.stats);
        setRecentCards(data.recentCards);
        setRecentStudents(data.recentStudents);
      } catch (err) {
        console.error("Dashboard yüklenemedi:", err);
        toast.error("Veriler yüklenemedi, sayfayı yenileyin");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Genel Bakış</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
        </div>
      ) : (
        <>
          {/* İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
              <p className="text-xs text-zinc-400 mb-1">Toplam Öğrenci</p>
              <p className="text-3xl font-bold text-zinc-900">{stats?.students ?? 0}</p>
            </div>
            <div className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
              <p className="text-xs text-zinc-400 mb-1">Toplam Kart</p>
              <p className="text-3xl font-bold text-zinc-900">{stats?.cards ?? 0}</p>
            </div>
            {CATEGORY_ITEMS.map((cat) => (
              <div key={cat.key} className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
                <p className="text-xs text-zinc-400 mb-1">{cat.label}</p>
                <p className="text-3xl font-bold text-zinc-900">{stats?.byCategory[cat.key] ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Son Aktivite */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Son Kartlar */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Son Üretilen Kartlar</h2>
                <div className="flex items-center gap-3">
                  <Link href="/cards" className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline transition-colors">
                    Kart Kütüphanesi →
                  </Link>
                  <Link href="/generate" className="text-xs text-[#FE703A] hover:underline">
                    Yeni Kart Üret
                  </Link>
                </div>
              </div>
              {recentCards.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-zinc-400">Henüz kart üretilmedi</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recentCards.map((card) => (
                    <li key={card.id}>
                      <Link
                        href={`/cards/${card.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{card.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              className={WORK_AREA_COLOR[card.category] ?? "bg-zinc-100 text-zinc-600"}
                              style={{ fontSize: "10px" }}
                            >
                              {WORK_AREA_LABEL[card.category] ?? card.category}
                            </Badge>
                            <Badge
                              className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-zinc-100 text-zinc-600"}
                              style={{ fontSize: "10px" }}
                            >
                              {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                            </Badge>
                            {card.student && (
                              <span className="text-xs text-zinc-400">{card.student.name}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400 shrink-0">
                          {new Date(card.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Son Öğrenciler */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Son Eklenen Öğrenciler</h2>
                <Link href="/students" className="text-xs text-[#FE703A] hover:underline">
                  Tümünü Gör
                </Link>
              </div>
              {recentStudents.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-zinc-400">Henüz öğrenci eklenmedi</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recentStudents.map((student) => (
                    <li key={student.id}>
                      <Link
                        href={`/students/${student.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#023435]/10 text-[#023435] font-bold text-xs shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{student.name}</p>
                          <Badge
                            className={WORK_AREA_COLOR[student.workArea] ?? "bg-zinc-100 text-zinc-600"}
                            style={{ fontSize: "10px" }}
                          >
                            {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                          </Badge>
                        </div>
                        <span className="text-xs text-zinc-400 shrink-0">{student.cardCount} kart</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
