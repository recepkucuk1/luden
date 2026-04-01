"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Library, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";
import { PhonationView } from "@/components/cards/PhonationView";
import type { PhonationActivityContent } from "@/components/cards/PhonationView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOUND_GROUPS = [
  { label: "Sürtünme / Temas", sounds: ["/s/", "/z/", "/ş/", "/ç/", "/c/", "/j/"] },
  { label: "Akıcı",             sounds: ["/r/", "/l/", "/n/", "/m/"] },
  { label: "Patlayıcı",         sounds: ["/k/", "/g/", "/t/", "/d/", "/p/", "/b/"] },
  { label: "Diğer",             sounds: ["/f/", "/v/", "/h/", "/y/"] },
];

type ActivityType = "sound_hunt" | "bingo" | "snakes_ladders" | "word_chain" | "sound_maze";

const ACTIVITY_TYPE_OPTIONS: {
  value: ActivityType;
  label: string;
  desc: string;
  emoji: string;
  counts: number[];
  countLabel: (n: number) => string;
}[] = [
  {
    value: "sound_hunt",
    label: "Ses Avı",
    desc: "Sahnedeki hedef sesli nesneleri bul",
    emoji: "🔍",
    counts: [8, 12, 16],
    countLabel: (n) => `${n} nesne`,
  },
  {
    value: "bingo",
    label: "Tombala",
    desc: "Hedef sesli kelimelerle tombala kartı",
    emoji: "🎰",
    counts: [9, 16, 25],
    countLabel: (n) => n === 9 ? "3×3" : n === 16 ? "4×4" : "5×5",
  },
  {
    value: "snakes_ladders",
    label: "Yılan Merdiven",
    desc: "Hedef sesli kelimelerle oyun tahtası",
    emoji: "🐍",
    counts: [15, 20, 25],
    countLabel: (n) => `${n} kare`,
  },
  {
    value: "word_chain",
    label: "Kelime Zinciri",
    desc: "Son sesle başlayan yeni kelime zinciri",
    emoji: "🔗",
    counts: [8, 12, 16],
    countLabel: (n) => `${n} kelime`,
  },
  {
    value: "sound_maze",
    label: "Ses Labirenti",
    desc: "Hedef sesli kelimeleri takip ederek çık",
    emoji: "🌀",
    counts: [10, 15, 20],
    countLabel: (n) => `${n} kelime`,
  },
];

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy",   label: "Kolay", desc: "Sık kullanılan, somut kelimeler" },
  { value: "medium", label: "Orta",  desc: "Daha az sık, bazıları soyut" },
  { value: "hard",   label: "Zor",   desc: "Soyut kavramlar, çok heceli" },
];

const THEME_OPTIONS = [
  { value: "",                    label: "Tema yok (karışık)" },
  { value: "Hayvanlar",           label: "Hayvanlar" },
  { value: "Yiyecekler",          label: "Yiyecekler" },
  { value: "Mevsimler ve hava",   label: "Mevsimler ve hava" },
  { value: "Meslekler",           label: "Meslekler" },
  { value: "Okul eşyaları",       label: "Okul eşyaları" },
  { value: "Vücut bölümleri",     label: "Vücut bölümleri" },
  { value: "Spor ve oyunlar",     label: "Spor ve oyunlar" },
];

const LOADING_MSGS = [
  "Hedef ses analiz ediliyor...",
  "Aktivite tasarlanıyor...",
  "Türkçe kelime dağarcığı taranıyor...",
  "Oyun öğeleri hazırlanıyor...",
  "Talimatlar oluşturuluyor...",
  "Uzman notları ekleniyor...",
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

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadPhonationPDF(activity: PhonationActivityContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });
  // Disable hyphenation so Turkish words are never broken mid-syllable
  Font.registerHyphenationCallback((word) => [word]);

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const sounds = Array.isArray(activity.targetSounds) ? activity.targetSounds : [];

  const ACTIVITY_TYPE_LABEL: Record<string, string> = {
    sound_hunt:     "Ses Avı",
    bingo:          "Tombala",
    snakes_ladders: "Yılan Merdiven",
    word_chain:     "Kelime Zinciri",
    sound_maze:     "Ses Labirenti",
  };

  // A4 content width = 595 - 44*2 = 507pt. Row inner padding 8*2 = 16pt → cell area = 491pt.
  // Column widths: # = 40 (~8%), Kelime = flex:1 (~62%), Kare Türü / sağ sütun = 145 (~30%)
  const COL_NUM  = 40;
  const COL_TYPE = 145;

  const S = StyleSheet.create({
    page:     { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:  { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:    { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    // Table
    tblWrap:  { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
    tHdr:     { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 8 },
    thNum:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: COL_NUM },
    thCell:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    thType:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: COL_TYPE },
    tRow:     { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#f4f4f5", alignItems: "flex-start" },
    tdNum:    { fontSize: 9, color: "#a1a1aa", width: COL_NUM, paddingTop: 1 },
    tdCell:   { fontSize: 9, color: "#18181b", flex: 1 },
    tdType:   { width: COL_TYPE },
    // Type badge inside tdType
    typeBadge:{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start" },
    typeTxt:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8 },
    // Info/note boxes
    box:      { borderRadius: 4, padding: 10, marginBottom: 10, borderWidth: 1 },
    boxTitle: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 3 },
    boxText:  { fontSize: 9, lineHeight: 1.6 },
    footer:   { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt:  { fontSize: 8, color: "#a1a1aa" },
  });

  // ── shared helper: two-column table (# | text | right) ──────────────────────
  const Table = ({
    hdrLeft, hdrRight, rows,
  }: {
    hdrLeft: string;
    hdrRight: string;
    rows: { num: number | string; left: string; rightLabel: string; rightBg: string; rightColor: string }[];
  }) => (
    <View style={S.tblWrap}>
      <View style={S.tHdr}>
        <Text style={S.thNum}>#</Text>
        <Text style={S.thCell}>{hdrLeft}</Text>
        <Text style={S.thType}>{hdrRight}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[S.tRow, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
          <Text style={S.tdNum}>{r.num}</Text>
          <Text style={S.tdCell}>{r.left}</Text>
          <View style={S.tdType}>
            <View style={[S.typeBadge, { backgroundColor: r.rightBg }]}>
              <Text style={[S.typeTxt, { color: r.rightColor }]}>{r.rightLabel}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    // ── SES AVI ────────────────────────────────────────────────────────────────
    if (activity.activityType === "sound_hunt") {
      const objects = Array.isArray(activity.objects) ? activity.objects : [];
      const tableRows = objects.map((obj, i) => ({
        num: i + 1,
        left: obj.name,
        rightLabel: obj.hasTargetSound ? "Evet ✓" : "Hayır",
        rightBg:    obj.hasTargetSound ? "#dcfce7" : "#f4f4f5",
        rightColor: obj.hasTargetSound ? "#166534" : "#6b7280",
      }));
      return (
        <View>
          {activity.scene ? (
            <View style={[S.box, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
              <Text style={[S.boxTitle, { color: "#0369a1" }]}>Sahne</Text>
              <Text style={[S.boxText, { color: "#0c4a6e" }]}>{activity.scene}</Text>
            </View>
          ) : null}
          <Text style={S.secHdr}>Nesneler ({objects.length})</Text>
          <Table hdrLeft="Nesne" hdrRight="Hedef Ses?" rows={tableRows} />
        </View>
      );
    }

    // ── TOMBALA ────────────────────────────────────────────────────────────────
    if (activity.activityType === "bingo") {
      const grid  = activity.grid;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      // Group cells into rows of grid.cols
      const rows: (typeof cells)[] = [];
      for (let r = 0; r < grid.rows; r++) {
        rows.push(cells.slice(r * grid.cols, (r + 1) * grid.cols));
      }
      // Cell width: fit grid.cols into 507pt, no gap between
      const cellW = Math.floor(507 / grid.cols) - 2; // subtract border
      return (
        <View>
          <Text style={S.secHdr}>Tombala Kartı — {grid.rows}×{grid.cols}</Text>
          {rows.map((rowCells, ri) => (
            <View key={ri} style={{ flexDirection: "row", marginBottom: 2 }}>
              {rowCells.map((cell, ci) => (
                <View
                  key={ci}
                  style={{
                    width: cellW,
                    marginRight: ci < rowCells.length - 1 ? 2 : 0,
                    borderWidth: 2,
                    borderColor: "#f59e0b",
                    borderRadius: 3,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    backgroundColor: "#fffbeb",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, textAlign: "center", color: "#92400e" }}>
                    {cell.word}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // ── YILAN MERDİVEN ─────────────────────────────────────────────────────────
    if (activity.activityType === "snakes_ladders") {
      const grid = activity.grid;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      const total = cells.length;
      const tableRows = cells.map((cell) => {
        const isFinish = cell.position === total;
        if (cell.isLadder) return { num: cell.position, left: cell.word, rightLabel: "↑ Merdiven", rightBg: "#16a34a", rightColor: "#fff" };
        if (cell.isSnake)  return { num: cell.position, left: cell.word, rightLabel: "↓ Yılan",   rightBg: "#dc2626", rightColor: "#fff" };
        if (isFinish)      return { num: cell.position, left: cell.word, rightLabel: "Bitis",      rightBg: "#f59e0b", rightColor: "#fff" };
        return                    { num: cell.position, left: cell.word, rightLabel: "Normal",     rightBg: "transparent", rightColor: "#a1a1aa" };
      });
      return (
        <View>
          <Text style={S.secHdr}>Oyun Tahtası ({total} kare)</Text>
          <Table hdrLeft="Kelime" hdrRight="Kare Türü" rows={tableRows} />
        </View>
      );
    }

    // ── KELİME ZİNCİRİ ─────────────────────────────────────────────────────────
    if (activity.activityType === "word_chain") {
      const chain = Array.isArray(activity.wordChain) ? activity.wordChain : [];
      const tableRows = chain.map((item) => ({
        num: item.order,
        left: item.word,
        rightLabel: item.connection ?? "",
        rightBg: "transparent",
        rightColor: "#6b7280",
      }));
      return (
        <View>
          <Text style={S.secHdr}>Kelime Zinciri ({chain.length} kelime)</Text>
          <Table hdrLeft="Kelime" hdrRight="Bağlantı" rows={tableRows} />
        </View>
      );
    }

    // ── SES LABİRENTİ ──────────────────────────────────────────────────────────
    if (activity.activityType === "sound_maze") {
      const grid = activity.grid;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      const tableRows = cells.map((cell, i) => ({
        num: i === 0 ? "GİRİŞ" : i === cells.length - 1 ? "ÇIKIŞ" : cell.position ?? i + 1,
        left: cell.word,
        rightLabel: cell.hasTargetSound ? "✓ Doğru Yol" : "✗ Yanlış",
        rightBg:    cell.hasTargetSound ? "#dcfce7" : "#fee2e2",
        rightColor: cell.hasTargetSound ? "#166534" : "#991b1b",
      }));
      return (
        <View>
          <Text style={S.secHdr}>Ses Labirenti ({cells.length} kelime)</Text>
          <Table hdrLeft="Kelime" hdrRight="Doğru Yol?" rows={tableRows} />
        </View>
      );
    }

    return null;
  };

  const Doc = () => (
    <Document title={activity.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{activity.title}</Text>

        <View style={S.infoRow}>
          {studentName ? <Text style={S.badge}>Öğrenci: {studentName}</Text> : null}
          <Text style={S.badge}>{ACTIVITY_TYPE_LABEL[activity.activityType] ?? activity.activityType}</Text>
          <Text style={S.badge}>{activity.difficulty === "easy" ? "Kolay" : activity.difficulty === "medium" ? "Orta" : "Zor"}</Text>
          {sounds.map((s, i) => <Text key={i} style={S.badge}>{s}</Text>)}
          {activity.theme ? <Text style={S.badge}>{activity.theme}</Text> : null}
        </View>

        {renderContent()}

        {activity.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Nasıl Oynanır</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.instructions}</Text>
          </View>
        ) : null}

        {activity.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.adaptations}</Text>
          </View>
        ) : null}

        {activity.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{activity.expertNotes}</Text>
          </View>
        ) : null}

        <View style={S.footer} fixed>
          <Text style={S.footTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(activity.title ?? "sesletim").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PhonationPage() {
  const [students, setStudents]               = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,     setStudentId]     = useState("");
  const [targetSounds,  setTargetSounds]  = useState<string[]>([]);
  const [activityType,  setActivityType]  = useState<ActivityType>("sound_hunt");
  const [difficulty,    setDifficulty]    = useState<Difficulty>("easy");
  const [itemCount,     setItemCount]     = useState<number>(8);
  const [theme,         setTheme]         = useState("");

  // Result state
  const [loading,     setLoading]     = useState(false);
  const [activity,    setActivity]    = useState<PhonationActivityContent | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [formKey,     setFormKey]     = useState(0);

  const selectedStudent    = students.find((s) => s.id === studentId) ?? null;
  const selectedTypeOption = ACTIVITY_TYPE_OPTIONS.find((o) => o.value === activityType)!;

  // When activity type changes, reset item count to first option
  function handleActivityTypeChange(type: ActivityType) {
    setActivityType(type);
    const opt = ACTIVITY_TYPE_OPTIONS.find((o) => o.value === type);
    if (opt) setItemCount(opt.counts[0]!);
  }

  function toggleSound(sound: string) {
    setTargetSounds((prev) =>
      prev.includes(sound) ? prev.filter((s) => s !== sound) : [...prev, sound]
    );
  }

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .finally(() => setStudentsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (targetSounds.length === 0) {
      toast.error("En az bir hedef ses seçin");
      return;
    }

    setLoading(true);
    setActivity(null);
    setSavedCardId(null);

    try {
      const res = await fetch("/api/tools/phonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:    studentId || undefined,
          targetSounds,
          activityType,
          difficulty,
          itemCount,
          theme:        theme || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setActivity(data.activity as PhonationActivityContent);
      setSavedCardId(data.cardId ?? null);
      toast.success("Sesletim aktivitesi üretildi!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setActivity(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setStudentId("");
    setTargetSounds([]);
    setActivityType("sound_hunt");
    setDifficulty("easy");
    setItemCount(8);
    setTheme("");
  }

  async function handleDownload() {
    if (!activity) return;
    setDownloading(true);
    const t = toast.loading("PDF hazırlanıyor...");
    try {
      await downloadPhonationPDF(activity, selectedStudent?.name);
      toast.success("PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40 placeholder:text-[#023435]/30";
  const labelCls = "block text-xs font-bold text-[#023435]/70 mb-1.5 uppercase tracking-wide";

  return (
    <div
      className="w-full flex flex-col relative md:h-[calc(100vh-0px)] md:overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#107996]/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:h-full flex flex-col">
      {/* Header */}
      <div className="mb-5 shrink-0 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/70 px-5 py-4 shadow-[0_2px_8px_rgba(2,52,53,0.04)]">
        <Link
          href="/tools"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#023435]/50 hover:text-[#023435] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Araçlara Dön
        </Link>
        <h1 className="text-xl font-extrabold text-[#023435] tracking-tight">Sesletim Aktivitesi Üretici</h1>
        <p className="text-sm text-[#023435]/60 mt-0.5">
          Hedef ses çalışmaları için eğlenceli ve yazdırılabilir oyun aktiviteleri üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr] md:flex-1 md:min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col md:min-h-0">
          <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(2,52,53,0.04)] overflow-y-auto no-scrollbar md:flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci */}
              <div>
                <label className={labelCls}>
                  Öğrenci
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400">opsiyonel</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
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
                  <div className="mt-2 rounded-xl border border-white/80 bg-white/50 backdrop-blur-sm px-3 py-2.5 flex flex-wrap gap-1.5">
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

              {/* Hedef Sesler */}
              <div>
                <label className={labelCls}>
                  Hedef Ses(ler)
                  {targetSounds.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5">
                      {targetSounds.map((s) => (
                        <span key={s} className="rounded-full bg-[#023435]/10 text-[#023435] px-1.5 py-0.5 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  {SOUND_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-semibold text-zinc-400 mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.sounds.map((sound) => (
                          <button
                            key={sound}
                            type="button"
                            onClick={() => toggleSound(sound)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                              targetSounds.includes(sound)
                                ? "border-[#023435] bg-[#023435] text-white"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                            )}
                          >
                            {sound}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aktivite Türü */}
              <div>
                <label className={labelCls}>Aktivite Türü</label>
                <div className="space-y-1.5">
                  {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleActivityTypeChange(opt.value)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left transition-colors flex items-start gap-2",
                        activityType === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="text-base shrink-0">{opt.emoji}</span>
                      <div>
                        <span className="block text-xs font-semibold">{opt.label}</span>
                        <span className="block text-[10px] text-zinc-400">{opt.desc}</span>
                      </div>
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
                        "rounded-lg border px-2 py-2.5 text-center transition-colors",
                        difficulty === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Öğe Sayısı */}
              <div>
                <label className={labelCls}>
                  {activityType === "bingo" ? "Kart Boyutu" : activityType === "snakes_ladders" ? "Kare Sayısı" : activityType === "word_chain" ? "Kelime Sayısı" : activityType === "sound_maze" ? "Kelime Sayısı" : "Nesne Sayısı"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTypeOption.counts.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setItemCount(n)}
                      className={cn(
                        "rounded-lg border py-2.5 text-xs font-semibold transition-colors",
                        itemCount === n
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {selectedTypeOption.countLabel(n)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema */}
              <div>
                <label className={labelCls}>Tema <span className="font-normal text-zinc-400">(opsiyonel)</span></label>
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || targetSounds.length === 0}
                className="w-full rounded-xl bg-[#FE703A] py-3 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Üretiliyor..." : "Aktivite Üret"}
              </button>
              <p className="text-center text-[11px] text-zinc-400 -mt-3">15 kredi kullanılacak</p>

            </form>
          </div>
        </div>

        {/* ── Sağ: Sonuç ── */}
        <div className="flex flex-col md:min-h-0">
          {loading ? (
            <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.04)] p-8 flex-col gap-4">
              <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
              <LoadingMessages />
            </div>
          ) : activity ? (
            <div className="flex flex-col gap-4 md:flex-1 md:min-h-0">
              {/* Action bar */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
                >
                  {downloading ? "Hazırlanıyor…" : "PDF İndir"}
                </button>
                {savedCardId && (
                  <Link
                    href={`/cards/${savedCardId}`}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    <Library className="h-3.5 w-3.5" />
                    Kütüphanede Gör
                  </Link>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Yeni Aktivite
                </button>
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(2,52,53,0.04)] overflow-y-auto no-scrollbar md:flex-1">
                <PhonationView activity={activity} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-[#023435]/15 bg-white/40 backdrop-blur-xl p-8 flex-col text-center">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Aktivite burada görünecek</p>
              <p className="text-xs text-zinc-400">
                Sol formu doldurun ve "Aktivite Üret" butonuna tıklayın.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
