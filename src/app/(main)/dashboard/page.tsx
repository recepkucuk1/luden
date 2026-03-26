"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  CheckCircle2,
  LayoutGrid,
  Flame,
  Bell,
  Sun,
  Moon,
  User,
  TrendingUp,
  Activity,
  Package,
} from "lucide-react";
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
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Genel Bakış</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Luden paneline hoş geldiniz</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="relative p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <Link href="/profile" className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Toplam Öğrenci</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.students ?? 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 font-medium">Bu hafta {weekly?.studentsWorked ?? 0} aktif öğrenci</p>
        </div>
        
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <LayoutGrid className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Toplam Kart</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.cards ?? 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">Bu hafta {weekly?.cardsCreated ?? 0} yeni kart</p>
        </div>
        
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Tamamlanan Hedef</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{weekly?.goalsCompleted ?? 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">Bu hafta genel değerlendirme</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Günlük Seri</h3>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{weekly?.streak ?? 0}</p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">gün</p>
          </div>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">Çalışmaya devam et!</p>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm h-full max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Son Üretilen Kartlar</h3>
              <Link href="/cards" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Tümünü gör
              </Link>
            </div>
            
            {recentCards.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Henüz kart üretilmedi.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar flex-1">
                {recentCards.map((card, i) => (
                  <Link href={`/cards/${card.id}`} key={card.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                          className={WORK_AREA_COLOR[card.category] ?? "bg-gray-100 text-gray-600"}
                          style={{ fontSize: "10px", padding: '0 6px' }}
                        >
                          {WORK_AREA_LABEL[card.category] ?? card.category}
                        </Badge>
                        <Badge
                          className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-gray-100 text-gray-600"}
                          style={{ fontSize: "10px", padding: '0 6px' }}
                        >
                          {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                        </Badge>
                        {card.student && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate max-w-[100px] inline-block">{card.student.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(card.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats & Students */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Alan Dağılımı</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Konuşma
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.byCategory.speech ?? 0}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${stats && stats.students > 0 ? ((stats.byCategory.speech || 0) / stats.students) * 100 : 0}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span> Dil
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.byCategory.language ?? 0}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${stats && stats.students > 0 ? ((stats.byCategory.language || 0) / stats.students) * 100 : 0}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span> İşitme
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.byCategory.hearing ?? 0}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats && stats.students > 0 ? ((stats.byCategory.hearing || 0) / stats.students) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yeni Öğrenciler</h3>
              <Link href="/students" className="text-xs text-blue-600 hover:underline">
                Tümü
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Henüz eklenmedi</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.slice(0, 4).map((student, i) => (
                  <Link href={`/students/${student.id}`} key={student.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {student.cardCount} kart
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
