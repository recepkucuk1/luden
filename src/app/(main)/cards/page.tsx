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
import { Filter } from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

interface CardItem {
  id: string;
  title: string;
  category: string;
  toolType: string | null;
  difficulty: string;
  ageGroup: string;
  createdAt: string;
  curriculumGoalIds: string[];
  content: Record<string, unknown> | null;
  student: { id: string; name: string } | null;
  _count: { assignments: number };
}

type ToolTypeFilter = "all" | "learning" | "social_story" | "articulation" | "homework" | "session_summary" | "matching_game" | "phonation" | "comm_board" | "weekly_plan";

const TOOL_TYPE_OPTIONS: { value: ToolTypeFilter; label: string; href?: string }[] = [
  { value: "all",             label: "Tümü" },
  { value: "learning",        label: "Öğrenme Kartı",     href: "/generate" },
  { value: "social_story",    label: "Sosyal Hikaye",     href: "/tools/social-story" },
  { value: "articulation",    label: "Artikülasyon",      href: "/tools/articulation" },
  { value: "homework",        label: "Ev Ödevi",           href: "/tools/homework" },
  { value: "session_summary", label: "Oturum Özeti",      href: "/tools/session-summary" },
  { value: "matching_game",   label: "Kelime Eşleştirme", href: "/tools/matching-game" },
  { value: "phonation",       label: "Sesletim Aktivitesi", href: "/tools/phonation" },
  { value: "comm_board",      label: "İletişim Panosu",     href: "/tools/comm-board" },
  { value: "weekly_plan",     label: "Haftalık Plan",        href: "/tools/weekly-plan" },
];

const TOOL_TYPE_BADGE: Record<string, string> = {
  LEARNING_CARD:      "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  SOCIAL_STORY:       "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  ARTICULATION_DRILL: "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  HOMEWORK_MATERIAL:  "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
  SESSION_SUMMARY:    "bg-purple-50 text-purple-700 border-purple-200",
  MATCHING_GAME:      "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  PHONATION_ACTIVITY:   "bg-green-50 text-green-700 border-green-200",
  COMMUNICATION_BOARD:  "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  WEEKLY_PLAN:          "bg-amber-50 text-amber-700 border-amber-200",
};

const TOOL_TYPE_BADGE_LABEL: Record<string, string> = {
  LEARNING_CARD:      "Öğrenme Kartı",
  SOCIAL_STORY:       "Sosyal Hikaye",
  ARTICULATION_DRILL: "Artikülasyon",
  HOMEWORK_MATERIAL:  "Ev Ödevi",
  SESSION_SUMMARY:    "Oturum Özeti",
  MATCHING_GAME:      "Kelime Eşleştirme",
  PHONATION_ACTIVITY:  "Sesletim Aktivitesi",
  COMMUNICATION_BOARD: "İletişim Panosu",
  WEEKLY_PLAN:         "Haftalık Plan",
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

// ── Sosyal Hikaye filtre seçenekleri ──────────────────────────────────────────
const SITUATION_OPTIONS = [
  { value: "all",                       label: "Tümü" },
  { value: "Sıra bekleme",              label: "Sıra bekleme" },
  { value: "Selamlaşma",                label: "Selamlaşma" },
  { value: "Paylaşma",                  label: "Paylaşma" },
  { value: "Duygularını ifade etme",    label: "Duygularını ifade etme" },
  { value: "Sınıf kurallarına uyma",    label: "Sınıf kurallarına uyma" },
  { value: "Arkadaş edinme",            label: "Arkadaş edinme" },
  { value: "Çatışma çözme",             label: "Çatışma çözme" },
  { value: "Özür dileme",               label: "Özür dileme" },
  { value: "Yardım isteme",             label: "Yardım isteme" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "all",                    label: "Tümü" },
  { value: "Okul",                   label: "Okul" },
  { value: "Ev",                     label: "Ev" },
  { value: "Park",                   label: "Park" },
  { value: "Market",                 label: "Market" },
  { value: "Hastane",                label: "Hastane" },
  { value: "Rehabilitasyon merkezi", label: "Rehabilitasyon merkezi" },
];

const STORY_LENGTH_OPTIONS = [
  { value: "all",    label: "Tümü" },
  { value: "short",  label: "Kısa" },
  { value: "medium", label: "Orta" },
  { value: "long",   label: "Uzun" },
];

// ── Artikülasyon filtre seçenekleri ───────────────────────────────────────────
const SOUND_OPTIONS = [
  "/s/", "/z/", "/ş/", "/ç/", "/r/", "/l/", "/k/", "/g/",
  "/t/", "/d/", "/n/", "/m/", "/p/", "/b/", "/f/", "/v/", "/h/",
];

const ARTICULATON_LEVEL_OPTIONS = [
  { value: "all",        label: "Tümü" },
  { value: "isolated",   label: "İzole Ses" },
  { value: "syllable",   label: "Hece" },
  { value: "word",       label: "Kelime" },
  { value: "sentence",   label: "Cümle" },
  { value: "contextual", label: "Bağlam" },
];

const THEME_OPTIONS = [
  { value: "all",              label: "Tümü" },
  { value: "Hayvanlar",        label: "Hayvanlar" },
  { value: "Yiyecekler",       label: "Yiyecekler" },
  { value: "Mevsimler ve hava",label: "Mevsimler" },
  { value: "Meslekler",        label: "Meslekler" },
  { value: "Okul eşyaları",    label: "Okul eşyaları" },
  { value: "Vücut bölümleri",  label: "Vücut bölümleri" },
  { value: "Spor ve oyunlar",  label: "Spor ve oyunlar" },
];

// ── Ev Ödevi filtre seçenekleri ──────────────────────────────────────────────
const HW_AREA_OPTIONS = [
  { value: "all",                                       label: "Tümü" },
  { value: "Artikülasyon / Ses çalışması",              label: "Artikülasyon" },
  { value: "Dil gelişimi / Kelime hazinesi",            label: "Dil gelişimi" },
  { value: "Akıcı konuşma",                             label: "Akıcı konuşma" },
  { value: "Pragmatik dil / Sosyal iletişim",           label: "Pragmatik dil" },
  { value: "İşitsel algı / Dinleme becerileri",         label: "İşitsel algı" },
  { value: "Oral motor egzersizler",                    label: "Oral motor" },
  { value: "Diğer",                                     label: "Diğer" },
];

const HW_MATERIAL_OPTIONS = [
  { value: "all",            label: "Tümü" },
  { value: "exercise",       label: "Ev Egzersizi" },
  { value: "observation",    label: "Gözlem Formu" },
  { value: "daily_activity", label: "Günlük Aktivite" },
];

const HW_DURATION_OPTIONS = [
  { value: "all",       label: "Tümü" },
  { value: "10 dakika", label: "10 dk" },
  { value: "15 dakika", label: "15 dk" },
  { value: "20 dakika", label: "20 dk" },
];

// ── Oturum Özeti filtre seçenekleri ──────────────────────────────────────────
const SS_SESSION_TYPE_OPTIONS = [
  { value: "all",            label: "Tümü" },
  { value: "individual",     label: "Bireysel" },
  { value: "group",          label: "Grup" },
  { value: "assessment",     label: "Değerlendirme" },
  { value: "parent_meeting", label: "Veli Görüşmesi" },
];

const SS_PERFORMANCE_OPTIONS = [
  { value: "all",           label: "Tümü" },
  { value: "above_target",  label: "Beklenenin Üstünde" },
  { value: "on_target",     label: "Hedefle Uyumlu" },
  { value: "progressing",   label: "Gelişim Gösteriyor" },
  { value: "needs_support", label: "Ek Destek Gerekiyor" },
];

// ── Kelime Eşleştirme filtre seçenekleri ─────────────────────────────────────
const MG_MATCH_TYPE_OPTIONS = [
  { value: "all",        label: "Tümü" },
  { value: "definition", label: "Kelime — Tanım" },
  { value: "image_desc", label: "Kelime — Resim" },
  { value: "synonym",    label: "Eş Anlamlı" },
  { value: "antonym",    label: "Zıt Anlamlı" },
  { value: "category",   label: "Kategori" },
  { value: "sentence",   label: "Cümle Tamamlama" },
];

const MG_DIFFICULTY_OPTIONS = [
  { value: "all",    label: "Tümü" },
  { value: "easy",   label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard",   label: "Zor" },
];

// ── Sesletim Aktivitesi filtre seçenekleri ────────────────────────────────────
const PA_ACTIVITY_TYPE_OPTIONS = [
  { value: "all",            label: "Tümü" },
  { value: "sound_hunt",     label: "Ses Avı" },
  { value: "bingo",          label: "Tombala" },
  { value: "snakes_ladders", label: "Yılan Merdiven" },
  { value: "word_chain",     label: "Kelime Zinciri" },
  { value: "sound_maze",     label: "Ses Labirenti" },
];

const PA_DIFFICULTY_OPTIONS = [
  { value: "all",    label: "Tümü" },
  { value: "easy",   label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard",   label: "Zor" },
];

const PA_SOUND_OPTIONS = [
  "/s/", "/z/", "/ş/", "/ç/", "/c/", "/j/",
  "/r/", "/l/", "/n/", "/m/",
  "/k/", "/g/", "/t/", "/d/", "/p/", "/b/",
  "/f/", "/v/", "/h/", "/y/",
];

// ── İletişim Panosu filtre seçenekleri ───────────────────────────────────────
const CB_BOARD_TYPE_OPTIONS = [
  { value: "all",            label: "Tümü" },
  { value: "basic_needs",    label: "Temel İhtiyaçlar" },
  { value: "emotions",       label: "Duygular" },
  { value: "daily_routines", label: "Günlük Rutinler" },
  { value: "school",         label: "Okul Aktiviteleri" },
  { value: "social",         label: "Sosyal İfadeler" },
  { value: "requests",       label: "İstek ve Seçim" },
];

const CB_LAYOUT_OPTIONS = [
  { value: "all",   label: "Tümü" },
  { value: "grid",  label: "Grid" },
  { value: "strip", label: "Satır" },
];

const CB_SYMBOL_COUNT_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "4",   label: "4" },
  { value: "6",   label: "6" },
  { value: "9",   label: "9" },
  { value: "12",  label: "12" },
];

// ── Haftalık Plan filtre seçenekleri ─────────────────────────────────────────
const WP_SESSIONS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "2",   label: "2 ders" },
  { value: "3",   label: "3 ders" },
  { value: "4",   label: "4 ders" },
  { value: "5",   label: "5 ders" },
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

function MultiPillGroup({
  options,
  values,
  onChange,
  activeClass,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  activeClass: string;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => onChange([])}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
          values.length === 0
            ? activeClass
            : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
        )}
      >
        Tümü
      </button>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
            values.includes(o)
              ? activeClass
              : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          )}
        >
          {o}
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtreler — ortak
  const [filterToolType,   setFilterToolType]   = useState<ToolTypeFilter>("all");
  const [filterStudent,    setFilterStudent]    = useState("");
  const [filterAgeGroup,   setFilterAgeGroup]   = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  // Filtreler — öğrenme kartı
  const [filterCategory,   setFilterCategory]   = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterCurriculum, setFilterCurriculum] = useState("");
  // Filtreler — sosyal hikaye
  const [filterSituation,    setFilterSituation]    = useState("all");
  const [filterEnvironment,  setFilterEnvironment]  = useState("all");
  const [filterStoryLength,  setFilterStoryLength]  = useState("all");
  // Filtreler — artikülasyon
  const [filterSounds,  setFilterSounds]  = useState<string[]>([]);
  const [filterLevel,   setFilterLevel]   = useState("all");
  const [filterTheme,   setFilterTheme]   = useState("all");
  // Filtreler — ev ödevi
  const [filterHwArea,     setFilterHwArea]     = useState("all");
  const [filterHwMaterial, setFilterHwMaterial] = useState("all");
  const [filterHwDuration, setFilterHwDuration] = useState("all");
  // Filtreler — oturum özeti
  const [filterSsType,        setFilterSsType]        = useState("all");
  const [filterSsPerformance, setFilterSsPerformance] = useState("all");
  // Filtreler — kelime eşleştirme
  const [filterMgMatchType,  setFilterMgMatchType]  = useState("all");
  const [filterMgDifficulty, setFilterMgDifficulty] = useState("all");
  // Filtreler — sesletim aktivitesi
  const [filterPaType,       setFilterPaType]       = useState("all");
  const [filterPaDifficulty, setFilterPaDifficulty] = useState("all");
  const [filterPaSounds,     setFilterPaSounds]     = useState<string[]>([]);
  // Filtreler — iletişim panosu
  const [filterCbBoardType,   setFilterCbBoardType]   = useState("all");
  const [filterCbLayout,      setFilterCbLayout]      = useState("all");
  const [filterCbSymbolCount, setFilterCbSymbolCount] = useState("all");
  // Filtreler — haftalık plan
  const [filterWpSessions, setFilterWpSessions] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/cards?page=1&limit=1000").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
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
      const res = await fetch(`/api/cards?page=${nextPage}&limit=1000`);
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
    filterStudent !== "" ||
    filterAgeGroup !== "all" ||
    filterCategory !== "all" ||
    filterDifficulty !== "all" ||
    filterCurriculum !== "" ||
    filterSituation !== "all" ||
    filterEnvironment !== "all" ||
    filterStoryLength !== "all" ||
    filterSounds.length > 0 ||
    filterLevel !== "all" ||
    filterTheme !== "all" ||
    filterHwArea !== "all" ||
    filterHwMaterial !== "all" ||
    filterHwDuration !== "all" ||
    filterSsType !== "all" ||
    filterSsPerformance !== "all" ||
    filterMgMatchType !== "all" ||
    filterMgDifficulty !== "all" ||
    filterPaType !== "all" ||
    filterPaDifficulty !== "all" ||
    filterPaSounds.length > 0 ||
    filterCbBoardType !== "all" ||
    filterCbLayout !== "all" ||
    filterCbSymbolCount !== "all" ||
    filterWpSessions !== "all";

  function clearFilters() {
    setFilterStudent("");
    setFilterAgeGroup("all");
    setFilterCategory("all");
    setFilterDifficulty("all");
    setFilterCurriculum("");
    setFilterSituation("all");
    setFilterEnvironment("all");
    setFilterStoryLength("all");
    setFilterSounds([]);
    setFilterLevel("all");
    setFilterTheme("all");
    setFilterHwArea("all");
    setFilterHwMaterial("all");
    setFilterHwDuration("all");
    setFilterSsType("all");
    setFilterSsPerformance("all");
    setFilterMgMatchType("all");
    setFilterMgDifficulty("all");
    setFilterPaType("all");
    setFilterPaDifficulty("all");
    setFilterPaSounds([]);
    setFilterCbBoardType("all");
    setFilterCbLayout("all");
    setFilterCbSymbolCount("all");
    setFilterWpSessions("all");
  }

  // goalId → curriculumId lookup
  const goalToCurriculumId = useMemo(() => {
    const map: Record<string, string> = {};
    curricula.forEach((c) => c.goals?.forEach((g) => { map[g.id] = c.id; }));
    return map;
  }, [curricula]);

  // Kartlardan benzersiz öğrenci listesi
  const uniqueStudents = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    cards.forEach((c) => {
      if (c.student && !seen.has(c.student.id)) {
        seen.add(c.student.id);
        result.push(c.student);
      }
    });
    return result.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [cards]);

  const filtered = useMemo(() => {
    let list = [...cards];

    if (filterToolType !== "all") {
      list = list.filter((c) => {
        const tt = resolveToolType(c.toolType);
        if (filterToolType === "learning")        return tt === "LEARNING_CARD";
        if (filterToolType === "social_story")   return tt === "SOCIAL_STORY";
        if (filterToolType === "articulation")   return tt === "ARTICULATION_DRILL";
        if (filterToolType === "homework")       return tt === "HOMEWORK_MATERIAL";
        if (filterToolType === "session_summary") return tt === "SESSION_SUMMARY";
        if (filterToolType === "matching_game")   return tt === "MATCHING_GAME";
        if (filterToolType === "phonation")       return tt === "PHONATION_ACTIVITY";
        if (filterToolType === "comm_board")      return tt === "COMMUNICATION_BOARD";
        if (filterToolType === "weekly_plan")     return tt === "WEEKLY_PLAN";
        return true;
      });
    }

    // Ortak filtreler (tüm araç türleri)
    if (filterStudent !== "")   list = list.filter((c) => c.student?.id === filterStudent);
    if (filterAgeGroup !== "all") list = list.filter((c) => c.ageGroup === filterAgeGroup);

    // Öğrenme kartı filtreleri
    if (filterToolType === "learning") {
      if (filterCategory !== "all")   list = list.filter((c) => c.category === filterCategory);
      if (filterDifficulty !== "all") list = list.filter((c) => c.difficulty === filterDifficulty);
      if (filterCurriculum !== "")    list = list.filter((c) =>
        c.curriculumGoalIds.some((gId) => goalToCurriculumId[gId] === filterCurriculum)
      );
    }

    // Sosyal hikaye filtreleri
    if (filterToolType === "social_story") {
      if (filterSituation !== "all") {
        list = list.filter((c) => {
          const sit = c.content?.situation as string | undefined;
          return sit === filterSituation;
        });
      }
      if (filterEnvironment !== "all") {
        list = list.filter((c) => {
          const env = c.content?.environment as string | undefined;
          return env === filterEnvironment;
        });
      }
      if (filterStoryLength !== "all") {
        list = list.filter((c) => {
          const stored = c.content?.length as string | undefined;
          if (stored) return stored === filterStoryLength;
          // Eski kartlar için cümle sayısına göre tahmin et
          const cnt = (c.content?.sentences as unknown[] | undefined)?.length ?? 0;
          if (filterStoryLength === "short")  return cnt <= 5;
          if (filterStoryLength === "medium") return cnt >= 6 && cnt <= 10;
          if (filterStoryLength === "long")   return cnt > 10;
          return true;
        });
      }
    }

    // Ev ödevi filtreleri
    if (filterToolType === "homework") {
      if (filterHwArea !== "all") {
        list = list.filter((c) => {
          const area = c.content?.targetArea as string | undefined;
          return area === filterHwArea;
        });
      }
      if (filterHwMaterial !== "all") {
        list = list.filter((c) => (c.content?.materialType as string | undefined) === filterHwMaterial);
      }
      if (filterHwDuration !== "all") {
        list = list.filter((c) => (c.content?.duration as string | undefined) === filterHwDuration);
      }
    }

    // Oturum özeti filtreleri
    if (filterToolType === "session_summary") {
      if (filterSsType !== "all") {
        list = list.filter((c) => (c.content?.sessionType as string | undefined) === filterSsType);
      }
      if (filterSsPerformance !== "all") {
        list = list.filter((c) => (c.content?.overallPerformance as string | undefined) === filterSsPerformance);
      }
    }

    // Sesletim aktivitesi filtreleri
    if (filterToolType === "phonation") {
      if (filterPaType !== "all") {
        list = list.filter((c) => (c.content?.activityType as string | undefined) === filterPaType);
      }
      if (filterPaDifficulty !== "all") {
        list = list.filter((c) => (c.content?.difficulty as string | undefined) === filterPaDifficulty);
      }
      if (filterPaSounds.length > 0) {
        list = list.filter((c) => {
          const sounds = c.content?.targetSounds as string[] | undefined;
          if (!sounds) return false;
          return filterPaSounds.some((fs) => sounds.includes(fs));
        });
      }
    }

    // Haftalık plan filtreleri
    if (filterToolType === "weekly_plan") {
      if (filterWpSessions !== "all") {
        list = list.filter((c) => String(c.content?.sessionsPerWeek ?? "") === filterWpSessions);
      }
    }

    // İletişim panosu filtreleri
    if (filterToolType === "comm_board") {
      if (filterCbBoardType !== "all") {
        list = list.filter((c) => (c.content?.boardType as string | undefined) === filterCbBoardType);
      }
      if (filterCbLayout !== "all") {
        list = list.filter((c) => (c.content?.layout as string | undefined) === filterCbLayout);
      }
      if (filterCbSymbolCount !== "all") {
        list = list.filter((c) => String(c.content?.symbolCount ?? "") === filterCbSymbolCount);
      }
    }

    // Kelime eşleştirme filtreleri
    if (filterToolType === "matching_game") {
      if (filterMgMatchType !== "all") {
        list = list.filter((c) => (c.content?.matchType as string | undefined) === filterMgMatchType);
      }
      if (filterMgDifficulty !== "all") {
        list = list.filter((c) => (c.content?.difficulty as string | undefined) === filterMgDifficulty);
      }
    }

    // Artikülasyon filtreleri
    if (filterToolType === "articulation") {
      if (filterSounds.length > 0) {
        list = list.filter((c) => {
          const sounds = c.content?.targetSounds as string[] | undefined;
          if (!sounds) return false;
          return filterSounds.some((fs) =>
            sounds.some((s) => s.toLowerCase().includes(fs.replace(/\//g, "").toLowerCase()))
          );
        });
      }
      if (filterLevel !== "all") {
        list = list.filter((c) => (c.content?.level as string | undefined) === filterLevel);
      }
      if (filterTheme !== "all") {
        list = list.filter((c) => {
          const theme = c.content?.theme as string | undefined;
          return theme === filterTheme;
        });
      }
    }

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
  }, [
    cards, filterToolType, filterStudent, filterAgeGroup,
    filterCategory, filterDifficulty, filterCurriculum, goalToCurriculumId,
    filterSituation, filterEnvironment, filterStoryLength,
    filterSounds, filterLevel, filterTheme,
    filterHwArea, filterHwMaterial, filterHwDuration,
    filterSsType, filterSsPerformance,
    filterMgMatchType, filterMgDifficulty,
    filterPaType, filterPaDifficulty, filterPaSounds,
    filterCbBoardType, filterCbLayout, filterCbSymbolCount,
    filterWpSessions,
    sortBy,
  ]);

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
    <div className="min-h-full flex-1 w-full flex flex-col relative bg-[#F0F4F4] overflow-x-hidden custom-scrollbar" style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}>
      {/* Dekoratif Işıklar (Orbs) */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#107996]/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.03)] px-6 py-4 transition-all">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#023435] tracking-tight">Kütüphane</h1>
            <p className="mt-0.5 text-xs text-[#023435]/60 font-medium">{cards.length} materyal kayıtlı</p>
          </div>
          <Link href="/generate">
            <Button className="bg-[#FE703A] hover:bg-[#FE703A]/90 text-white font-bold tracking-wide shadow-md shadow-[#FE703A]/20 transition-all hover:-translate-y-0.5 rounded-xl px-5 h-10">
              ✨ Yeni Üret
            </Button>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 relative z-10 flex-1">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/40 shadow-sm backdrop-blur-md py-20 text-center">
            <div className="text-5xl mb-4 opacity-80">🗂️</div>
            <p className="text-lg font-bold text-[#023435] mb-1">Henüz materyal üretilmedi</p>
            <p className="text-sm font-medium text-[#023435]/50 mb-6">Öğrencileriniz için harika materyaller üretmeye başlayın.</p>
            <Link href="/generate">
              <Button className="bg-[#107996] hover:bg-[#107996]/90 text-white font-bold tracking-wide shadow-md shadow-[#107996]/20 transition-all hover:-translate-y-0.5 rounded-xl px-6 h-11 text-sm">
                ✨ Materyal Üret
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* ── İhtişamlı Yatay Menü (Araç Türü) ── */}
            <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
              <div className="flex gap-2 w-max p-1 bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-inner">
                {TOOL_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setFilterToolType(o.value)}
                    className={cn(
                      "rounded-full px-5 py-2 text-xs font-bold transition-all whitespace-nowrap",
                      filterToolType === o.value
                        ? "bg-[#023435] text-white shadow-md shadow-[#023435]/20"
                        : "bg-transparent text-[#023435]/60 hover:text-[#023435] hover:bg-white/60"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Gelişmiş Filtre Toggle ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-white/60 text-[#023435] text-sm font-bold shadow-sm hover:bg-white hover:-translate-y-0.5 transition-all w-max"
              >
                <Filter className="w-4 h-4 text-[#FE703A]" />
                {showAdvancedFilters ? "Seçenekleri Gizle" : "Gelişmiş Seçenekler"}
                {hasActiveFilters && !showAdvancedFilters && (
                  <span className="flex h-2 w-2 rounded-full bg-[#FE703A] animate-pulse relative -top-1 -right-0.5" />
                )}
              </button>
              
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors w-max mr-2 px-2">
                    Temizle
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="rounded-xl border border-white/80 bg-white/50 backdrop-blur-md shadow-sm px-4 py-2 text-sm font-bold text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#FE703A]/50 transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="text-sm font-medium">{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Filtre Paneli (Akordeon Mantığı) ── */}
            {showAdvancedFilters && (
              <div className="animate-in fade-in slide-in-from-top-2 mb-6 space-y-4 rounded-3xl border border-white/80 bg-white/60 shadow-[0_8px_32px_rgba(2,52,53,0.04)] backdrop-blur-xl p-5 md:p-6 transition-all">

                {/* Ortak: Öğrenci ve Yaş Grubu (Eğer hem öğrenci hem yaş yoksa da sorun değil, esnek yapı) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#023435]/5">
                  {uniqueStudents.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Öğrenci Seçimi</span>
                      <select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#023435] font-semibold focus:outline-none focus:ring-2 focus:ring-[#107996]/30 shadow-sm cursor-pointer"
                      >
                        <option value="">Tüm Öğrenciler</option>
                        {uniqueStudents.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Hedef Yaş Grubu</span>
                    <PillGroup
                      options={AGE_OPTIONS}
                      value={filterAgeGroup}
                      onChange={setFilterAgeGroup}
                      activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]"
                    />
                  </div>
                </div>

              {/* Araç türüne özel filtreler - Minimalist dizilim */}
              {filterToolType === "learning" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Kategori & Zorluk</span>
                    <div className="flex flex-wrap gap-4">
                      <PillGroup options={CATEGORY_OPTIONS} value={filterCategory} onChange={setFilterCategory} activeClass="border-[#023435]/40 bg-[#023435]/10 text-[#023435]" />
                      <div className="w-px bg-[#023435]/10" />
                      <PillGroup options={DIFFICULTY_OPTIONS} value={filterDifficulty} onChange={setFilterDifficulty} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" />
                    </div>
                  </div>
                  {curricula.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Bağlı Modül</span>
                      <select value={filterCurriculum} onChange={(e) => setFilterCurriculum(e.target.value)} className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#023435] font-semibold max-w-sm">
                        <option value="">Tüm modüller</option>
                        {curricula.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {filterToolType === "social_story" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Durum</span><PillGroup options={SITUATION_OPTIONS} value={filterSituation} onChange={setFilterSituation} activeClass="border-[#023435]/40 bg-[#023435]/10 text-[#023435]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Ortam</span><PillGroup options={ENVIRONMENT_OPTIONS} value={filterEnvironment} onChange={setFilterEnvironment} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Uzunluk</span><PillGroup options={STORY_LENGTH_OPTIONS} value={filterStoryLength} onChange={setFilterStoryLength} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "session_summary" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Oturum Türü</span><PillGroup options={SS_SESSION_TYPE_OPTIONS} value={filterSsType} onChange={setFilterSsType} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Gelişim Sonucu</span><PillGroup options={SS_PERFORMANCE_OPTIONS} value={filterSsPerformance} onChange={setFilterSsPerformance} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "phonation" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Aktivite Türü</span><PillGroup options={PA_ACTIVITY_TYPE_OPTIONS} value={filterPaType} onChange={setFilterPaType} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Hedef Sesler (Çoklu Seçim)</span><MultiPillGroup options={PA_SOUND_OPTIONS} values={filterPaSounds} onChange={setFilterPaSounds} activeClass="border-amber-400 bg-amber-50 text-amber-700" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Zorluk Derecesi</span><PillGroup options={PA_DIFFICULTY_OPTIONS} value={filterPaDifficulty} onChange={setFilterPaDifficulty} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "matching_game" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Eşleştirme Modeli</span><PillGroup options={MG_MATCH_TYPE_OPTIONS} value={filterMgMatchType} onChange={setFilterMgMatchType} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Zorluk</span><PillGroup options={MG_DIFFICULTY_OPTIONS} value={filterMgDifficulty} onChange={setFilterMgDifficulty} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "comm_board" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Pano Konsepti</span><PillGroup options={CB_BOARD_TYPE_OPTIONS} value={filterCbBoardType} onChange={setFilterCbBoardType} activeClass="border-[#023435]/40 bg-[#023435]/10 text-[#023435]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Düzen</span><PillGroup options={CB_LAYOUT_OPTIONS} value={filterCbLayout} onChange={setFilterCbLayout} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Eleman Sayısı</span><PillGroup options={CB_SYMBOL_COUNT_OPTIONS} value={filterCbSymbolCount} onChange={setFilterCbSymbolCount} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "weekly_plan" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Yoğunluk</span><PillGroup options={WP_SESSIONS_OPTIONS} value={filterWpSessions} onChange={setFilterWpSessions} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                </div>
              )}

              {filterToolType === "articulation" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Hedef Sesler</span><MultiPillGroup options={SOUND_OPTIONS} values={filterSounds} onChange={setFilterSounds} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Seviye</span><PillGroup options={ARTICULATON_LEVEL_OPTIONS} value={filterLevel} onChange={setFilterLevel} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Tema</span><PillGroup options={THEME_OPTIONS} value={filterTheme} onChange={setFilterTheme} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}

              {filterToolType === "homework" && (
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Odak Alanı</span><PillGroup options={HW_AREA_OPTIONS} value={filterHwArea} onChange={setFilterHwArea} activeClass="border-purple-400 bg-purple-50 text-purple-700" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Materyal Tipi</span><PillGroup options={HW_MATERIAL_OPTIONS} value={filterHwMaterial} onChange={setFilterHwMaterial} activeClass="border-[#107996]/40 bg-[#107996]/10 text-[#107996]" /></div>
                  <div className="flex flex-col gap-1.5"><span className="text-[11px] font-extrabold text-[#023435]/40 uppercase tracking-widest pl-1">Beklenen Süre</span><PillGroup options={HW_DURATION_OPTIONS} value={filterHwDuration} onChange={setFilterHwDuration} activeClass="border-[#FE703A]/40 bg-[#FE703A]/10 text-[#FE703A]" /></div>
                </div>
              )}
            </div>
            )}

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
                          className="rounded-xl mt-2 bg-[#FE703A] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#FE703A]/90 transition-transform hover:-translate-y-0.5"
                        >
                          Üretmeye Başla
                        </a>
                      )}
                    </>
                  );
                })() : (
                  <>
                    <p className="text-sm font-bold text-[#023435]/60 mb-3">Bu filtrelere uyan materyal bulunamadı.</p>
                    <button onClick={clearFilters} className="text-xs font-bold text-[#FE703A] border border-[#FE703A]/30 px-3 py-1.5 rounded-lg hover:bg-[#FE703A]/10 transition-colors">
                      Filtreleri Temizle
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    className="group relative rounded-3xl border border-white/80 bg-white/60 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)] hover:border-[#107996]/30 overflow-hidden flex flex-col min-h-[180px]"
                  >
                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-white/60 to-transparent pointer-events-none rounded-tr-3xl" />
                    
                    {/* Hover delete button */}
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmDeleteId(card.id); }}
                      className="absolute top-4 right-4 z-10 rounded-lg px-2 py-1 text-xs font-bold text-[#023435]/30 hover:text-red-600 hover:bg-red-50 focus:opacity-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Sil
                    </button>
                    <Link href={`/cards/${card.id}`} className="block p-5 flex-1 relative z-10">
                      <div className="flex flex-wrap gap-1.5 mb-3 pr-8">
                        {/* Araç türü badge */}
                        {(() => {
                          const tt = resolveToolType(card.toolType);
                          const badgeCls = TOOL_TYPE_BADGE[tt];
                          const label    = TOOL_TYPE_BADGE_LABEL[tt];
                          if (!label) return null;
                          return (
                            <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest", badgeCls)}>
                              {label}
                            </span>
                          );
                        })()}
                        {WORK_AREA_LABEL[card.category] && (
                          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", WORK_AREA_COLOR[card.category] ?? "border-zinc-200 text-zinc-600")}>
                            {WORK_AREA_LABEL[card.category]}
                          </span>
                        )}
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", DIFFICULTY_COLOR[card.difficulty] ?? "border-zinc-200 text-zinc-600")}>
                          {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                        </span>
                        <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#023435]/60 uppercase tracking-widest">
                          {AGE_LABEL[card.ageGroup] ?? card.ageGroup}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[#023435] text-[15px] mb-2 line-clamp-2 leading-snug">{card.title}</h3>
                      <div className="space-y-1">
                        {card.student && (
                          <p className="text-xs font-semibold text-[#107996]">Atanan: {card.student.name}</p>
                        )}
                        {card._count.assignments > 0 && (
                          <p className="text-[11px] font-semibold text-[#023435]/50 uppercase tracking-widest">
                            {card._count.assignments} öğrenciye atandı
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="px-5 pb-5 relative z-10">
                      <button
                        onClick={() => setAssigningCard(card)}
                        className="w-full rounded-xl border border-[#023435]/10 bg-white/50 px-3 py-2 text-xs font-bold text-[#023435] shadow-sm hover:bg-[#023435] hover:border-[#023435] hover:text-white transition-all transform hover:scale-[1.02]"
                      >
                        Öğrenci Ata
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
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
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
        </ModalPortal>
      )}

      {assigningCard && (
        <AssignStudentsModal
          cardId={assigningCard.id}
          cardTitle={assigningCard.title}
          onClose={() => setAssigningCard(null)}
          onSaved={(count) => handleSaved(assigningCard.id, count)}
        />
      )}
    </div>
  );
}
