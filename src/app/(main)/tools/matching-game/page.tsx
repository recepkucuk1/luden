"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Library, LayoutList, LayoutGrid, ChevronDown, ChevronUp, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";
import type { MatchingGameContent, MatchingPair } from "@/components/cards/MatchingGameView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  curriculumIds?: string[];
}

interface CurriculumGoal {
  id: string;
  title: string;
}

interface CurriculumItem {
  id: string;
  area: string;
  title: string;
  goals: CurriculumGoal[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_TYPE_OPTIONS = [
  { value: "definition",  label: "Kelime — Tanım",              desc: "Kelimenin anlamını eşleştir" },
  { value: "image_desc",  label: "Kelime — Resim Açıklaması",   desc: "Kelimeyi görsel açıklamayla eşleştir" },
  { value: "synonym",     label: "Eş Anlamlı",                  desc: "Aynı anlama gelen kelimeler" },
  { value: "antonym",     label: "Zıt Anlamlı",                 desc: "Karşıt anlamlı kelimeler" },
  { value: "category",    label: "Kategori Eşleştirme",         desc: "Kelimeyi ait olduğu kategoriyle eşleştir" },
  { value: "sentence",    label: "Cümle Tamamlama",             desc: "Cümledeki boşluğu doğru kelimeyle eşleştir" },
] as const;
type MatchType = (typeof MATCH_TYPE_OPTIONS)[number]["value"];

const PAIR_COUNTS = ["6", "8", "10", "12"] as const;
type PairCount = (typeof PAIR_COUNTS)[number];

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Kolay",  desc: "Somut, sık kullanılan kelimeler" },
  { value: "medium", label: "Orta",   desc: "Daha az sık, bazıları soyut" },
  { value: "hard",   label: "Zor",    desc: "Soyut kavramlar, deyimler" },
] as const;
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number]["value"];

const THEME_OPTIONS = [
  { value: "",                    label: "Tema yok (karışık)" },
  { value: "Hayvanlar",           label: "Hayvanlar" },
  { value: "Yiyecekler",          label: "Yiyecekler" },
  { value: "Meslekler",           label: "Meslekler" },
  { value: "Okul ve sınıf",       label: "Okul ve sınıf" },
  { value: "Ev ve aile",          label: "Ev ve aile" },
  { value: "Doğa ve mevsimler",   label: "Doğa ve mevsimler" },
  { value: "Vücut ve sağlık",     label: "Vücut ve sağlık" },
  { value: "Ulaşım araçları",     label: "Ulaşım araçları" },
  { value: "Duygular ve hisler",  label: "Duygular ve hisler" },
];

const MATCH_TYPE_LABEL: Record<string, string> = {
  definition: "Kelime — Tanım",
  image_desc: "Kelime — Resim Açıklaması",
  synonym:    "Eş Anlamlı",
  antonym:    "Zıt Anlamlı",
  category:   "Kategori Eşleştirme",
  sentence:   "Cümle Tamamlama",
};

const MATCH_TYPE_COLOR: Record<string, string> = {
  definition: "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  image_desc: "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  synonym:    "bg-green-50 text-green-700 border-green-200",
  antonym:    "bg-red-50 text-red-700 border-red-200",
  category:   "bg-purple-50 text-purple-700 border-purple-200",
  sentence:   "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard:   "bg-red-50 text-red-700 border-red-200",
};

const LOADING_MSGS = [
  "Kelime listesi oluşturuluyor...",
  "Eşleştirme çiftleri hazırlanıyor...",
  "Zorluk seviyesi ayarlanıyor...",
  "İpuçları ekleniyor...",
  "Talimatlar hazırlanıyor...",
  "Son dokunuşlar yapılıyor...",
];

// ─── Loading Messages ─────────────────────────────────────────────────────────

function LoadingMessages() {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % LOADING_MSGS.length);
        setVisible(true);
      }, 300);
    }, 2600);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex h-10 items-center justify-center">
      <p
        className="text-sm text-zinc-500 transition-opacity duration-300 text-center"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {LOADING_MSGS[index]}
      </p>
    </div>
  );
}

// ─── Printable Cards View ─────────────────────────────────────────────────────

function PrintableCards({ game }: { game: MatchingGameContent }) {
  const pairs = Array.isArray(game.pairs) ? game.pairs : [];

  // Create shuffled flat list of all cards
  const allCards: { text: string; type: "A" | "B"; pairId: number }[] = [];
  pairs.forEach((p) => {
    allCards.push({ text: p.cardA, type: "A", pairId: p.id ?? 0 });
    allCards.push({ text: p.cardB, type: "B", pairId: p.id ?? 0 });
  });
  // Shuffle
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
        {shuffled.map((card, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border-2 border-dashed p-3 min-h-[72px] flex items-center justify-center text-center text-sm font-medium leading-snug",
              card.type === "A"
                ? "border-[#107996]/40 bg-[#107996]/5 text-[#107996]"
                : "border-[#FE703A]/40 bg-[#FE703A]/5 text-[#FE703A]"
            )}
          >
            {card.text}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-400 text-center mb-1">
        Mavi kartlar = Kart A &nbsp;·&nbsp; Turuncu kartlar = Kart B
      </p>
    </div>
  );
}

// ─── PDF Downloads ────────────────────────────────────────────────────────────

async function downloadTablePDF(game: MatchingGameContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const pairs = Array.isArray(game.pairs) ? game.pairs : [];

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:     { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    tableHdr:  { flexDirection: "row", backgroundColor: "#f4f4f5", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingVertical: 6, paddingHorizontal: 8 },
    hdrNum:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: 20 },
    hdrCell:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    row:       { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
    rowNum:    { fontSize: 9, color: "#a1a1aa", width: 20 },
    cellA:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#18181b", flex: 1, marginRight: 8 },
    cellB:     { fontSize: 9, color: "#3f3f46", flex: 1 },
    box:       { borderRadius: 4, padding: 10, marginBottom: 8, marginTop: 14 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footerTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={game.title ?? "Kelime Eşleştirme"} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{game.title ?? "Kelime Eşleştirme"}</Text>

        <View style={S.infoRow}>
          {studentName ? <Text style={S.badge}>Öğrenci: {studentName}</Text> : null}
          <Text style={S.badge}>{MATCH_TYPE_LABEL[game.matchType] ?? game.matchType}</Text>
          <Text style={S.badge}>{DIFFICULTY_LABEL[game.difficulty] ?? game.difficulty}</Text>
          <Text style={S.badge}>{pairs.length} çift</Text>
          {game.theme ? <Text style={S.badge}>{game.theme}</Text> : null}
        </View>

        {/* Table */}
        <View style={{ borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4 }}>
          <View style={S.tableHdr}>
            <Text style={S.hdrNum}>#</Text>
            <Text style={S.hdrCell}>Kart A</Text>
            <Text style={S.hdrCell}>Kart B</Text>
          </View>
          {pairs.map((pair, i) => (
            <View key={i} style={[S.row, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
              <Text style={S.rowNum}>{pair.id ?? i + 1}</Text>
              <Text style={S.cellA}>{pair.cardA}</Text>
              <Text style={S.cellB}>{pair.cardB}</Text>
            </View>
          ))}
        </View>

        {game.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Nasıl Oynanır</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{game.instructions}</Text>
          </View>
        ) : null}

        {game.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{game.adaptations}</Text>
          </View>
        ) : null}

        {game.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{game.expertNotes}</Text>
          </View>
        ) : null}

        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footerTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(game.title ?? "esleştirme").replace(/\s+/g, "_")}_tablo.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadCardsPDF(game: MatchingGameContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const pairs = Array.isArray(game.pairs) ? game.pairs : [];

  // Build shuffled card list
  const cards: { text: string; type: "A" | "B" }[] = [];
  pairs.forEach((p) => {
    cards.push({ text: p.cardA, type: "A" });
    cards.push({ text: p.cardB, type: "B" });
  });
  // Deterministic shuffle using pair interleave (A B A B... but offset)
  const shuffled: typeof cards = [];
  const aCards = cards.filter((c) => c.type === "A");
  const bCards = cards.filter((c) => c.type === "B");
  const maxLen = Math.max(aCards.length, bCards.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < bCards.length) shuffled.push(bCards[i]);
    if (i < aCards.length) shuffled.push(aCards[i]);
  }

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 32, paddingBottom: 60 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 14, color: "#023435", marginBottom: 4 },
    subtitle:  { fontSize: 8, color: "#71717a", marginBottom: 16 },
    grid:      { flexDirection: "row", flexWrap: "wrap" },
    cardA:     { width: "30%", margin: "1.5%", minHeight: 64, borderWidth: 1, borderColor: "#93c5fd", borderRadius: 6, backgroundColor: "#eff6ff", padding: 8, justifyContent: "center", alignItems: "center" },
    cardB:     { width: "30%", margin: "1.5%", minHeight: 64, borderWidth: 1, borderColor: "#fdba74", borderRadius: 6, backgroundColor: "#fff7ed", padding: 8, justifyContent: "center", alignItems: "center" },
    cardText:  { fontSize: 9, textAlign: "center", lineHeight: 1.4, color: "#18181b" },
    legend:    { flexDirection: "row", marginBottom: 12, marginTop: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4, marginTop: 1 },
    legendTxt: { fontSize: 8, color: "#71717a", marginRight: 12 },
    // Answer key page
    ansTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 14, color: "#023435", marginBottom: 12 },
    ansRow:    { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
    ansNum:    { width: 20, fontSize: 9, color: "#a1a1aa", fontFamily: "NotoSans", fontWeight: "bold" },
    ansA:      { flex: 1, fontSize: 9, color: "#18181b", fontFamily: "NotoSans", fontWeight: "bold", marginRight: 4 },
    ansArrow:  { fontSize: 9, color: "#a1a1aa", marginRight: 4 },
    ansB:      { flex: 1, fontSize: 9, color: "#3f3f46" },
    footer:    { position: "absolute", bottom: 24, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 5 },
    footerTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={`${game.title ?? "Kelime Eşleştirme"} — Kesme Kartları`} author="LudenLab">
      {/* Sayfa 1: Kartlar */}
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{game.title ?? "Kelime Eşleştirme"}</Text>
        <Text style={S.subtitle}>
          Kartları kesin ve karıştırın · {studentName ? `Öğrenci: ${studentName} · ` : ""}
          {MATCH_TYPE_LABEL[game.matchType]} · {DIFFICULTY_LABEL[game.difficulty]} · {today}
        </Text>

        <View style={S.legend}>
          <View style={[S.legendDot, { backgroundColor: "#93c5fd" }]} />
          <Text style={S.legendTxt}>Mavi = Kart A</Text>
          <View style={[S.legendDot, { backgroundColor: "#fdba74" }]} />
          <Text style={S.legendTxt}>Turuncu = Kart B</Text>
        </View>

        <View style={S.grid}>
          {shuffled.map((card, i) => (
            <View key={i} style={card.type === "A" ? S.cardA : S.cardB}>
              <Text style={S.cardText}>{card.text}</Text>
            </View>
          ))}
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footerTxt}>{today}</Text>
        </View>
      </Page>

      {/* Sayfa 2: Cevap Anahtarı */}
      <Page size="A4" style={S.page}>
        <Text style={S.ansTitle}>Cevap Anahtarı</Text>
        {pairs.map((pair, i) => (
          <View key={i} style={S.ansRow}>
            <Text style={S.ansNum}>{pair.id ?? i + 1}.</Text>
            <Text style={S.ansA}>{pair.cardA}</Text>
            <Text style={S.ansArrow}>→</Text>
            <Text style={S.ansB}>{pair.cardB}</Text>
          </View>
        ))}
        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>LudenLab — ludenlab.com · Cevap Anahtarı</Text>
          <Text style={S.footerTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(game.title ?? "esleştirme").replace(/\s+/g, "_")}_kartlar.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MatchingGamePage() {
  const [students, setStudents]         = useState<Student[]>([]);
  const [curricula, setCurricula]       = useState<CurriculumItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,  setStudentId]  = useState("");
  const [matchType,  setMatchType]  = useState<MatchType>("synonym");
  const [pairCount,  setPairCount]  = useState<PairCount>("8");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [theme,      setTheme]      = useState("");
  const [goalId,     setGoalId]     = useState("");

  // Result state
  const [loading,      setLoading]      = useState(false);
  const [game,         setGame]         = useState<MatchingGameContent | null>(null);
  const [savedCardId,  setSavedCardId]  = useState<string | null>(null);
  const [downloading,  setDownloading]  = useState(false);
  const [formKey,      setFormKey]      = useState(0);
  const [viewMode,     setViewMode]     = useState<"table" | "cards">("table");
  const [showAnswers,  setShowAnswers]  = useState(false);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  // Available curriculum goals for selected student
  const availableGoals: { id: string; title: string }[] = curricula
    .filter((c) => selectedStudent?.curriculumIds?.includes(c.id))
    .flatMap((c) => c.goals.map((g) => ({ id: g.id, title: g.title })));

  const selectedGoalTitle = availableGoals.find((g) => g.id === goalId)?.title ?? "";

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/curriculum").then((r) => r.json()),
    ]).then(([sData, cData]) => {
      setStudents(sData.students ?? []);
      setCurricula(cData.curricula ?? []);
    }).finally(() => setStudentsLoading(false));
  }, []);

  function handleStudentChange(id: string) {
    setStudentId(id);
    setGoalId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setGame(null);
    setSavedCardId(null);
    setShowAnswers(false);
    setViewMode("table");

    try {
      const res = await fetch("/api/tools/matching-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:  studentId || undefined,
          matchType,
          pairCount,
          difficulty,
          theme:      theme || undefined,
          goalTitle:  selectedGoalTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setGame(data.game as MatchingGameContent);
      setSavedCardId(data.cardId ?? null);
      toast.success("Eşleştirme kartları üretildi!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setGame(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setStudentId("");
    setMatchType("synonym");
    setPairCount("8");
    setDifficulty("easy");
    setTheme("");
    setGoalId("");
    setShowAnswers(false);
    setViewMode("table");
  }

  async function handleDownloadTable() {
    if (!game) return;
    setDownloading(true);
    const t = toast.loading("PDF hazırlanıyor...");
    try {
      await downloadTablePDF(game, selectedStudent?.name);
      toast.success("Tablo PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadCards() {
    if (!game) return;
    setDownloading(true);
    const t = toast.loading("Kesme kartları hazırlanıyor...");
    try {
      await downloadCardsPDF(game, selectedStudent?.name);
      toast.success("Kesme kartları PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  const pairs = game ? (Array.isArray(game.pairs) ? game.pairs : []) : [];
  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#023435]/30 focus:border-[#023435]";
  const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <Link
          href="/tools"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Araçlara Dön
        </Link>
        <h1 className="text-xl font-bold text-[#023435]">Kelime Eşleştirme Oyunu</h1>
        <p className="text-sm text-zinc-500">
          Dil gelişimi için yazdırılabilir eşleştirme kartları ve oyunları üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] flex-1 min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci */}
              <div>
                <label className={labelCls}>
                  Öğrenci
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400">opsiyonel</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className={cn(inputCls, "cursor-pointer")}
                >
                  <option value="">
                    {studentsLoading ? "Yükleniyor..." : "Öğrenci seçin (opsiyonel)"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {selectedStudent && (
                  <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 flex flex-wrap gap-1.5">
                    {selectedStudent.birthDate && (
                      <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
                        {calcAge(selectedStudent.birthDate)}
                      </span>
                    )}
                    <span className={cn("rounded-full px-2 py-0.5 text-xs border", WORK_AREA_COLOR[selectedStudent.workArea] ?? "bg-zinc-100 text-zinc-600")}>
                      {WORK_AREA_LABEL[selectedStudent.workArea] ?? selectedStudent.workArea}
                    </span>
                    {selectedStudent.diagnosis && (
                      <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 truncate max-w-full">
                        {selectedStudent.diagnosis}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Eşleştirme Türü */}
              <div>
                <label className={labelCls}>Eşleştirme Türü</label>
                <div className="space-y-1.5">
                  {MATCH_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMatchType(opt.value)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                        matchType === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{opt.label}</span>
                      <span className="block text-[10px] text-zinc-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Çift Sayısı */}
              <div>
                <label className={labelCls}>Çift Sayısı</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAIR_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPairCount(n)}
                      className={cn(
                        "rounded-lg border py-2.5 text-xs font-semibold transition-colors",
                        pairCount === n
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zorluk */}
              <div>
                <label className={labelCls}>Zorluk Seviyesi</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDifficulty(opt.value)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-left transition-colors",
                        difficulty === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold text-center">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema */}
              <div>
                <label className={labelCls}>
                  Tema
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400">opsiyonel</span>
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={cn(inputCls, "cursor-pointer")}
                >
                  {THEME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Müfredat Hedefi */}
              {availableGoals.length > 0 && (
                <div>
                  <label className={labelCls}>
                    Müfredat Hedefi
                    <span className="ml-1.5 text-[10px] font-normal text-zinc-400">opsiyonel</span>
                  </label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    className={cn(inputCls, "cursor-pointer")}
                  >
                    <option value="">Hedef seçin (opsiyonel)</option>
                    {availableGoals.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Üretiliyor..." : "Eşleştirme Kartları Üret"}
              </button>
              <p className="text-center text-xs text-zinc-400">15 kredi kullanılacak</p>
            </form>
          </div>
        </div>

        {/* ── Sağ: Sonuç ── */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col min-h-0">
            {loading ? (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="text-center space-y-4 px-8">
                  <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
                  <LoadingMessages />
                </div>
              </div>
            ) : game ? (
              <>
                {/* View toggle + badges */}
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", MATCH_TYPE_COLOR[game.matchType] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                      {MATCH_TYPE_LABEL[game.matchType] ?? game.matchType}
                    </span>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", DIFFICULTY_COLOR[game.difficulty] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                      {DIFFICULTY_LABEL[game.difficulty] ?? game.difficulty}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
                      {pairs.length} çift
                    </span>
                    {game.theme && (
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
                        {game.theme}
                      </span>
                    )}
                  </div>
                  {/* View toggle */}
                  <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        viewMode === "table" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      Tablo
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        viewMode === "cards" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Kartlar
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-[#023435] mb-4">{game.title}</h2>

                  {viewMode === "table" ? (
                    /* Table view */
                    <div className="rounded-xl border border-zinc-200 overflow-hidden mb-5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="w-8 py-2.5 px-3 text-left text-xs font-semibold text-zinc-400">#</th>
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-zinc-600">Kart A</th>
                            <th className="py-2.5 px-3 text-left text-xs font-semibold text-zinc-600">Kart B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairs.map((pair: MatchingPair, i: number) => (
                            <tr key={pair.id ?? i} className={cn("border-b border-zinc-100 last:border-0", i % 2 === 1 && "bg-zinc-50/50")}>
                              <td className="py-2.5 px-3 text-xs text-zinc-400 font-medium">{pair.id ?? i + 1}</td>
                              <td className="py-2.5 px-3 text-sm text-zinc-800 font-medium">{pair.cardA}</td>
                              <td className="py-2.5 px-3 text-sm text-zinc-600">
                                {pair.cardB}
                                {pair.hint && (
                                  <span className="ml-1.5 text-[10px] text-zinc-400 italic">({pair.hint})</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Cards / printable view */
                    <div className="mb-5">
                      <PrintableCards game={game} />
                    </div>
                  )}

                  {/* Instructions */}
                  {game.instructions && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex gap-3 mb-4">
                      <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 mb-1">Nasıl Oynanır</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{game.instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Adaptations */}
                  {game.adaptations && (
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 mb-4">
                      <p className="text-xs font-semibold text-zinc-500 mb-1.5">Uyarlama Önerileri</p>
                      <p className="text-sm text-zinc-600 leading-relaxed">{game.adaptations}</p>
                    </div>
                  )}

                  {/* Expert notes */}
                  {game.expertNotes && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 mb-4">
                      <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800 mb-1">Uzman Notları</p>
                        <p className="text-xs text-amber-700 leading-relaxed">{game.expertNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Answer key */}
                  <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAnswers((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                    >
                      Cevap Anahtarı
                      {showAnswers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {showAnswers && (
                      <div className="p-4 space-y-1.5 bg-white">
                        {pairs.map((pair: MatchingPair, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-zinc-600">
                            <span className="w-5 shrink-0 font-semibold text-zinc-400">{pair.id ?? i + 1}.</span>
                            <span className="font-medium text-zinc-800">{pair.cardA}</span>
                            <span className="text-zinc-400">→</span>
                            <span>{pair.cardB}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadTable}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 transition-colors"
                  >
                    PDF İndir — Tablo
                  </button>
                  <button
                    onClick={handleDownloadCards}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg border border-[#023435]/30 bg-[#023435]/5 px-4 py-2 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 disabled:opacity-60 transition-colors"
                  >
                    PDF İndir — Kesme Kartları
                  </button>
                  {savedCardId && (
                    <Link
                      href="/cards"
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <Library className="h-3.5 w-3.5" />
                      Kütüphane
                    </Link>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Yeni Oyun
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="text-center px-8 space-y-2">
                  <div className="text-3xl">🃏</div>
                  <p className="text-sm font-medium text-zinc-500">Parametreleri ayarlayın</p>
                  <p className="text-xs text-zinc-400">Üretilen kartlar burada görünecek</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
