"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, CheckCircle2, LayoutGrid, Flame } from "lucide-react";
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

interface WeeklyStats {
  studentsWorked: number;
  goalsCompleted: number;
  cardsCreated: number;
  streak: number;
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


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [recentCards, setRecentCards] = useState<RecentCard[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, weekRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/stats/weekly"),
        ]);
        const [dashData, weekData] = await Promise.all([dashRes.json(), weekRes.json()]);
        if (!dashRes.ok) throw new Error(dashData.error);
        setStats(dashData.stats);
        setRecentCards(dashData.recentCards);
        setRecentStudents(dashData.recentStudents);
        if (weekRes.ok) setWeekly(weekData);
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
              <p className="text-xs text-zinc-400 mb-1">Toplam Öğrenci</p>
              <p className="text-3xl font-bold text-zinc-900">{stats?.students ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
              <p className="text-xs text-zinc-400 mb-1">Toplam Kart</p>
              <p className="text-3xl font-bold text-zinc-900">{stats?.cards ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm border-l-4 border-l-[#FE703A]">
              <p className="text-xs text-zinc-400 mb-3">Alanlara Göre</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">🗣 Konuşma</span>
                  <span className="text-sm font-bold text-zinc-900">{stats?.byCategory.speech ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">💬 Dil</span>
                  <span className="text-sm font-bold text-zinc-900">{stats?.byCategory.language ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">👂 İşitme</span>
                  <span className="text-sm font-bold text-zinc-900">{stats?.byCategory.hearing ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bu Hafta */}
          <div>
            <h2 className="text-sm font-semibold text-[#023435] mb-3">Bu Hafta</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#023435]/10">
                    <Users className="h-4 w-4 text-[#023435]" />
                  </div>
                  <p className="text-xs text-zinc-500">Çalışılan Öğrenci</p>
                </div>
                <p className="text-2xl font-bold text-[#023435]">{weekly?.studentsWorked ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#023435]/10">
                    <CheckCircle2 className="h-4 w-4 text-[#023435]" />
                  </div>
                  <p className="text-xs text-zinc-500">Tamamlanan Hedef</p>
                </div>
                <p className="text-2xl font-bold text-[#023435]">{weekly?.goalsCompleted ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#023435]/10">
                    <LayoutGrid className="h-4 w-4 text-[#023435]" />
                  </div>
                  <p className="text-xs text-zinc-500">Üretilen Kart</p>
                </div>
                <p className="text-2xl font-bold text-[#023435]">{weekly?.cardsCreated ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FE703A]/10">
                    <Flame className="h-4 w-4 text-[#FE703A]" />
                  </div>
                  <p className="text-xs text-zinc-500">Günlük Seri</p>
                </div>
                <p className="text-2xl font-bold text-[#FE703A]">
                  {weekly ? `${weekly.streak} gün` : "—"}
                </p>
              </div>
            </div>
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
