"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Library } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
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

const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

function distributeEvenly(total: number): Record<string, number> {
  const schedule: Record<string, number> = {};
  WEEKDAYS.forEach((d) => { schedule[d] = 0; });
  let remaining = total;
  let i = 0;
  while (remaining > 0) {
    schedule[WEEKDAYS[i % WEEKDAYS.length]]++;
    remaining--;
    i++;
  }
  return schedule;
}

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
  const fmt = (d: Date) => formatDate(d, "medium");
  return `${fmt(start)} — ${fmt(end)}`;
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadWeeklyPlanPDF(plan: WeeklyPlanContent, studentName?: string) {
  const jsPDF    = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W     = 210;
  const L     = 14;
  const R     = W - 14;
  const today = formatDate(new Date(), "medium");

  // Load NotoSans for Turkish characters
  const [regResp, boldResp] = await Promise.all([
    fetch(`${window.location.origin}/fonts/NotoSans-Regular.ttf`),
    fetch(`${window.location.origin}/fonts/NotoSans-Bold.ttf`),
  ]);
  const regBuf  = await regResp.arrayBuffer();
  const boldBuf = await boldResp.arrayBuffer();
  const toB64   = (buf: ArrayBuffer) => {
    let bin = "";
    new Uint8Array(buf).forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  };
  doc.addFileToVFS("NotoSans-Regular.ttf", toB64(regBuf));
  doc.addFileToVFS("NotoSans-Bold.ttf",    toB64(boldBuf));
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf",    "NotoSans", "bold");

  const days = Array.isArray(plan.days) ? plan.days : [];

  // ── Title + header info ──────────────────────────────────────────────────
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#023435");
  doc.text(plan.title, L, 20);

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#71717a");
  const meta = [
    plan.weekRange,
    studentName ?? "",
    plan.sessionsPerWeek ? `${plan.sessionsPerWeek} ders/hafta` : "",
    plan.sessionDuration ? `${plan.sessionDuration} dk/ders` : "",
  ].filter(Boolean).join("  |  ");
  doc.text(meta, L, 26);

  let y = 32;

  // ── Day sections ─────────────────────────────────────────────────────────
  for (let di = 0; di < days.length; di++) {
    const day = days[di];

    // Check page space — if less than 60mm left, add a new page
    if (y > 240) {
      doc.addPage();
      y = 16;
    }

    // Day heading bar
    doc.setFillColor("#023435");
    doc.roundedRect(L, y, R - L, 8, 1.5, 1.5, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#ffffff");
    doc.text(`${day.dayNumber}. GUN — ${day.dayName}, ${day.date}`, L + 3, y + 5.5);
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#ffffff99" as unknown as string);
    doc.text(day.duration, R - 3, y + 5.5, { align: "right" });
    y += 10;

    // Focus + objective
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#52525b");
    doc.text(`Odak: ${day.focusArea}`, L, y + 4);
    y += 5;
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#18181b");
    const objLines = doc.splitTextToSize(day.objective, R - L - 2);
    doc.text(objLines, L, y + 4);
    y += objLines.length * 4.5 + 2;

    // Activity table
    const mainSteps = day.mainWork.steps?.join("; ") ?? "";
    const mainText  = mainSteps ? `${day.mainWork.activity}\n${mainSteps}` : day.mainWork.activity;

    autoTable(doc, {
      head: [["Bolum", "Aktivite", "Sure"]],
      body: [
        ["Isinma",      day.warmup.activity,  day.warmup.duration],
        ["Ana Calisma", mainText,              day.mainWork.duration],
        ["Kapanis",     day.closing.activity,  day.closing.duration],
      ],
      startY: y,
      margin:  { left: L, right: 14 },
      styles:  { font: "NotoSans", fontSize: 8.5, cellPadding: 2.5, textColor: [24, 24, 27], overflow: "linebreak" },
      headStyles: { fillColor: [2, 52, 53], textColor: 255, fontStyle: "bold", fontSize: 8 },
      columnStyles: { 0: { cellWidth: 28, fontStyle: "bold" }, 2: { cellWidth: 20, halign: "center" } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;

    // Materials (if any)
    const mats = [...(day.warmup.materials ?? []), ...(day.mainWork.materials ?? [])];
    if (mats.length > 0) {
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor("#52525b");
      const matText = `Materyaller: ${mats.join(", ")}`;
      const matLines = doc.splitTextToSize(matText, R - L - 2);
      doc.text(matLines, L, y + 3.5);
      y += matLines.length * 3.8 + 1;
    }

    // Day note
    if (day.notes) {
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor("#a1a1aa");
      const noteLines = doc.splitTextToSize(`Not: ${day.notes}`, R - L - 2);
      doc.text(noteLines, L, y + 3.5);
      y += noteLines.length * 3.8 + 1;
    }

    // Separator line between days
    if (di < days.length - 1) {
      doc.setDrawColor("#e4e4e7");
      doc.line(L, y + 2, R, y + 2);
      y += 6;
    } else {
      y += 4;
    }
  }

  // ── Footer sections ───────────────────────────────────────────────────────
  const addSection = (title: string, text: string, fillRgb: [number,number,number], titleColor: string) => {
    if (y > 255) { doc.addPage(); y = 16; }
    doc.setFillColor(...fillRgb);
    doc.roundedRect(L, y, R - L, 5, 1, 1, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(titleColor);
    doc.text(title, L + 3, y + 3.5);
    y += 7;
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor("#18181b");
    const lines = doc.splitTextToSize(text, R - L - 2);
    doc.text(lines, L, y);
    y += lines.length * 4.2 + 5;
  };

  if (plan.weeklyGoal)            addSection("Haftalik Hedef",      plan.weeklyGoal,                    [255, 247, 237], "#c2410c");
  if (plan.materialsNeeded?.length) addSection("Gerekli Materyaller", plan.materialsNeeded.join(", "), [249, 250, 251], "#374151");
  if (plan.parentCommunication)   addSection("Veli Bilgilendirme",  plan.parentCommunication,           [239, 246, 255], "#1e40af");

  // ── PDF footer ────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor("#e4e4e7");
    doc.line(L, 285, R, 285);
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#a1a1aa");
    doc.text("LudenLab — ludenlab.com", L, 290);
    doc.text(today, R, 290, { align: "right" });
  }

  doc.save(`${plan.title.replace(/\s+/g, "_")}.pdf`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyPlanPage() {
  const [students,    setStudents]    = useState<Student[]>([]);
  const [curricula,   setCurricula]   = useState<CurriculumItem[]>([]);
  const [studentId,   setStudentId]   = useState("");
  const [weekStart,   setWeekStart]   = useState(getMondayOfCurrentWeek);
  const [sessions,    setSessions]    = useState(3);
  const [daySchedule, setDaySchedule] = useState<Record<string, number>>(() => distributeEvenly(3));
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

  // Auto-distribute lessons when dropdown total changes
  useEffect(() => {
    setDaySchedule(distributeEvenly(sessions));
  }, [sessions]);

  const totalAssigned = Object.values(daySchedule).reduce((a, b) => a + b, 0);

  function updateDay(day: string, delta: number) {
    setDaySchedule((prev) => {
      const val = (prev[day] ?? 0) + delta;
      if (val < 0) return prev;
      return { ...prev, [day]: val };
    });
  }

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
    if (totalAssigned === 0) { toast.error("En az 1 ders günü belirleyin"); return; }
    const effectiveFocus = [...focusAreas, ...(customFocus.trim() ? [customFocus.trim()] : [])];
    if (effectiveFocus.length === 0) { toast.error("En az bir odak alanı seçin"); return; }
    setGenerating(true);
    setSavedCardId(null);
    setPendingCardId(null);
    // Build daySchedule payload: only days with lessons > 0
    const activeDays = WEEKDAYS
      .filter((d) => (daySchedule[d] ?? 0) > 0)
      .map((d) => ({ dayName: d, lessonCount: daySchedule[d] }));
    try {
      const res = await fetch("/api/tools/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          weekStart,
          sessionsPerWeek: totalAssigned,
          sessionDuration: duration,
          focusAreas: effectiveFocus,
          planApproach: approach,
          daySchedule: activeDays,
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
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#107996]/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tools" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#023435]/50 hover:text-[#023435] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Araçlara Dön
          </Link>
          <h1 className="text-2xl font-bold text-[#023435]">Haftalık Çalışma Planı</h1>
          <p className="mt-1 text-sm text-[#023435]/60">
            Öğrenci bazlı, hedef odaklı haftalık ders planları oluşturun.
          </p>
        </div>

        {/* Form */}
        {!plan && (
          <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(2,52,53,0.04)] space-y-6">

            {/* Student */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">Öğrenci</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
              >
                <option value="">— Öğrenci seçin —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {selectedStudent && (
                <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm p-3 space-y-1">
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
              <label className="text-sm font-bold text-[#023435]/70">Hafta</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20"
              />
              {weekStart && (
                <p className="text-xs text-zinc-400">{formatWeekRange(weekStart)}</p>
              )}
            </div>

            {/* Sessions per week */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">Haftalık Ders Sayısı</label>
              <select
                value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} ders</option>
                ))}
              </select>
            </div>

            {/* Day schedule */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">
                Günlük Ders Dağılımı
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  Toplam: {totalAssigned} ders
                </span>
              </label>
              <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm divide-y divide-zinc-100">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-zinc-700">{day}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateDay(day, -1)}
                        disabled={!daySchedule[day]}
                        className="h-7 w-7 rounded-lg border border-zinc-200 text-zinc-500 text-sm font-medium hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-[#023435]">
                        {daySchedule[day] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDay(day, 1)}
                        className="h-7 w-7 rounded-lg border border-zinc-200 text-zinc-500 text-sm font-medium hover:bg-zinc-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalAssigned === 0 && (
                <p className="text-xs text-red-500">En az 1 ders günü belirleyin.</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">Ders Süresi</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Focus areas */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">
                Odak Alanları
                {studentCurricula.length > 0 && (
                  <span className="ml-2 text-[10px] font-normal text-[#FE703A]">Öğrencinin modüllerinden</span>
                )}
              </label>
              <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm divide-y divide-zinc-100">
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
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
              />
            </div>

            {/* Approach */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#023435]/70">Planlama Yaklaşımı</label>
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
              <label className="text-sm font-bold text-[#023435]/70">Ek Not <span className="text-zinc-400 font-normal">(isteğe bağlı)</span></label>
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                rows={3}
                placeholder="Bu hafta dikkat edilecek özel durumlar, veli geri bildirimi, geçen haftadan devam eden konular..."
                className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2.5 text-sm text-[#023435] placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40"
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
              <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm py-4">
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
