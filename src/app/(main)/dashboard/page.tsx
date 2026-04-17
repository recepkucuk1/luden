"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  CheckCircle2,
  LayoutGrid,
  Flame,
  User,
  TrendingUp,
  Package,
  Sparkles,
  Plus,
  ArrowRight,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { motion, useInView } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} saat önce`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Dün";
  if (diffD < 7) return `${diffD} gün önce`;
  return formatDate(d, "short");
}

// ─── CountUp Animation ───────────────────────────────────────────────────────
function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) { setCount(target); return; }
    const duration = 1200;
    const steps = 30;
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

  return <span ref={ref}>{count}</span>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Category Colors ─────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  speech:   { label: "Konuşma", color: "bg-[#023435]",  bg: "bg-[#023435]/10" },
  language: { label: "Dil",     color: "bg-[#FE703A]",  bg: "bg-[#FE703A]/10" },
  hearing:  { label: "İşitme",  color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  fluency:  { label: "Akıcılık", color: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  voice:    { label: "Ses",     color: "bg-pink-500",   bg: "bg-pink-50 dark:bg-pink-900/20" },
};

// ─── Dashboard Page ──────────────────────────────────────────────────────────
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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 flex flex-col items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  const isEmpty = (stats?.students ?? 0) === 0 && (stats?.cards ?? 0) === 0;

  // stats cards config
  const statCards = [
    {
      icon: Users,
      label: "Toplam Öğrenci",
      value: stats?.students ?? 0,
      sub: `Bu hafta ${weekly?.studentsWorked ?? 0} aktif öğrenci`,
      iconBg: "bg-[#023435]/10 dark:bg-[#023435]/30",
      iconColor: "text-[#023435] dark:text-emerald-400",
    },
    {
      icon: LayoutGrid,
      label: "Toplam Kart",
      value: stats?.cards ?? 0,
      sub: `Bu hafta ${weekly?.cardsCreated ?? 0} yeni kart`,
      iconBg: "bg-[#FE703A]/10 dark:bg-[#FE703A]/20",
      iconColor: "text-[#FE703A]",
    },
    {
      icon: CheckCircle2,
      label: "Tamamlanan Hedef",
      value: weekly?.goalsCompleted ?? 0,
      sub: "Bu hafta genel değerlendirme",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Flame,
      label: "Günlük Seri",
      value: weekly?.streak ?? 0,
      suffix: "gün",
      sub: "Çalışmaya devam et!",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  // dynamic category distribution — only show known therapy areas
  const KNOWN_CATEGORIES = new Set(Object.keys(CATEGORY_META));
  const categoryEntries = Object.entries(stats?.byCategory ?? {}).filter(
    ([key, v]) => v > 0 && KNOWN_CATEGORIES.has(key)
  );
  const totalCategoryItems = categoryEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Genel Bakış</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Luden paneline hoş geldiniz</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Action CTA */}
          <Link
            href="/generate"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#FE703A]/90 transition-all hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni Kart Üret</span>
          </Link>
          <Link
            href="/profile"
            className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.iconBg} transition-colors`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">{card.label}</h3>
            <div className="flex items-end gap-1.5">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                <CountUp target={card.value} />
              </p>
              {card.suffix && (
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{card.suffix}</p>
              )}
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left — Recent Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-2"
        >
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm h-full max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Son Üretilen Kartlar</h3>
              <Link href="/cards" className="text-sm text-[#FE703A] hover:text-[#FE703A]/80 font-medium transition-colors">
                Tümünü gör
              </Link>
            </div>

            {recentCards.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="h-12 w-12 rounded-xl bg-[#FE703A]/10 flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-[#FE703A]" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Henüz kart üretilmedi</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">AI ile saniyeler içinde ilk kartınızı oluşturun</p>
                <Link
                  href="/generate"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  İlk Kartı Üret
                </Link>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-2 no-scrollbar flex-1">
                {recentCards.map((card) => (
                  <Link
                    href={`/cards/${card.id}`}
                    key={card.id}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-800 group"
                  >
                    <div className="p-2 rounded-lg bg-[#023435]/10 dark:bg-[#023435]/30 group-hover:bg-[#023435] transition-colors">
                      <Package className="h-5 w-5 text-[#023435] dark:text-emerald-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                          className={WORK_AREA_COLOR[card.category] ?? "bg-gray-100 text-gray-600"}
                          style={{ fontSize: "10px", padding: "0 6px" }}
                        >
                          {WORK_AREA_LABEL[card.category] ?? card.category}
                        </Badge>
                        <Badge
                          className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-gray-100 text-gray-600"}
                          style={{ fontSize: "10px", padding: "0 6px" }}
                        >
                          {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                        </Badge>
                        {card.student && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate max-w-[100px] inline-block">
                            {card.student.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="h-3 w-3" />
                        {relativeTime(card.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right — Sidebar widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="space-y-6"
        >
          {/* Onboarding Widget (compact) */}
          {isEmpty && (
            <div className="rounded-xl border border-[#023435]/20 dark:border-[#023435]/40 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#023435] to-[#04595B] px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FE703A]" />
                <span className="text-sm font-semibold text-white">Başlangıç Adımları</span>
                <span className="ml-auto text-xs text-white/50">1/3</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { done: true, label: "Hesap oluştur", href: "" },
                  { done: (stats?.students ?? 0) > 0, label: "Öğrenci ekle", href: "/students" },
                  { done: (stats?.cards ?? 0) > 0, label: "Kart üret", href: "/generate" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        step.done
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm flex-1 ${step.done ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300 font-medium"}`}>
                      {step.label}
                    </span>
                    {!step.done && step.href && (
                      <Link href={step.href} className="text-[11px] font-semibold text-[#FE703A] hover:text-[#FE703A]/80 transition-colors">
                        Başla →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Distribution */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Alan Dağılımı</h3>
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Henüz veri yok</p>
            ) : (
              <div className="space-y-4">
                {categoryEntries.map(([key, value]) => {
                  const meta = CATEGORY_META[key] || { label: key, color: "bg-gray-500", bg: "bg-gray-100" };
                  const pct = totalCategoryItems > 0 ? (value / totalCategoryItems) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                          {meta.label}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                          className={`${meta.color} h-1.5 rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>Toplam</span>
                    <span className="font-semibold">{totalCategoryItems} kart</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Plan Mini Widget */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bugün</h3>
              <Link href="/calendar" className="text-xs text-[#FE703A] hover:text-[#FE703A]/80 font-medium transition-colors">
                Takvim
              </Link>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#023435]/5 dark:bg-[#023435]/20 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#023435]/10 dark:bg-[#023435]/30">
                <CalendarDays className="h-5 w-5 text-[#023435] dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(new Date(), "long")}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {weekly?.studentsWorked ?? 0} aktif öğrenci · {weekly?.cardsCreated ?? 0} kart üretildi
                </p>
              </div>
            </div>
            {/* Quick links */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/generate"
                className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-[#FE703A]/30 hover:text-[#FE703A] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Kart Üret
              </Link>
              <Link
                href="/students"
                className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-[#023435]/30 hover:text-[#023435] dark:hover:text-emerald-400 transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Öğrenciler
              </Link>
            </div>
          </div>

          {/* Recent Students */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yeni Öğrenciler</h3>
              <Link href="/students" className="text-xs text-[#FE703A] hover:text-[#FE703A]/80 font-medium transition-colors">
                Tümü
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <div className="flex flex-col items-center py-4">
                <p className="text-sm text-gray-400 text-center mb-3">Henüz eklenmedi</p>
                <Link
                  href="/students"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FE703A] hover:text-[#FE703A]/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Öğrenci Ekle
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentStudents.slice(0, 4).map((student) => (
                  <Link
                    href={`/students/${student.id}`}
                    key={student.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#023435]/10 dark:bg-[#023435]/30 text-[#023435] dark:text-emerald-400 font-bold text-xs shrink-0 group-hover:bg-[#023435] group-hover:text-white transition-colors">
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
        </motion.div>
      </div>
    </div>
  );
}
