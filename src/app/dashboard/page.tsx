"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
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
  const { data: session } = useSession();
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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                TM
              </div>
              <span className="text-base font-bold text-zinc-900">TerapiMat</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 ml-2">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/students"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Öğrenciler
              </Link>
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Kart Üret
              </Link>
            </nav>
          </div>

          {session?.user && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-800">{session.user.name}</p>
                <p className="text-xs text-zinc-400">{session.user.email}</p>
              </div>
              <Link
                href="/profile"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Profil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <h1 className="text-xl font-bold text-zinc-900">Genel Bakış</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-zinc-400 mb-1">Toplam Öğrenci</p>
                <p className="text-3xl font-bold text-zinc-900">{stats?.students ?? 0}</p>
              </div>
              <div className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-zinc-400 mb-1">Toplam Kart</p>
                <p className="text-3xl font-bold text-zinc-900">{stats?.cards ?? 0}</p>
              </div>
              {CATEGORY_ITEMS.map((cat) => (
                <div key={cat.key} className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
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
                  <Link href="/" className="text-xs text-blue-600 hover:underline">
                    Yeni Kart Üret
                  </Link>
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
                  <Link href="/students" className="text-xs text-blue-600 hover:underline">
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
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold text-xs shrink-0">
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
    </div>
  );
}
