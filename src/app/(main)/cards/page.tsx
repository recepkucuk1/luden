"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
import { SwipeableCard } from "@/components/SwipeableCard";
import { cn } from "@/lib/utils";
import {
  WORK_AREA_COLOR,
  WORK_AREA_LABEL,
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
  AGE_LABEL,
} from "@/lib/constants";

interface CardItem {
  id: string;
  title: string;
  category: string;
  toolType: string | null;
  difficulty: string;
  ageGroup: string;
  createdAt: string;
  curriculumGoalIds: string[];
  student: { id: string; name: string } | null;
  _count: { assignments: number };
}

type ToolTypeFilter = "all" | "learning" | "social_story" | "articulation";

const TOOL_TYPE_OPTIONS: { value: ToolTypeFilter; label: string; href?: string }[] = [
  { value: "all",          label: "Tümü" },
  { value: "learning",     label: "Öğrenme Kartı",     href: "/generate" },
  { value: "social_story", label: "Sosyal Hikaye",     href: "/tools/social-story" },
  { value: "articulation", label: "Artikülasyon",      href: "/tools/articulation" },
];

const TOOL_TYPE_BADGE: Record<string, string> = {
  LEARNING_CARD:      "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  SOCIAL_STORY:       "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  ARTICULATION_DRILL: "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
};

const TOOL_TYPE_BADGE_LABEL: Record<string, string> = {
  LEARNING_CARD:      "Öğrenme Kartı",
  SOCIAL_STORY:       "Sosyal Hikaye",
  ARTICULATION_DRILL: "Artikülasyon",
};

function resolveToolType(toolType: string | null): string {
  return toolType ?? "LEARNING_CARD";
}

interface Curriculum { id: string; area: string; title: string; goals: { id: string }[] }

type SortBy = "newest" | "oldest" | "name" | "assignments";

const CATEGORY_OPTIONS = [
  { value: "all",      label: "Tümü" },
  { value: "speech",   label: "Konuşma" },
  { value: "language", label: "Dil" },
  { value: "hearing",  label: "İşitme" },
];

const DIFFICULTY_OPTIONS = [
  { value: "all",    label: "Tümü" },
  { value: "easy",   label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard",   label: "Zor" },
];

const AGE_OPTIONS = [
  { value: "all",   label: "Tümü" },
  { value: "3-6",   label: "3–6 yaş" },
  { value: "7-12",  label: "7–12 yaş" },
  { value: "13-18", label: "13–18 yaş" },
  { value: "adult", label: "Yetişkin" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest",      label: "En yeni önce" },
  { value: "oldest",      label: "En eski önce" },
  { value: "name",        label: "Ada göre (A–Z)" },
  { value: "assignments", label: "En çok atanan önce" },
];

const SELECT_CLS =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#023435]/30 cursor-pointer";

function PillGroup({
  options,
  value,
  onChange,
  activeClass,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  activeClass: string;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
            value === o.value
              ? activeClass
              : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards]         = useState<CardItem[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(false);
  const [page, setPage]           = useState(1);
  const [assigningCard, setAssigningCard] = useState<CardItem | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Filtreler
  const [filterToolType,   setFilterToolType]   = useState<ToolTypeFilter>("all");
  const [filterCategory,   setFilterCategory]   = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterAgeGroup,   setFilterAgeGroup]   = useState("all");
  const [filterCurriculum, setFilterCurriculum] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  useEffect(() => {
    Promise.all([
      fetch("/api/cards?page=1&limit=20").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch("/api/curriculum").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
    ]).then(([cData, curData]) => {
      setCards(cData.cards ?? []);
      setHasMore(cData.hasMore ?? false);
      setPage(1);
      setCurricula(curData.curricula ?? []);
    }).catch(() => toast.error("Veriler yüklenemedi")).finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/cards?page=${nextPage}&limit=20`);
      const data = await res.json();
      setCards((prev) => [...prev, ...(data.cards ?? [])]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch {
      toast.error("Kartlar yüklenemedi");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSaved(cardId: string, assignedCount: number) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, _count: { assignments: assignedCount } } : c
      )
    );
  }

  const hasActiveFilters =
    filterToolType !== "all" ||
    filterCategory !== "all" ||
    filterDifficulty !== "all" ||
    filterAgeGroup !== "all" ||
    filterCurriculum !== "";

  function clearFilters() {
    setFilterToolType("all");
    setFilterCategory("all");
    setFilterDifficulty("all");
    setFilterAgeGroup("all");
    setFilterCurriculum("");
  }

  // goalId → curriculumId lookup (built from curricula that include goals)
  const goalToCurriculumId = useMemo(() => {
    const map: Record<string, string> = {};
    curricula.forEach((c) => c.goals?.forEach((g) => { map[g.id] = c.id; }));
    return map;
  }, [curricula]);

  const filtered = useMemo(() => {
    let list = [...cards];

    if (filterToolType !== "all") {
      list = list.filter((c) => {
        const tt = resolveToolType(c.toolType);
        if (filterToolType === "learning")     return tt === "LEARNING_CARD";
        if (filterToolType === "social_story") return tt === "SOCIAL_STORY";
        if (filterToolType === "articulation") return tt === "ARTICULATION_DRILL";
        return true;
      });
    }

    if (filterCategory !== "all")   list = list.filter((c) => c.category === filterCategory);
    if (filterDifficulty !== "all") list = list.filter((c) => c.difficulty === filterDifficulty);
    if (filterAgeGroup !== "all")   list = list.filter((c) => c.ageGroup === filterAgeGroup);
    if (filterCurriculum !== "")    list = list.filter((c) =>
      c.curriculumGoalIds.some((gId) => goalToCurriculumId[gId] === filterCurriculum)
    );

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest":      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":        return a.title.localeCompare(b.title, "tr");
        case "assignments": return b._count.assignments - a._count.assignments;
        default:            return 0;
      }
    });
    return list;
  }, [cards, filterCategory, filterDifficulty, filterAgeGroup, filterCurriculum, sortBy, goalToCurriculumId]);

  async function handleDeleteCard(cardId: string) {
    setDeletingCardId(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      toast.success("Kart silindi");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin");
    } finally {
      setDeletingCardId(null);
      setConfirmDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-zinc-100 bg-white px-6 py-2.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-700">Kart Kütüphanesi</h1>
          <Link href="/generate"><Button size="sm">✨ Kart Üret</Button></Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 overflow-x-hidden">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-sm font-medium text-zinc-500 mb-1">Henüz kart oluşturulmadı</p>
            <p className="text-xs text-zinc-400 mb-4">Öğrencileriniz için kart üretmeye başlayın.</p>
            <Link href="/generate"><Button size="sm">✨ Kart Üret</Button></Link>
          </div>
        ) : (
          <>
            {/* ── Araç Türü Filtresi ── */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {TOOL_TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFilterToolType(o.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filterToolType === o.value
                      ? "bg-[#023435] text-white border-[#023435]"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* ── Filtre + Sıralama ── */}
            <div className="mb-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              {/* Kategori */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Kategori</span>
                <PillGroup
                  options={CATEGORY_OPTIONS}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  activeClass="border-[#023435] bg-[#023435]/5 text-[#023435]"
                />
              </div>

              {/* Zorluk */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Zorluk</span>
                <PillGroup
                  options={DIFFICULTY_OPTIONS}
                  value={filterDifficulty}
                  onChange={setFilterDifficulty}
                  activeClass="border-amber-400 bg-amber-50 text-amber-700"
                />
              </div>

              {/* Yaş */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Yaş</span>
                <PillGroup
                  options={AGE_OPTIONS}
                  value={filterAgeGroup}
                  onChange={setFilterAgeGroup}
                  activeClass="border-purple-400 bg-purple-50 text-purple-700"
                />
              </div>

              {/* Modül + Sıralama + Temizle */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100">
                {curricula.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Modül</span>
                    <select
                      value={filterCurriculum}
                      onChange={(e) => setFilterCurriculum(e.target.value)}
                      className={cn(
                        SELECT_CLS,
                        filterCurriculum !== "" && "border-teal-400 bg-teal-50 text-teal-700"
                      )}
                    >
                      <option value="">Tüm modüller</option>
                      {curricula.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline-offset-2 hover:underline"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className={cn(
                      SELECT_CLS,
                      sortBy !== "newest" && "border-[#023435] bg-[#023435]/5 text-[#023435]"
                    )}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Sonuç sayısı ── */}
            <p className="text-xs text-zinc-400 mb-4">
              {filtered.length === cards.length
                ? `${cards.length} kart`
                : `${filtered.length} / ${cards.length} kart gösteriliyor`}
            </p>

            {/* ── Liste ── */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center">
                {filterToolType !== "all" ? (() => {
                  const opt = TOOL_TYPE_OPTIONS.find((o) => o.value === filterToolType);
                  return (
                    <>
                      <p className="text-sm text-zinc-500 mb-3">
                        Henüz {opt?.label} üretmediniz.
                      </p>
                      {opt?.href && (
                        <a
                          href={opt.href}
                          className="rounded-lg bg-[#FE703A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
                        >
                          Üretmeye Başla
                        </a>
                      )}
                    </>
                  );
                })() : (
                  <>
                    <p className="text-sm text-zinc-500 mb-2">Bu filtrelere uyan kart bulunamadı.</p>
                    <button onClick={clearFilters} className="text-xs text-[#FE703A] hover:underline">
                      Filtreleri temizle
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((card) => (
                  <SwipeableCard
                    key={card.id}
                    id={card.id}
                    openId={swipeOpenId}
                    onOpen={setSwipeOpenId}
                    onClose={() => setSwipeOpenId(null)}
                    onDeletePress={() => { setSwipeOpenId(null); setConfirmDeleteId(card.id); }}
                  >
                  <div
                    className="group relative rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-[#FE703A]/40 hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* Hover delete button — desktop only (hidden on touch via opacity) */}
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmDeleteId(card.id); }}
                      className="absolute top-3 right-3 z-10 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Sil
                    </button>
                    <Link href={`/cards/${card.id}`} className="block p-4 flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
                        {/* Araç türü badge */}
                        {(() => {
                          const tt = resolveToolType(card.toolType);
                          const badgeCls = TOOL_TYPE_BADGE[tt];
                          const label    = TOOL_TYPE_BADGE_LABEL[tt];
                          if (!label) return null;
                          return (
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", badgeCls)}>
                              {label}
                            </span>
                          );
                        })()}
                        <Badge className={WORK_AREA_COLOR[card.category] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                          {WORK_AREA_LABEL[card.category] ?? card.category}
                        </Badge>
                        <Badge className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                          {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                        </Badge>
                        <Badge className="bg-zinc-100 text-zinc-600" style={{ fontSize: "10px" }}>
                          {AGE_LABEL[card.ageGroup] ?? card.ageGroup}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-zinc-900 text-sm mb-1 line-clamp-2">{card.title}</h3>
                      <div className="mt-2 space-y-0.5">
                        {card.student && (
                          <p className="text-xs text-zinc-400">Kim için: {card.student.name}</p>
                        )}
                        <p className="text-xs text-zinc-400">
                          {card._count.assignments > 0
                            ? `${card._count.assignments} öğrenciye atandı`
                            : "Henüz atanmadı"}
                        </p>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setAssigningCard(card)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                      >
                        Öğrenciye Ata
                      </button>
                    </div>
                  </div>
                  </SwipeableCard>
                ))}
              </div>
            )}

            {/* Daha fazla yükle */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors"
                >
                  {loadingMore ? "Yükleniyor…" : "Daha fazla yükle"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 text-center">
            <p className="text-base font-semibold text-zinc-900 mb-1">Kartı sil</p>
            <p className="text-sm text-zinc-500 mb-5">
              Bu kartı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)} disabled={!!deletingCardId}>
                İptal
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleDeleteCard(confirmDeleteId)} disabled={!!deletingCardId}>
                {deletingCardId ? "Siliniyor…" : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {assigningCard && (
        <AssignStudentsModal
          cardId={assigningCard.id}
          cardTitle={assigningCard.title}
          onClose={() => setAssigningCard(null)}
          onSaved={(count) => handleSaved(assigningCard.id, count)}
        />
      )}
    </>
  );
}
