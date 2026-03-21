"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
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
  difficulty: string;
  ageGroup: string;
  createdAt: string;
  student: { id: string; name: string } | null;
  curriculumGoal: { curriculumId: string } | null;
  _count: { assignments: number };
}

interface Curriculum { id: string; area: string; title: string }

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
  const [assigningCard, setAssigningCard] = useState<CardItem | null>(null);

  // Filtreler
  const [filterCategory,   setFilterCategory]   = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterAgeGroup,   setFilterAgeGroup]   = useState("all");
  const [filterCurriculum, setFilterCurriculum] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  useEffect(() => {
    Promise.all([
      fetch("/api/cards").then((r) => r.json()),
      fetch("/api/curriculum").then((r) => r.json()),
    ]).then(([cData, curData]) => {
      setCards(cData.cards ?? []);
      setCurricula(curData.curricula ?? []);
    }).catch(() => toast.error("Veriler yüklenemedi")).finally(() => setLoading(false));
  }, []);

  function handleSaved(cardId: string, assignedCount: number) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, _count: { assignments: assignedCount } } : c
      )
    );
  }

  const hasActiveFilters =
    filterCategory !== "all" ||
    filterDifficulty !== "all" ||
    filterAgeGroup !== "all" ||
    filterCurriculum !== "";

  function clearFilters() {
    setFilterCategory("all");
    setFilterDifficulty("all");
    setFilterAgeGroup("all");
    setFilterCurriculum("");
  }

  const filtered = useMemo(() => {
    let list = [...cards];
    if (filterCategory !== "all")   list = list.filter((c) => c.category === filterCategory);
    if (filterDifficulty !== "all") list = list.filter((c) => c.difficulty === filterDifficulty);
    if (filterAgeGroup !== "all")   list = list.filter((c) => c.ageGroup === filterAgeGroup);
    if (filterCurriculum !== "")    list = list.filter((c) => c.curriculumGoal?.curriculumId === filterCurriculum);

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
  }, [cards, filterCategory, filterDifficulty, filterAgeGroup, filterCurriculum, sortBy]);

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
                <p className="text-sm text-zinc-500 mb-2">Bu filtrelere uyan kart bulunamadı.</p>
                <button onClick={clearFilters} className="text-xs text-[#FE703A] hover:underline">
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((card) => (
                  <div
                    key={card.id}
                    className="group rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-[#FE703A]/40 hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    <Link href={`/cards/${card.id}`} className="block p-4 flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
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
                ))}
              </div>
            )}
          </>
        )}
      </main>

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
