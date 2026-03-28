"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Library, Plus, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";
import { SessionSummaryView, type SessionSummaryContent } from "@/components/cards/SessionSummaryView";

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
  code: string;
  title: string;
  isMainGoal: boolean;
}

interface CurriculumItem {
  id: string;
  area: string;
  title: string;
  goals: CurriculumGoal[];
}

interface GoalEntry {
  tempId: string;
  goalId: string;   // "" for custom goals
  title: string;
  accuracy: number;
  cueLevel: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATION_OPTIONS = ["20", "30", "40", "45", "60"] as const;
type Duration = (typeof DURATION_OPTIONS)[number];

const SESSION_TYPE_OPTIONS = [
  { value: "individual",     label: "Bireysel Oturum" },
  { value: "group",          label: "Grup Oturumu" },
  { value: "assessment",     label: "Değerlendirme Oturumu" },
  { value: "parent_meeting", label: "Veli Görüşmesi" },
] as const;
type SessionType = (typeof SESSION_TYPE_OPTIONS)[number]["value"];

const PERFORMANCE_OPTIONS = [
  { value: "above_target",  label: "Beklenenin Üstünde" },
  { value: "on_target",     label: "Hedefle Uyumlu" },
  { value: "progressing",   label: "Gelişim Gösteriyor" },
  { value: "needs_support", label: "Ek Destek Gerekiyor" },
  { value: "not_assessed",  label: "Değerlendirme Yapılamadı" },
] as const;
type OverallPerformance = (typeof PERFORMANCE_OPTIONS)[number]["value"];

const CUE_LEVELS = [
  "Bağımsız",
  "Minimum İpucu",
  "Orta İpucu",
  "Maksimum İpucu",
  "Tam Destek",
];

const LOADING_MSGS = [
  "Öğrenci profili analiz ediliyor...",
  "Oturum hedefleri değerlendiriliyor...",
  "Performans analizi yapılıyor...",
  "Veli notu hazırlanıyor...",
  "Rapor yapılandırılıyor...",
  "Son dokunuşlar yapılıyor...",
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

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

// ─── PDF Downloads ─────────────────────────────────────────────────────────────

async function downloadFullPDF(summary: SessionSummaryContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const goals = Array.isArray(summary.goalPerformance) ? summary.goalPerformance : [];

  function parseAccPct(acc: string | number): number {
    if (typeof acc === "number") return Math.min(100, Math.max(0, acc));
    const m = String(acc).match(/\d+/);
    return m ? Math.min(100, Math.max(0, parseInt(m[0]))) : 0;
  }
  function barColor(pct: number): string {
    if (pct >= 81) return "#16a34a";
    if (pct >= 61) return "#ca8a04";
    if (pct >= 31) return "#FE703A";
    return "#ef4444";
  }

  const S = StyleSheet.create({
    page:       { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:      { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    infoBadge:  { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    goalCard:   { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, padding: 10, marginBottom: 8 },
    goalTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#18181b", marginBottom: 6 },
    barBg:      { height: 5, backgroundColor: "#f4f4f5", borderRadius: 3, marginBottom: 6 },
    cueBadge:   { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 },
    bodyText:   { fontSize: 9, lineHeight: 1.6, color: "#3f3f46" },
    recRow:     { flexDirection: "row", marginTop: 4 },
    recBullet:  { fontSize: 8, color: "#a1a1aa", marginRight: 4, marginTop: 1 },
    recText:    { flex: 1, fontSize: 8, color: "#71717a", lineHeight: 1.5 },
    box:        { borderRadius: 4, padding: 10, marginBottom: 10 },
    boxTitle:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:    { fontSize: 9, lineHeight: 1.6 },
    footer:     { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footerTxt:  { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={summary.title ?? "Oturum Özeti"} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{summary.title ?? "Oturum Özeti"}</Text>

        {/* Info row */}
        <View style={S.infoRow}>
          {studentName ? <Text style={S.infoBadge}>Öğrenci: {studentName}</Text> : null}
          {summary.sessionInfo?.date     ? <Text style={S.infoBadge}>{summary.sessionInfo.date}</Text> : null}
          {summary.sessionInfo?.duration ? <Text style={S.infoBadge}>{summary.sessionInfo.duration}</Text> : null}
          {summary.sessionInfo?.type     ? <Text style={S.infoBadge}>{summary.sessionInfo.type}</Text> : null}
        </View>

        {/* Goals */}
        {goals.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={S.secHdr}>Çalışılan Hedefler</Text>
            {goals.map((g, i) => {
              const pct = parseAccPct(g.accuracy);
              return (
                <View key={i} style={S.goalCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={[S.goalTitle, { flex: 1, marginRight: 8 }]}>{g.goal}</Text>
                    <Text style={{ fontSize: 9, fontFamily: "NotoSans", fontWeight: "bold", color: barColor(pct) }}>{g.accuracy}</Text>
                  </View>
                  <View style={S.barBg}>
                    <View style={{ height: 5, borderRadius: 3, width: `${pct}%`, backgroundColor: barColor(pct) }} />
                  </View>
                  {g.cueLevel ? <Text style={S.cueBadge}>{g.cueLevel}</Text> : null}
                  {g.analysis ? <Text style={S.bodyText}>{g.analysis}</Text> : null}
                  {g.recommendation ? (
                    <View style={S.recRow}>
                      <Text style={S.recBullet}>›</Text>
                      <Text style={S.recText}>{g.recommendation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Overall assessment */}
        {summary.overallAssessment ? (
          <View style={[S.box, { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" }]}>
            <Text style={[S.boxTitle, { color: "#0369a1" }]}>Genel Değerlendirme</Text>
            <Text style={[S.boxText, { color: "#0c4a6e" }]}>{summary.overallAssessment}</Text>
          </View>
        ) : null}

        {/* Behavior notes */}
        {summary.behaviorNotes ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Davranış ve Katılım</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{summary.behaviorNotes}</Text>
          </View>
        ) : null}

        {/* Next session plan */}
        {summary.nextSessionPlan ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderLeftWidth: 3, borderLeftColor: "#16a34a" }]}>
            <Text style={[S.boxTitle, { color: "#15803d" }]}>Sonraki Oturum Planı</Text>
            <Text style={[S.boxText, { color: "#166534" }]}>{summary.nextSessionPlan}</Text>
          </View>
        ) : null}

        {/* Parent note */}
        {summary.parentNote ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#86efac" }]}>
            <Text style={[S.boxTitle, { color: "#15803d" }]}>Veliye İletilecek Not</Text>
            <Text style={[S.boxText, { color: "#166534" }]}>{summary.parentNote}</Text>
          </View>
        ) : null}

        {/* Expert notes */}
        {summary.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları (Gizli)</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{summary.expertNotes}</Text>
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
  a.download = `${(summary.title ?? "oturum-ozeti").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadParentPDF(summary: SessionSummaryContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const S = StyleSheet.create({
    page:    { fontFamily: "NotoSans", fontSize: 11, color: "#18181b", padding: 56, paddingBottom: 70 },
    header:  { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#023435", paddingBottom: 16 },
    brand:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#023435", marginBottom: 4 },
    h1:      { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 4 },
    sub:     { fontSize: 10, color: "#52525b" },
    body:    { fontSize: 11, lineHeight: 1.8, color: "#27272a" },
    footer:  { position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title="Veli Notu" author="LudenLab">
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.brand}>LudenLab</Text>
          <Text style={S.h1}>Veli Bilgilendirme Notu</Text>
          <Text style={S.sub}>
            {studentName ? `Öğrenci: ${studentName}  ·  ` : ""}
            {summary.sessionInfo?.date ?? today}
          </Text>
        </View>

        <Text style={S.body}>{summary.parentNote ?? ""}</Text>

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
  a.download = `Veli_Notu_${(studentName ?? "ogrenci").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SessionSummaryPage() {
  const [students, setStudents]           = useState<Student[]>([]);
  const [curricula, setCurricula]         = useState<CurriculumItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,          setStudentId]          = useState("");
  const [sessionDate,        setSessionDate]        = useState(todayStr());
  const [duration,           setDuration]           = useState<Duration>("45");
  const [sessionType,        setSessionType]        = useState<SessionType>("individual");
  const [selectedGoals,      setSelectedGoals]      = useState<GoalEntry[]>([]);
  const [overallPerformance, setOverallPerformance] = useState<OverallPerformance>("on_target");
  const [behaviorNotes,      setBehaviorNotes]      = useState("");
  const [nextSessionNotes,   setNextSessionNotes]   = useState("");

  // Result state
  const [loading,       setLoading]       = useState(false);
  const [summary,       setSummary]       = useState<SessionSummaryContent | null>(null);
  const [savedCardId,   setSavedCardId]   = useState<string | null>(null);
  const [downloading,   setDownloading]   = useState(false);
  const [formKey,       setFormKey]       = useState(0);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  // Available curriculum goals for selected student
  const availableGoals = curricula
    .filter((c) => selectedStudent?.curriculumIds?.includes(c.id))
    .flatMap((c) =>
      c.goals.map((g) => ({
        id: g.id,
        title: g.title,
        isMainGoal: g.isMainGoal,
        curriculumTitle: c.title,
      }))
    );
  const hasAvailableGoals = availableGoals.length > 0;

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
    setSelectedGoals([]);
  }

  // Toggle a curriculum goal on/off
  function toggleGoal(goalId: string, goalTitle: string) {
    setSelectedGoals((prev) => {
      const exists = prev.find((g) => g.tempId === goalId);
      if (exists) return prev.filter((g) => g.tempId !== goalId);
      return [...prev, { tempId: goalId, goalId, title: goalTitle, accuracy: 80, cueLevel: "Bağımsız" }];
    });
  }

  function updateGoal(tempId: string, field: "accuracy" | "cueLevel", value: number | string) {
    setSelectedGoals((prev) =>
      prev.map((g) => g.tempId === tempId ? { ...g, [field]: value } : g)
    );
  }

  // Add a custom free-text goal
  function addCustomGoal() {
    const tempId = `custom-${Date.now()}`;
    setSelectedGoals((prev) => [...prev, { tempId, goalId: "", title: "", accuracy: 80, cueLevel: "Bağımsız" }]);
  }

  function updateCustomTitle(tempId: string, title: string) {
    setSelectedGoals((prev) =>
      prev.map((g) => g.tempId === tempId ? { ...g, title } : g)
    );
  }

  function removeGoal(tempId: string) {
    setSelectedGoals((prev) => prev.filter((g) => g.tempId !== tempId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) { toast.error("Lütfen bir öğrenci seçin"); return; }
    if (selectedGoals.length === 0) { toast.error("En az bir hedef ekleyin"); return; }
    const emptyTitle = selectedGoals.find((g) => !g.title.trim());
    if (emptyTitle) { toast.error("Tüm hedef başlıklarını doldurun"); return; }

    setLoading(true);
    setSummary(null);
    setSavedCardId(null);

    try {
      const res = await fetch("/api/tools/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionDate,
          duration,
          sessionType,
          goals: selectedGoals.map((g) => ({
            goalId:    g.goalId,
            goalTitle: g.title.trim(),
            accuracy:  Number(g.accuracy),
            cueLevel:  g.cueLevel,
          })),
          overallPerformance,
          behaviorNotes:    behaviorNotes.trim() || undefined,
          nextSessionNotes: nextSessionNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setSummary(data.summary as SessionSummaryContent);
      setSavedCardId(data.cardId ?? null);
      toast.success("Oturum özeti oluşturuldu!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSummary(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setStudentId("");
    setSessionDate(todayStr());
    setDuration("45");
    setSessionType("individual");
    setSelectedGoals([]);
    setOverallPerformance("on_target");
    setBehaviorNotes("");
    setNextSessionNotes("");
  }

  async function handleDownloadFull() {
    if (!summary) return;
    setDownloading(true);
    const t = toast.loading("PDF hazırlanıyor...");
    try {
      await downloadFullPDF(summary, selectedStudent?.name);
      toast.success("PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadParent() {
    if (!summary) return;
    setDownloading(true);
    const t = toast.loading("Veli notu hazırlanıyor...");
    try {
      await downloadParentPDF(summary, selectedStudent?.name);
      toast.success("Veli notu indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#023435]/30 focus:border-[#023435]";
  const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";
  const selCls   = cn(inputCls, "cursor-pointer");

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
        <h1 className="text-xl font-bold text-[#023435]">Oturum Özeti Oluşturucu</h1>
        <p className="text-sm text-zinc-500">
          Oturum sonrası profesyonel ve yapılandırılmış değerlendirme raporları oluşturun.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr] flex-1 min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci */}
              <div>
                <label className={labelCls}>Öğrenci</label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className={selCls}
                  required
                >
                  <option value="">
                    {studentsLoading ? "Yükleniyor..." : "Öğrenci seçin"}
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

              {/* Oturum Tarihi */}
              <div>
                <label className={labelCls}>Oturum Tarihi</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Süre */}
              <div>
                <label className={labelCls}>Oturum Süresi</label>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                        duration === d
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {d} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Oturum Türü */}
              <div>
                <label className={labelCls}>Oturum Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  {SESSION_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSessionType(opt.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left transition-colors",
                        sessionType === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Çalışılan Hedefler */}
              <div>
                <label className={cn(labelCls, "flex items-center justify-between")}>
                  <span>
                    Çalışılan Hedefler
                    {selectedGoals.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-[#023435]/10 text-[#023435] px-1.5 py-0.5 text-[10px] font-semibold">
                        {selectedGoals.length}
                      </span>
                    )}
                  </span>
                </label>

                {!studentId ? (
                  <p className="text-xs text-zinc-400 italic">Önce öğrenci seçin</p>
                ) : hasAvailableGoals ? (
                  /* Curriculum goals checkboxes */
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                    {availableGoals.map((goal) => {
                      const isSelected = selectedGoals.some((g) => g.tempId === goal.id);
                      const entry = selectedGoals.find((g) => g.tempId === goal.id);
                      return (
                        <div key={goal.id} className={cn("px-3 py-2.5", isSelected && "bg-[#023435]/3")}>
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleGoal(goal.id, goal.title)}
                              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[#023435]"
                            />
                            <span className="text-xs text-zinc-700 flex-1 leading-relaxed">{goal.title}</span>
                          </label>
                          {isSelected && entry && (
                            <div className="mt-2 ml-6 flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-500 shrink-0">%</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={entry.accuracy}
                                  onChange={(e) => updateGoal(entry.tempId, "accuracy", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-14 rounded-md border border-zinc-200 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#023435]/30"
                                />
                              </div>
                              <select
                                value={entry.cueLevel}
                                onChange={(e) => updateGoal(entry.tempId, "cueLevel", e.target.value)}
                                className="flex-1 min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#023435]/30 cursor-pointer"
                              >
                                {CUE_LEVELS.map((cl) => (
                                  <option key={cl} value={cl}>{cl}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Free-text goal input */
                  <div className="space-y-2">
                    {selectedGoals.map((entry) => (
                      <div key={entry.tempId} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Hedef açıklaması..."
                            value={entry.title}
                            onChange={(e) => updateCustomTitle(entry.tempId, e.target.value)}
                            className="flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#023435]/30"
                            required
                          />
                          <button type="button" onClick={() => removeGoal(entry.tempId)} className="shrink-0 text-zinc-400 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 shrink-0">%</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={entry.accuracy}
                              onChange={(e) => updateGoal(entry.tempId, "accuracy", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-14 rounded-md border border-zinc-200 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#023435]/30"
                            />
                          </div>
                          <select
                            value={entry.cueLevel}
                            onChange={(e) => updateGoal(entry.tempId, "cueLevel", e.target.value)}
                            className="flex-1 min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#023435]/30 cursor-pointer"
                          >
                            {CUE_LEVELS.map((cl) => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomGoal}
                      className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 w-full py-2 px-3 text-xs text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Hedef Ekle
                    </button>
                  </div>
                )}
              </div>

              {/* Genel Performans */}
              <div>
                <label className={labelCls}>Genel Performans Değerlendirmesi</label>
                <div className="space-y-1.5">
                  {PERFORMANCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOverallPerformance(opt.value)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                        overallPerformance === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Davranış gözlemi */}
              <div>
                <label className={cn(labelCls, "flex items-center justify-between")}>
                  Davranış ve Katılım Gözlemi
                  <span className="text-[10px] font-normal text-zinc-400">opsiyonel</span>
                </label>
                <textarea
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                  placeholder="Öğrencinin oturum sırasındaki genel tutumu, motivasyonu, dikkat süresi, işbirliği düzeyi..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              {/* Sonraki oturum notları */}
              <div>
                <label className={cn(labelCls, "flex items-center justify-between")}>
                  Sonraki Oturum İçin Notlar
                  <span className="text-[10px] font-normal text-zinc-400">opsiyonel</span>
                </label>
                <textarea
                  value={nextSessionNotes}
                  onChange={(e) => setNextSessionNotes(e.target.value)}
                  placeholder="Sonraki oturumda odaklanılacak konular, değiştirilecek yaklaşımlar..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Oluşturuluyor..." : "Oturum Özeti Oluştur"}
              </button>
              <p className="text-center text-xs text-zinc-400">10 kredi kullanılacak</p>
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
            ) : summary ? (
              <>
                {/* Özet Kartı */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <SessionSummaryView summary={summary} />
                </div>

                {/* Aksiyon Çubuğu */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadFull}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 transition-colors"
                  >
                    Tam Rapor PDF İndir
                  </button>
                  <button
                    onClick={handleDownloadParent}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg border border-[#023435]/30 bg-[#023435]/5 px-4 py-2 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 disabled:opacity-60 transition-colors"
                  >
                    Veli Notu PDF İndir
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
                    Yeni Özet
                  </button>
                </div>

                {/* Uzman notu uyarısı */}
                <div className="mt-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-zinc-400" />
                  <p className="text-[10px] text-zinc-400">
                    Tam rapor PDF uzman notlarını içerir. Veli Notu PDF yalnızca genel özeti paylaşır.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="text-center px-8 space-y-2">
                  <div className="text-3xl">📋</div>
                  <p className="text-sm font-medium text-zinc-500">Oturum bilgilerini doldurun</p>
                  <p className="text-xs text-zinc-400">Oluşturulan özet burada görünecek</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
