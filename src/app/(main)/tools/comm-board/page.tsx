"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Library } from "lucide-react";
import { CommBoardView } from "@/components/cards/CommBoardView";
import type { CommBoardContent } from "@/components/cards/CommBoardView";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
}

type BoardType = "basic_needs" | "emotions" | "daily_routines" | "school" | "social" | "requests" | "custom";
type Layout    = "grid" | "strip";
type TextMode  = "word_only" | "word_sentence";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARD_TYPE_OPTIONS: { value: BoardType; label: string; emoji: string; desc: string }[] = [
  { value: "basic_needs",    label: "Temel İhtiyaçlar",  emoji: "💧", desc: "Yemek, su, tuvalet, uyku, acı/ağrı" },
  { value: "emotions",       label: "Duygular",           emoji: "😊", desc: "Mutlu, üzgün, kızgın, korkmuş, şaşkın, yorgun" },
  { value: "daily_routines", label: "Günlük Rutinler",    emoji: "🌅", desc: "Uyanma, kahvaltı, okul, oyun, banyo, uyku" },
  { value: "school",         label: "Okul Aktiviteleri",  emoji: "📚", desc: "Ders, teneffüs, yemek, spor, müzik, resim" },
  { value: "social",         label: "Sosyal İfadeler",    emoji: "👋", desc: "Merhaba, hoşça kal, teşekkürler, lütfen, evet, hayır" },
  { value: "requests",       label: "İstek ve Seçim",     emoji: "🙋", desc: "İstiyorum, istemiyorum, bu, şu, daha, bitti" },
  { value: "custom",         label: "Özel",               emoji: "✏️", desc: "Kendi kategorinizi tanımlayın" },
];

const SYMBOL_COUNT_OPTIONS: { value: number; label: string; grid: string }[] = [
  { value: 4,  label: "4",  grid: "2×2" },
  { value: 6,  label: "6",  grid: "2×3" },
  { value: 9,  label: "9",  grid: "3×3" },
  { value: 12, label: "12", grid: "3×4" },
];

const LOADING_MSGS = [
  "İletişim ihtiyaçları analiz ediliyor...",
  "Semboller tasarlanıyor...",
  "Fitzgerald renk sistemi uygulanıyor...",
  "Görsel açıklamalar oluşturuluyor...",
  "Veli rehberi hazırlanıyor...",
  "Uzman önerileri ekleniyor...",
];

// ─── Loading ──────────────────────────────────────────────────────────────────

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

// ─── Board PDF ────────────────────────────────────────────────────────────────

async function downloadBoardOnlyPDF(board: CommBoardContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  const colorCoding = board.colorCoding !== false;
  const cells       = Array.isArray(board.cells) ? board.cells : [];
  const cols        = board.cols ?? 3;
  const rows        = board.rows ?? Math.ceil(cells.length / cols);
  const today       = formatDate(new Date(), "medium");

  const FG_BG: Record<string, string> = {
    yellow: "#FEF3C7", green: "#D1FAE5", blue: "#DBEAFE",
    pink: "#FCE7F3",   orange: "#FFEDD5", white: "#F9FAFB",
  };
  const FG_BORDER: Record<string, string> = {
    yellow: "#F59E0B", green: "#10B981", blue: "#3B82F6",
    pink: "#EC4899",   orange: "#F97316", white: "#D4D4D8",
  };
  const FG_TEXT: Record<string, string> = {
    yellow: "#92400E", green: "#065F46", blue: "#1E3A8A",
    pink: "#831843",   orange: "#7C2D12", white: "#3F3F46",
  };

  // A4: 595pt wide, 842pt tall, padding 40 on each side → 515pt content
  // Cell width = (515 - gap*(cols-1)) / cols, gap=4
  const CONTENT_W = 515;
  const GAP = 4;
  const cellW = Math.floor((CONTENT_W - GAP * (cols - 1)) / cols);
  // Each row height: target ~120pt minimum
  const CONTENT_H = 842 - 40 - 40 - 50 - rows * GAP; // 50 for header
  const cellH = Math.floor(CONTENT_H / rows);

  const S = StyleSheet.create({
    page:     { fontFamily: "NotoSans", padding: 40, paddingBottom: 50 },
    header:   { marginBottom: 12 },
    title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 16, color: "#023435", marginBottom: 2 },
    subtitle: { fontSize: 9, color: "#71717a" },
    row:      { flexDirection: "row" },
    cell:     { borderWidth: 2, borderRadius: 6, padding: 6, flexDirection: "column", alignItems: "center" },
    cellWord: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 12, textAlign: "center", marginBottom: 4 },
    cellBox:  { flex: 1, width: "100%", borderWidth: 1, borderRadius: 4, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    footer:   { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 5 },
    footTxt:  { fontSize: 7, color: "#a1a1aa" },
  });

  // Build grid rows
  const gridRows: (typeof cells)[] = [];
  for (let r = 0; r < rows; r++) {
    gridRows.push(cells.slice(r * cols, (r + 1) * cols));
  }

  const Doc = () => (
    <Document title={board.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.title}>{board.title}</Text>
          <Text style={S.subtitle}>
            {studentName ? `Öğrenci: ${studentName} · ` : ""}
            {rows}×{cols} İletişim Panosu · {today}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          {gridRows.map((rowCells, ri) => (
            <View key={ri} style={[S.row, { marginBottom: ri < rows - 1 ? GAP : 0 }]}>
              {rowCells.map((cell, ci) => {
                const color = colorCoding ? (cell.fitzgeraldColor ?? "white") : "white";
                return (
                  <View
                    key={ci}
                    style={[
                      S.cell,
                      {
                        width: cellW,
                        height: cellH,
                        marginRight: ci < rowCells.length - 1 ? GAP : 0,
                        backgroundColor: FG_BG[color] ?? "#F9FAFB",
                        borderColor: FG_BORDER[color] ?? "#D4D4D8",
                        borderStyle: "dashed",
                      },
                    ]}
                  >
                    <Text style={[S.cellWord, { color: FG_TEXT[color] ?? "#3F3F46" }]}>{cell.word}</Text>
                    <View style={[S.cellBox, { borderColor: FG_BORDER[color] ?? "#D4D4D8", borderStyle: "dashed" }]} />
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footTxt}>Görsel iletişim panosu — sembol yapıştırın</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${board.title.replace(/\s+/g, "_")}_pano.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadFullReportPDF(board: CommBoardContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  const colorCoding = board.colorCoding !== false;
  const cells       = Array.isArray(board.cells) ? board.cells : [];
  const today       = formatDate(new Date(), "medium");

  const FG_BG: Record<string, string> = {
    yellow: "#FEF3C7", green: "#D1FAE5", blue: "#DBEAFE",
    pink: "#FCE7F3",   orange: "#FFEDD5", white: "#F9FAFB",
  };
  const FG_TEXT: Record<string, string> = {
    yellow: "#92400E", green: "#065F46", blue: "#1E3A8A",
    pink: "#831843",   orange: "#7C2D12", white: "#3F3F46",
  };

  const BOARD_TYPE_LABEL: Record<string, string> = {
    basic_needs: "Temel İhtiyaçlar", emotions: "Duygular",
    daily_routines: "Günlük Rutinler", school: "Okul Aktiviteleri",
    social: "Sosyal İfadeler", requests: "İstek ve Seçim", custom: "Özel",
  };

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:     { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    tblWrap:   { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
    tHdr:      { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 5, paddingHorizontal: 8 },
    thPos:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: 28 },
    thWord:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: 80 },
    thDesc:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    thColor:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: 70 },
    tRow:      { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#f4f4f5", alignItems: "flex-start" },
    tdPos:     { fontSize: 9, color: "#a1a1aa", width: 28, paddingTop: 1 },
    tdWord:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#18181b", width: 80 },
    tdDesc:    { fontSize: 9, color: "#52525b", flex: 1, lineHeight: 1.5 },
    tdColor:   { width: 70 },
    colorBadge:{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start" },
    colorTxt:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 7 },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10, borderWidth: 1 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 3 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt:   { fontSize: 8, color: "#a1a1aa" },
  });

  const COLOR_LABEL: Record<string, string> = {
    yellow: "Sarı — İsim", green: "Yeşil — Fiil", blue: "Mavi — Sıfat",
    pink: "Pembe — Sosyal", orange: "Turuncu — Soru", white: "Beyaz — Diğer",
  };

  const Doc = () => (
    <Document title={board.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{board.title}</Text>
        <View style={S.infoRow}>
          {studentName ? <Text style={S.badge}>Öğrenci: {studentName}</Text> : null}
          <Text style={S.badge}>{BOARD_TYPE_LABEL[board.boardType] ?? board.boardType}</Text>
          <Text style={S.badge}>{(board.rows ?? 3)}×{(board.cols ?? 3)} — {board.symbolCount ?? cells.length} sembol</Text>
          <Text style={S.badge}>{board.layout === "grid" ? "Grid" : "Satır"}</Text>
          {colorCoding ? <Text style={S.badge}>Fitzgerald renk kodu</Text> : null}
          <Text style={S.badge}>{today}</Text>
        </View>

        <Text style={S.secHdr}>Semboller ({cells.length} hücre)</Text>
        <View style={S.tblWrap}>
          <View style={S.tHdr}>
            <Text style={S.thPos}>#</Text>
            <Text style={S.thWord}>Kelime</Text>
            <Text style={S.thDesc}>Görsel Açıklama</Text>
            {colorCoding ? <Text style={S.thColor}>Renk</Text> : null}
          </View>
          {cells.map((cell, i) => {
            const color = colorCoding ? (cell.fitzgeraldColor ?? "white") : "white";
            return (
              <View key={i} style={[S.tRow, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
                <Text style={S.tdPos}>{cell.position ?? i + 1}</Text>
                <Text style={S.tdWord}>{cell.word}{cell.sentence ? `\n"${cell.sentence}"` : ""}</Text>
                <Text style={S.tdDesc}>{cell.visualDescription}{cell.usage ? `\n↳ ${cell.usage}` : ""}</Text>
                {colorCoding ? (
                  <View style={S.tdColor}>
                    <View style={[S.colorBadge, { backgroundColor: FG_BG[color] ?? "#F9FAFB" }]}>
                      <Text style={[S.colorTxt, { color: FG_TEXT[color] ?? "#3F3F46" }]}>{COLOR_LABEL[color] ?? color}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {board.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Kullanım Talimatları</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{board.instructions}</Text>
          </View>
        ) : null}

        {board.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{board.expertNotes}</Text>
          </View>
        ) : null}

        {board.homeGuidance ? (
          <View style={[S.box, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
            <Text style={[S.boxTitle, { color: "#1e40af" }]}>Veli Rehberi</Text>
            <Text style={[S.boxText, { color: "#1e3a8a" }]}>{board.homeGuidance}</Text>
          </View>
        ) : null}

        {board.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{board.adaptations}</Text>
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
  a.download = `${board.title.replace(/\s+/g, "_")}_tam_rapor.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommBoardPage() {
  const [students, setStudents]           = useState<Student[]>([]);
  const [studentId, setStudentId]         = useState("");
  const [boardType, setBoardType]         = useState<BoardType>("basic_needs");
  const [customCategory, setCustomCategory] = useState("");
  const [symbolCount, setSymbolCount]     = useState(9);
  const [layout, setLayout]               = useState<Layout>("grid");
  const [textMode, setTextMode]           = useState<TextMode>("word_sentence");
  const [colorCoding, setColorCoding]     = useState(true);

  const [generating, setGenerating]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [savedCardId, setSavedCardId]     = useState<string | null>(null);
  const [board, setBoard]                 = useState<CommBoardContent | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [downloadingBoard, setDownloadingBoard]   = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    fetch("/api/students?limit=200")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }, []);

  const selectedStudent = students.find((s) => s.id === studentId);

  async function handleGenerate() {
    if (boardType === "custom" && !customCategory.trim()) {
      toast.error("Lütfen özel kategori adını girin");
      return;
    }
    setGenerating(true);
    setSavedCardId(null);
    setPendingCardId(null);
    try {
      const res = await fetch("/api/tools/comm-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:      studentId || undefined,
          boardType,
          customCategory: boardType === "custom" ? customCategory.trim() : undefined,
          symbolCount,
          layout,
          textMode,
          colorCoding,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setBoard(data.board as CommBoardContent);
      setPendingCardId(data.cardId ?? null);
      toast.success("İletişim panosu oluşturuldu");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!pendingCardId) { toast.error("Kaydedilecek pano bulunamadı"); return; }
    setSavedCardId(pendingCardId);
    toast.success("Kütüphaneye kaydedildi");
  }

  async function handleDownloadBoard() {
    if (!board) return;
    setDownloadingBoard(true);
    const t = toast.loading("Pano PDF hazırlanıyor…");
    try {
      await downloadBoardOnlyPDF(board, selectedStudent?.name);
      toast.success("Pano PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloadingBoard(false);
    }
  }

  async function handleDownloadReport() {
    if (!board) return;
    setDownloadingReport(true);
    const t = toast.loading("Tam rapor PDF hazırlanıyor…");
    try {
      await downloadFullReportPDF(board, selectedStudent?.name);
      toast.success("Tam rapor PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloadingReport(false);
    }
  }

  function handleReset() {
    setBoard(null);
    setPendingCardId(null);
    setSavedCardId(null);
  }

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#107996]/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tools" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#023435]/50 dark:text-muted-foreground hover:text-[#023435] dark:hover:text-foreground dark:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Araçlara Dön
          </Link>
          <h1 className="text-2xl font-bold text-[#023435] dark:text-foreground">İletişim Panosu Üretici</h1>
          <p className="mt-1 text-sm text-[#023435]/60 dark:text-muted-foreground">
            Alternatif ve destekleyici iletişim için kişiselleştirilmiş görsel iletişim panoları üretin.
          </p>
        </div>

        {/* Form */}
        {!board && (
          <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(2,52,53,0.04)] space-y-6">

            {/* Student */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Öğrenci (isteğe bağlı)</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
              >
                <option value="">— Öğrenci seçin —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {selectedStudent && (
                <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#023435]/10 text-[#023435] dark:text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{selectedStudent.name}</p>
                    {selectedStudent.diagnosis && (
                      <p className="text-xs text-zinc-500">{selectedStudent.diagnosis}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Board type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Pano Türü</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BOARD_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setBoardType(opt.value); if (opt.value !== "custom") setCustomCategory(""); }}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                      boardType === opt.value
                        ? "border-[#023435] bg-[#023435]/5"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <div>
                      <p className={`text-xs font-semibold ${boardType === opt.value ? "text-[#023435] dark:text-foreground" : "text-zinc-700"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {boardType === "custom" && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Kategori adını yazın (örn: Spor aktiviteleri)"
                  className="mt-2 w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] dark:text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
                />
              )}
            </div>

            {/* Symbol count */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Sembol Sayısı</label>
              <div className="flex gap-2 flex-wrap">
                {SYMBOL_COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSymbolCount(opt.value)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                      symbolCount === opt.value
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435] dark:text-foreground"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {opt.label}
                    <span className="ml-1 text-xs text-zinc-400">({opt.grid})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Düzen</label>
              <div className="flex gap-2">
                {([["grid", "Grid", "Satır ve sütun"], ["strip", "Satır", "Tek yatay şerit"]] as const).map(([v, l, d]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLayout(v)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left ${
                      layout === v
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435] dark:text-foreground"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {l}
                    <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">{d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text mode */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Metin Dili</label>
              <div className="flex gap-2">
                {([["word_only", "Sadece kelime", "Su"], ["word_sentence", "Kelime + cümle", "Su istiyorum"]] as const).map(([v, l, ex]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTextMode(v)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left ${
                      textMode === v
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435] dark:text-foreground"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {l}
                    <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">Örn: &quot;{ex}&quot;</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color coding toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#023435]/70 dark:text-foreground/80">Fitzgerald Renk Kodlaması</p>
                <p className="text-xs text-zinc-400 mt-0.5">İsim=Sarı · Fiil=Yeşil · Sıfat=Mavi · Sosyal=Pembe · Soru=Turuncu</p>
              </div>
              <button
                type="button"
                onClick={() => setColorCoding((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${colorCoding ? "bg-[#023435]" : "bg-zinc-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${colorCoding ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-xl bg-[#FE703A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating ? "Pano üretiliyor…" : "İletişim Panosu Üret"}
              </button>
              <p className="mt-2 text-center text-xs text-zinc-400">15 kredi kullanılacak</p>
            </div>

            {generating && (
              <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm py-4">
                <LoadingMessages />
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {board && (
          <div className="space-y-6">
            <CommBoardView board={board} />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadBoard}
                disabled={downloadingBoard || downloadingReport}
                className="flex items-center gap-1.5 rounded-xl bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
              >
                {downloadingBoard ? "Hazırlanıyor…" : "PDF İndir — Pano"}
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={downloadingBoard || downloadingReport}
                className="flex items-center gap-1.5 rounded-xl border border-[#023435]/30 bg-[#023435]/5 px-4 py-2.5 text-sm font-semibold text-[#023435] dark:text-foreground hover:bg-[#023435]/10 dark:hover:bg-accent/50 transition-colors disabled:opacity-60"
              >
                {downloadingReport ? "Hazırlanıyor…" : "PDF İndir — Tam Rapor"}
              </button>
              {savedCardId ? (
                <Link
                  href={`/cards/${savedCardId}`}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <Library className="h-4 w-4" /> Kütüphanede Gör
                </Link>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !pendingCardId}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
                >
                  <Library className="h-4 w-4" />
                  {saving ? "Kaydediliyor…" : "Kütüphaneye Kaydet"}
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Yeni Pano Üret
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

