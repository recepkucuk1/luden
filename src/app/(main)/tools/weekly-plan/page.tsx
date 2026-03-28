"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Library } from "lucide-react";
import { WeeklyPlanView } from "@/components/cards/WeeklyPlanView";
import type { WeeklyPlanContent } from "@/components/cards/WeeklyPlanView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  curriculumIds: string[];
}

interface CurriculumItem {
  id: string;
  area: string;
  title: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSIONS_OPTIONS = [2, 3, 4, 5] as const;
const DURATION_OPTIONS = [
  { value: "20", label: "20 dakika" },
  { value: "30", label: "30 dakika" },
  { value: "40", label: "40 dakika" },
  { value: "45", label: "45 dakika" },
  { value: "60", label: "60 dakika" },
];
const DEFAULT_FOCUS_AREAS = [
  "Artikülasyon / Ses çalışması",
  "Dil gelişimi",
  "Akıcı konuşma",
  "Pragmatik dil / Sosyal iletişim",
  "İşitsel algı",
  "Oral motor",
];

const LOADING_MSGS = [
  "Öğrenci profili analiz ediliyor...",
  "Geçmiş çalışmalar inceleniyor...",
  "Haftalık hedefler belirleniyor...",
  "Günlük planlar oluşturuluyor...",
  "Materyaller listeleniyor...",
  "Uzman notları hazırlanıyor...",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(): string {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  return `${fmt(start)} — ${fmt(end)}`;
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadWeeklyPlanPDF(plan: WeeklyPlanContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  const days  = Array.isArray(plan.days) ? plan.days : [];
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 9, color: "#18181b", padding: 36, paddingBottom: 60 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 16, color: "#023435", marginBottom: 3 },
    weekRange: { fontSize: 9, color: "#71717a", marginBottom: 14 },
    dayWrap:   { marginBottom: 14, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, overflow: "hidden" },
    dayHdr:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#023435", paddingVertical: 5, paddingHorizontal: 8 },
    dayName:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#fff" },
    dayDate:   { fontSize: 8, color: "#ffffff99" },
    dayDur:    { fontSize: 8, color: "#ffffff99" },
    dayBody:   { padding: 8, backgroundColor: "#fff" },
    focusBadge:{ alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: "#f4f4f5", marginBottom: 4 },
    focusTxt:  { fontSize: 8, color: "#52525b" },
    objective: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#18181b", marginBottom: 8 },
    sectionWrap:  { borderRadius: 3, padding: 6, marginBottom: 5 },
    sectionLabel: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, textTransform: "uppercase", marginBottom: 3 },
    sectionText:  { fontSize: 8, lineHeight: 1.5 },
    stepRow:   { flexDirection: "row", marginBottom: 2 },
    stepNum:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, width: 14, color: "#107996" },
    stepText:  { fontSize: 8, flex: 1, lineHeight: 1.4 },
    tagRow:    { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
    tag:       { borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, marginRight: 3, marginBottom: 2, backgroundColor: "#f4f4f5" },
    tagTxt:    { fontSize: 7, color: "#52525b" },
    note:      { fontSize: 7, color: "#a1a1aa", fontStyle: "italic", borderTopWidth: 1, borderTopColor: "#f4f4f5", paddingTop: 4, marginTop: 4 },
    infoBox:   { borderRadius: 4, padding: 8, marginBottom: 10, borderWidth: 1 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, marginBottom: 3 },
    boxText:   { fontSize: 8, lineHeight: 1.5 },
    footer:    { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 5 },
    footTxt:   { fontSize: 7, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={plan.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{plan.title}</Text>
        <Text style={S.weekRange}>
          {plan.weekRange}{studentName ? ` · ${studentName}` : ""}{plan.sessionsPerWeek ? ` · ${plan.sessionsPerWeek} ders` : ""}{plan.sessionDuration ? ` · ${plan.sessionDuration} dk/ders` : ""}
        </Text>

        {plan.studentSummary ? (
          <View style={[S.infoBox, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7", marginBottom: 12 }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Öğrenci Özeti</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{plan.studentSummary}</Text>
          </View>
        ) : null}

        {days.map((day, di) => (
          <View key={di} style={S.dayWrap}>
            <View style={S.dayHdr}>
              <View>
                <Text style={S.dayName}>{day.dayName}</Text>
                <Text style={S.dayDate}>{day.date}</Text>
              </View>
              <Text style={S.dayDur}>{day.duration}</Text>
            </View>
            <View style={S.dayBody}>
              <View style={S.focusBadge}>
                <Text style={S.focusTxt}>{day.focusArea}</Text>
              </View>
              <Text style={S.objective}>{day.objective}</Text>

              {/* Warmup */}
              <View style={[S.sectionWrap, { backgroundColor: "#eff6ff" }]}>
                <Text style={[S.sectionLabel, { color: "#1d4ed8" }]}>🌅 Isınma — {day.warmup.duration}</Text>
                <Text style={S.sectionText}>{day.warmup.activity}</Text>
                {day.warmup.materials && day.warmup.materials.length > 0 ? (
                  <View style={S.tagRow}>
                    {day.warmup.materials.map((m, i) => (
                      <View key={i} style={S.tag}><Text style={S.tagTxt}>{m}</Text></View>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Main work */}
              <View style={[S.sectionWrap, { backgroundColor: "#fff", borderLeftWidth: 3, borderLeftColor: "#107996" }]}>
                <Text style={[S.sectionLabel, { color: "#107996" }]}>📚 Ana Çalışma — {day.mainWork.duration}</Text>
                <Text style={[S.sectionText, { marginBottom: 4 }]}>{day.mainWork.activity}</Text>
                {day.mainWork.steps && day.mainWork.steps.length > 0
                  ? day.mainWork.steps.map((step, si) => (
                      <View key={si} style={S.stepRow}>
                        <Text style={S.stepNum}>{si + 1}.</Text>
                        <Text style={S.stepText}>{step}</Text>
                      </View>
                    ))
                  : null}
                {day.mainWork.targetGoals && day.mainWork.targetGoals.length > 0 ? (
                  <View style={S.tagRow}>
                    {day.mainWork.targetGoals.map((g, i) => (
                      <View key={i} style={[S.tag, { backgroundColor: "#023435" + "15" }]}>
                        <Text style={[S.tagTxt, { color: "#023435" }]}>🎯 {g}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {day.mainWork.materials && day.mainWork.materials.length > 0 ? (
                  <View style={S.tagRow}>
                    {day.mainWork.materials.map((m, i) => (
                      <View key={i} style={S.tag}><Text style={S.tagTxt}>{m}</Text></View>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Closing */}
              <View style={[S.sectionWrap, { backgroundColor: "#f0fdf4" }]}>
                <Text style={[S.sectionLabel, { color: "#16a34a" }]}>🎯 Kapanış — {day.closing.duration}</Text>
                <Text style={S.sectionText}>{day.closing.activity}</Text>
              </View>

              {day.notes ? <Text style={S.note}>{day.notes}</Text> : null}
            </View>
          </View>
        ))}

        {plan.weeklyGoal ? (
          <View style={[S.infoBox, { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }]}>
            <Text style={[S.boxTitle, { color: "#c2410c" }]}>Haftalık Hedef</Text>
            <Text style={[S.boxText, { color: "#7c2d12" }]}>{plan.weeklyGoal}</Text>
          </View>
        ) : null}

        {plan.materialsNeeded && plan.materialsNeeded.length > 0 ? (
          <View style={[S.infoBox, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Haftalık Materyaller</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{plan.materialsNeeded.join(" · ")}</Text>
          </View>
        ) : null}

        {plan.parentCommunication ? (
          <View style={[S.infoBox, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
            <Text style={[S.boxTitle, { color: "#1e40af" }]}>Veli Bilgilendirmesi</Text>
            <Text style={[S.boxText, { color: "#1e3a8a" }]}>{plan.parentCommunication}</Text>
          </View>
        ) : null}

        {plan.expertNotes ? (
          <View style={[S.infoBox, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{plan.expertNotes}</Text>
          </View>
        ) : null}

        {plan.nextWeekSuggestion ? (
          <View style={[S.infoBox, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Gelecek Hafta Önerisi</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{plan.nextWeekSuggestion}</Text>
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
  a.download = `${plan.title.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyPlanPage() {
  const [students,    setStudents]    = useState<Student[]>([]);
  const [curricula,   setCurricula]   = useState<CurriculumItem[]>([]);
  const [studentId,   setStudentId]   = useState("");
  const [weekStart,   setWeekStart]   = useState(getMondayOfCurrentWeek);
  const [sessions,    setSessions]    = useState<2 | 3 | 4 | 5>(3);
  const [duration,    setDuration]    = useState("45");
  const [focusAreas,  setFocusAreas]  = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState("");
  const [approach,    setApproach]    = useState<"ai" | "guided">("ai");
  const [extraNote,   setExtraNote]   = useState("");

  const [generating,   setGenerating]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedCardId,  setSavedCardId]  = useState<string | null>(null);
  const [pendingCardId,setPendingCardId]= useState<string | null>(null);
  const [plan,         setPlan]         = useState<WeeklyPlanContent | null>(null);
  const [downloading,  setDownloading]  = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/students?limit=200").then((r) => r.json()),
      fetch("/api/curriculum").then((r) => r.json()),
    ]).then(([sd, cd]) => {
      setStudents(sd.students ?? []);
      setCurricula(cd.curricula ?? []);
    });
  }, []);

  const selectedStudent = students.find((s) => s.id === studentId);

  // Curriculum items assigned to selected student
  const studentCurricula = selectedStudent
    ? curricula.filter((c) => selectedStudent.curriculumIds.includes(c.id))
    : [];

  // When student changes, reset focus areas
  useEffect(() => { setFocusAreas([]); }, [studentId]);

  function toggleFocus(area: string) {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  const allFocusOptions: string[] = studentCurricula.length > 0
    ? studentCurricula.map((c) => c.title)
    : DEFAULT_FOCUS_AREAS;

  async function handleGenerate() {
    if (!studentId) { toast.error("Lütfen öğrenci seçin"); return; }
    const effectiveFocus = [...focusAreas, ...(customFocus.trim() ? [customFocus.trim()] : [])];
    if (effectiveFocus.length === 0) { toast.error("En az bir odak alanı seçin"); return; }
    setGenerating(true);
    setSavedCardId(null);
    setPendingCardId(null);
    try {
      const res = await fetch("/api/tools/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          weekStart,
          sessionsPerWeek: sessions,
          sessionDuration: duration,
          focusAreas: effectiveFocus,
          planApproach: approach,
          extraNote: extraNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setPlan(data.plan as WeeklyPlanContent);
      setPendingCardId(data.cardId ?? null);
      toast.success("Haftalık plan oluşturuldu");
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!pendingCardId) { toast.error("Kaydedilecek plan bulunamadı"); return; }
    setSaving(true);
    setSavedCardId(pendingCardId);
    setSaving(false);
    toast.success("Kütüphaneye kaydedildi");
  }

  async function handleDownload() {
    if (!plan) return;
    setDownloading(true);
    const t = toast.loading("PDF hazırlanıyor…");
    try {
      await downloadWeeklyPlanPDF(plan, selectedStudent?.name);
      toast.success("PDF indirildi", { id: t });
    } catch {
      toast.error("PDF oluşturulamadı", { id: t });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tools" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Araçlara Dön
          </Link>
          <h1 className="text-2xl font-bold text-[#023435]">Haftalık Çalışma Planı</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Öğrenci bazlı, hedef odaklı haftalık ders planları oluşturun.
          </p>
        </div>

        {/* Form */}
        {!plan && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">

            {/* Student */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Öğrenci</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                <option value="">— Öğrenci seçin —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {selectedStudent && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#023435]/10 text-[#023435] flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{selectedStudent.name}</p>
                      <p className="text-xs text-zinc-500">{selectedStudent.workArea}{selectedStudent.diagnosis ? ` · ${selectedStudent.diagnosis}` : ""}</p>
                    </div>
                  </div>
                  {studentCurricula.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {studentCurricula.map((c) => (
                        <span key={c.id} className="rounded-full bg-[#FE703A]/10 border border-[#FE703A]/20 px-2 py-0.5 text-[10px] text-[#FE703A]">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Week */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Hafta</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              />
              {weekStart && (
                <p className="text-xs text-zinc-400">{formatWeekRange(weekStart)}</p>
              )}
            </div>

            {/* Sessions per week */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Haftalık Ders Sayısı</label>
              <div className="flex gap-2">
                {SESSIONS_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSessions(n)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      sessions === n
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {n} ders
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Ders Süresi</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Focus areas */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Odak Alanları
                {studentCurricula.length > 0 && (
                  <span className="ml-2 text-[10px] font-normal text-[#FE703A]">Öğrencinin modüllerinden</span>
                )}
              </label>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 divide-y divide-zinc-100">
                {allFocusOptions.map((area) => (
                  <label key={area} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-zinc-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(area)}
                      onChange={() => toggleFocus(area)}
                      className="h-4 w-4 rounded border-zinc-300 accent-[#023435]"
                    />
                    <span className="text-sm text-zinc-700">{area}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="Diğer (serbest metin — isteğe bağlı)"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              />
            </div>

            {/* Approach */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Planlama Yaklaşımı</label>
              <div className="flex gap-2">
                {([
                  ["ai",      "AI Önersin",        "Öğrenci profili ve geçmişe göre otomatik"],
                  ["guided",  "Ben Yönlendireyim", "Seçilen odak alanlarına göre"],
                ] as const).map(([v, l, d]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setApproach(v)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left ${
                      approach === v
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {l}
                    <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">{d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Extra note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Ek Not <span className="text-zinc-400 font-normal">(isteğe bağlı)</span></label>
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                rows={3}
                placeholder="Bu hafta dikkat edilecek özel durumlar, veli geri bildirimi, geçen haftadan devam eden konular..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-xl bg-[#FE703A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating ? "Plan oluşturuluyor…" : "Haftalık Plan Oluştur"}
              </button>
              <p className="mt-2 text-center text-xs text-zinc-400">20 kredi kullanılacak</p>
            </div>

            {generating && (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 py-4">
                <LoadingMessages />
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {plan && (
          <div className="space-y-6">
            <WeeklyPlanView plan={plan} />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-xl bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
              >
                {downloading ? "Hazırlanıyor…" : "PDF İndir"}
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
                onClick={() => { setPlan(null); setPendingCardId(null); setSavedCardId(null); }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Yeni Plan Oluştur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
