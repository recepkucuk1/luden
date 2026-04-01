"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  StickyNote,
  Check,
  Loader2,
  Target,
  CheckCircle,
  Clock,
  Circle,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  createdAt: string;
  curriculumIds: string[];
}

interface GoalProgress {
  id: string;
  status: string;
  notes: string | null;
  updatedAt: string;
}

interface GoalItem {
  goal: { id: string; code: string; title: string; isMainGoal: boolean };
  progress: GoalProgress | null;
}

interface ModuleItem {
  curriculum: { id: string; code: string; area: string; title: string };
  goals: GoalItem[];
}

interface RecentCard {
  id: string;
  title: string;
  toolType: string;
  createdAt: string;
}

interface RecentProgress {
  goalId: string;
  goalTitle: string;
  status: string;
  updatedAt: string;
}

interface TrackerData {
  student: Student;
  modules: ModuleItem[];
  recentCards: RecentCard[];
  recentProgress: RecentProgress[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "not_started",   label: "Başlanmamış"    },
  { value: "in_progress",   label: "Devam Ediyor"   },
  { value: "consolidating", label: "Pekiştiriliyor" },
  { value: "mastered",      label: "Kazanıldı"      },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  not_started:   { label: "Başlanmamış",    cls: "bg-zinc-100 text-zinc-500" },
  in_progress:   { label: "Devam Ediyor",   cls: "bg-[#FE703A]/10 text-[#FE703A]" },
  consolidating: { label: "Pekiştiriliyor", cls: "bg-[#F4AE10]/15 text-amber-700" },
  mastered:      { label: "Kazanıldı",      cls: "bg-[#023435]/10 text-[#023435]" },
  completed:     { label: "Kazanıldı",      cls: "bg-[#023435]/10 text-[#023435]" },
};

const TOOL_LABELS: Record<string, string> = {
  LEARNING_CARD:       "Öğrenme Kartı",
  SOCIAL_STORY:        "Sosyal Hikaye",
  ARTICULATION_DRILL:  "Artikülasyon",
  HOMEWORK_MATERIAL:   "Ev Ödevi",
  WEEKLY_PLAN:         "Haftalık Plan",
  SESSION_SUMMARY:     "Oturum Özeti",
  MATCHING_GAME:       "Kelime Eşleştirme",
  PHONATION_ACTIVITY:  "Sesletim",
  COMMUNICATION_BOARD: "İletişim Panosu",
};

const AREA_LABELS: Record<string, string> = {
  speech:   "Konuşma",
  language: "Dil",
  hearing:  "İşitme",
};

function getAge(birthDate: string | null) {
  if (!birthDate) return "—";
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} yaş`;
}

function isMastered(s: string) { return s === "mastered" || s === "completed"; }
function isActive(s: string)   { return s === "in_progress" || s === "consolidating"; }

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function downloadGoalTrackerPDF(data: TrackerData) {
  const jsPDF     = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const L     = 14;
  const R     = 196;
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const [regResp, boldResp] = await Promise.all([
    fetch(`${window.location.origin}/fonts/NotoSans-Regular.ttf`),
    fetch(`${window.location.origin}/fonts/NotoSans-Bold.ttf`),
  ]);
  const toB64 = async (res: Response) => {
    const buf = await res.arrayBuffer();
    let bin = "";
    new Uint8Array(buf).forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  };
  doc.addFileToVFS("NotoSans-Regular.ttf", await toB64(regResp));
  doc.addFileToVFS("NotoSans-Bold.ttf",    await toB64(boldResp));
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf",    "NotoSans", "bold");

  const allGoals = data.modules.flatMap(m => m.goals);
  const total    = allGoals.length;
  const mastered = allGoals.filter(g => g.progress && isMastered(g.progress.status)).length;
  const active   = allGoals.filter(g => g.progress && isActive(g.progress.status)).length;
  const notStart = total - mastered - active;

  // Title
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#023435");
  doc.text(`Hedef Takip Raporu -- ${data.student.name}`, L, 18);

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#71717a");
  doc.text(today, L, 24);

  // Summary
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#18181b");
  doc.text(
    `Toplam: ${total}   Kazanildi: ${mastered}   Devam Eden: ${active}   Baslanmamis: ${notStart}   ` +
    `Genel Ilerleme: %${total ? Math.round((mastered + active * 0.5) / total * 100) : 0}`,
    L, 31
  );

  let y = 38;

  for (const mod of data.modules) {
    if (y > 240) { doc.addPage(); y = 16; }

    const modMastered = mod.goals.filter(g => g.progress && isMastered(g.progress.status)).length;
    doc.setFillColor("#023435");
    doc.roundedRect(L, y, R - L, 7, 1.5, 1.5, "F");
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor("#ffffff");
    doc.text(mod.curriculum.title, L + 3, y + 5);
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(8);
    doc.text(`${modMastered}/${mod.goals.length} kazanildi`, R - 3, y + 5, { align: "right" });
    y += 9;

    autoTable(doc, {
      head: [["Kod", "Hedef", "Durum", "Not"]],
      body: mod.goals.map(({ goal, progress }) => [
        goal.code,
        goal.title,
        progress ? (STATUS_META[progress.status]?.label ?? progress.status) : "Baslanmamis",
        progress?.notes ?? "",
      ]),
      startY: y,
      margin: { left: L, right: 14 },
      styles: { font: "NotoSans", fontSize: 7.5, cellPadding: 2, textColor: [24, 24, 27], overflow: "linebreak" },
      headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: "bold", fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 14 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor("#e4e4e7");
    doc.line(L, 285, R, 285);
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#a1a1aa");
    doc.text("LudenLab -- ludenlab.com", L, 290);
    doc.text(today, R, 290, { align: "right" });
  }

  doc.save(`Hedef_Takip_${data.student.name.replace(/\s+/g, "_")}.pdf`);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, pct, color, Icon,
}: {
  label: string; value: number; pct: number; color: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(2,52,53,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className="grid h-7 w-7 place-content-center rounded-lg" style={{ backgroundColor: `${color}22` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">%{pct}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalTrackerPage() {
  const [students,      setStudents]      = useState<Student[]>([]);
  const [selectedId,    setSelectedId]    = useState("");
  const [data,          setData]          = useState<TrackerData | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [savingGoal,    setSavingGoal]    = useState<string | null>(null);
  const [editNote,      setEditNote]      = useState<string | null>(null);
  const [noteInputs,    setNoteInputs]    = useState<Record<string, string>>({});
  const [savingNote,    setSavingNote]    = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then(r => r.json())
      .then(d => setStudents(d.students ?? []));
  }, []);

  const fetchData = useCallback(async (sid: string) => {
    if (!sid) { setData(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/tools/goal-tracker/${sid}`);
      if (!r.ok) throw new Error();
      const d: TrackerData = await r.json();
      setData(d);
      setExpanded(new Set(d.modules.map(m => m.curriculum.id)));
      const notes: Record<string, string> = {};
      d.modules.forEach(m =>
        m.goals.forEach(({ goal, progress }) => {
          if (progress?.notes) notes[goal.id] = progress.notes;
        })
      );
      setNoteInputs(notes);
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(selectedId); }, [selectedId, fetchData]);

  async function updateStatus(goalId: string, status: string) {
    if (!selectedId) return;
    setSavingGoal(goalId);
    try {
      const r = await fetch(`/api/tools/goal-tracker/${selectedId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, status }),
      });
      if (!r.ok) throw new Error();
      const { progress } = await r.json();
      setData(prev => !prev ? prev : {
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          goals: m.goals.map(g =>
            g.goal.id === goalId ? { ...g, progress } : g
          ),
        })),
      });
      toast.success("Durum güncellendi");
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setSavingGoal(null);
    }
  }

  async function saveNote(goalId: string) {
    if (!selectedId) return;
    setSavingNote(goalId);
    try {
      const r = await fetch(`/api/tools/goal-tracker/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, note: noteInputs[goalId] ?? "" }),
      });
      if (!r.ok) throw new Error();
      const { progress } = await r.json();
      setData(prev => !prev ? prev : {
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          goals: m.goals.map(g =>
            g.goal.id === goalId ? { ...g, progress } : g
          ),
        })),
      });
      setEditNote(null);
      toast.success("Not kaydedildi");
    } catch {
      toast.error("Not kaydedilemedi");
    } finally {
      setSavingNote(null);
    }
  }

  const stats = data
    ? (() => {
        const all      = data.modules.flatMap(m => m.goals);
        const total    = all.length;
        const mastered = all.filter(g => g.progress && isMastered(g.progress.status)).length;
        const active   = all.filter(g => g.progress && isActive(g.progress.status)).length;
        const notStart = total - mastered - active;
        const overallPct = total ? Math.round((mastered + active * 0.5) / total * 100) : 0;
        return { total, mastered, active, notStart, overallPct };
      })()
    : null;

  const selectedStudent = students.find(s => s.id === selectedId);

  function toggleModule(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activities = data
    ? [
        ...data.recentCards.map(c => ({ type: "card" as const, date: c.createdAt, card: c })),
        ...data.recentProgress.map(p => ({ type: "progress" as const, date: p.updatedAt, prog: p })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    : [];

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#107996]/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <Link href="/tools" className="inline-flex items-center gap-1.5 text-xs text-[#023435]/50 hover:text-[#023435] mb-4">
            <ArrowLeft className="h-3.5 w-3.5" />
            Araçlara Dön
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#023435]">Hedef Takip Tablosu</h1>
              <p className="mt-1 text-sm text-[#023435]/60">
                Öğrencilerinizin BEP hedeflerini takip edin, ilerlemeyi görselleştirin.
              </p>
            </div>
            {data && (
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-white/80"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Yazdır
                </button>
                <button
                  onClick={async () => {
                    if (!data) return;
                    setDownloadingPDF(true);
                    try { await downloadGoalTrackerPDF(data); }
                    catch { toast.error("PDF oluşturulamadı"); }
                    finally { setDownloadingPDF(false); }
                  }}
                  disabled={downloadingPDF}
                  className="flex items-center gap-1.5 rounded-lg bg-[#023435] px-3 py-2 text-xs font-medium text-white hover:bg-[#023435]/90 disabled:opacity-50"
                >
                  {downloadingPDF
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileText className="h-3.5 w-3.5" />}
                  PDF İndir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Student selector */}
        <div className="mb-6 rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(2,52,53,0.04)]">
          <label className="block mb-1.5 text-xs font-bold text-[#023435]/70 uppercase tracking-wide">Öğrenci Seç</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20"
          >
            <option value="">-- Öğrenci seçin --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {selectedStudent && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm p-3">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Ad</p>
                <p className="text-sm font-medium text-zinc-800">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Yaş</p>
                <p className="text-sm font-medium text-zinc-800">{getAge(selectedStudent.birthDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Alan</p>
                <p className="text-sm font-medium text-zinc-800">{AREA_LABELS[selectedStudent.workArea] ?? selectedStudent.workArea}</p>
              </div>
              {selectedStudent.diagnosis ? (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Tanı</p>
                  <p className="text-sm font-medium text-zinc-800">{selectedStudent.diagnosis}</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Atanmış Modül</p>
                  <p className="text-sm font-medium text-zinc-800">{selectedStudent.curriculumIds.length} modül</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!selectedId && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Target className="h-12 w-12 text-zinc-200 mb-4" />
            <p className="text-sm font-medium text-zinc-400">Bir öğrenci seçerek hedef takibine başlayın.</p>
          </div>
        )}

        {/* Loading */}
        {selectedId && loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        )}

        {/* No modules */}
        {selectedId && !loading && data && data.modules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl">
            <Target className="h-10 w-10 text-zinc-200 mb-3" />
            <p className="text-sm text-zinc-500 mb-1">Bu öğrenciye henüz modül atanmamış.</p>
            <Link href={`/students/${selectedId}`} className="text-sm text-[#FE703A] hover:underline">
              Öğrenci detayına git → Modül ata
            </Link>
          </div>
        )}

        {/* Main dashboard */}
        {selectedId && !loading && data && stats && data.modules.length > 0 && (
          <div className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Toplam Hedef" value={stats.total}    pct={100}                                                    color="#107996" Icon={Target}      />
              <StatCard label="Kazanıldı"    value={stats.mastered} pct={stats.total ? Math.round(stats.mastered/stats.total*100) : 0} color="#023435" Icon={CheckCircle} />
              <StatCard label="Devam Eden"   value={stats.active}   pct={stats.total ? Math.round(stats.active/stats.total*100)   : 0} color="#FE703A" Icon={Clock}       />
              <StatCard label="Başlanmamış"  value={stats.notStart} pct={stats.total ? Math.round(stats.notStart/stats.total*100) : 0} color="#9ca3af" Icon={Circle}      />
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(2,52,53,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-600">Genel İlerleme</span>
                <span className="text-sm font-bold text-[#023435]">%{stats.overallPct}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 flex">
                {stats.total > 0 && (
                  <>
                    <div style={{ width: `${stats.mastered / stats.total * 100}%` }} className="h-full bg-[#023435] transition-all" />
                    <div style={{ width: `${stats.active   / stats.total * 100}%` }} className="h-full bg-[#FE703A] transition-all" />
                  </>
                )}
              </div>
              <div className="mt-2 flex gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#023435] inline-block" />Kazanıldı</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#FE703A] inline-block" />Devam Ediyor</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-200 inline-block" />Başlanmamış</span>
              </div>
            </div>

            {/* Module accordions */}
            <div className="space-y-3">
              {data.modules.map(mod => {
                const modMastered = mod.goals.filter(g => g.progress && isMastered(g.progress.status)).length;
                const modTotal    = mod.goals.length;
                const modPct      = modTotal ? Math.round(modMastered / modTotal * 100) : 0;
                const isOpen      = expanded.has(mod.curriculum.id);

                return (
                  <div key={mod.curriculum.id} className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.04)] overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors"
                      onClick={() => toggleModule(mod.curriculum.id)}
                    >
                      {isOpen
                        ? <ChevronDown  className="h-4 w-4 text-zinc-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />}
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-sm font-semibold text-zinc-800">{mod.curriculum.title}</span>
                        <span className="ml-2 text-xs text-zinc-400">{mod.curriculum.code}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div style={{ width: `${modPct}%` }} className="h-full bg-[#023435]" />
                        </div>
                        <span className="text-xs text-zinc-500 w-14 text-right">{modMastered}/{modTotal} kazanıldı</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-zinc-100 overflow-x-auto">
                        <table className="w-full text-xs min-w-[600px]">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                              <th className="px-4 py-2 text-left font-semibold text-zinc-400 w-14">Kod</th>
                              <th className="px-4 py-2 text-left font-semibold text-zinc-400">Hedef</th>
                              <th className="px-4 py-2 text-left font-semibold text-zinc-400 w-40">Durum</th>
                              <th className="px-4 py-2 text-center font-semibold text-zinc-400 w-10">Not</th>
                              <th className="px-4 py-2 text-left font-semibold text-zinc-400 w-24">Güncelleme</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mod.goals.map(({ goal, progress }) => {
                              const status   = progress?.status ?? "not_started";
                              const isSaving = savingGoal === goal.id;
                              const noteOpen = editNote === goal.id;

                              return (
                                <React.Fragment key={goal.id}>
                                  <tr className={cn(
                                    "border-b border-zinc-50 hover:bg-zinc-50/60 transition-colors",
                                    goal.isMainGoal && "bg-zinc-50/40"
                                  )}>
                                    <td className="px-4 py-2.5 text-zinc-400 font-mono">{goal.code}</td>
                                    <td className="px-4 py-2.5 text-zinc-700">
                                      {goal.isMainGoal && (
                                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#023435] align-middle" />
                                      )}
                                      {goal.title}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {isSaving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-300" />
                                      ) : (
                                        <select
                                          value={status}
                                          onChange={e => updateStatus(goal.id, e.target.value)}
                                          className={cn(
                                            "rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#023435]/30",
                                            STATUS_META[status]?.cls ?? "bg-zinc-100 text-zinc-500"
                                          )}
                                        >
                                          {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <button
                                        onClick={() => setEditNote(noteOpen ? null : goal.id)}
                                        title={progress?.notes ? "Notu görüntüle / düzenle" : "Not ekle"}
                                        className={cn(
                                          "p-1 rounded hover:bg-zinc-100 transition-colors",
                                          progress?.notes ? "text-[#023435]" : "text-zinc-300"
                                        )}
                                      >
                                        <StickyNote className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                    <td className="px-4 py-2.5 text-zinc-400">
                                      {progress?.updatedAt
                                        ? new Date(progress.updatedAt).toLocaleDateString("tr-TR", {
                                            day: "2-digit", month: "2-digit", year: "2-digit",
                                          })
                                        : "—"}
                                    </td>
                                  </tr>
                                  {noteOpen && (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                                        <textarea
                                          rows={2}
                                          placeholder="Bu hedefle ilgili not ekleyin..."
                                          value={noteInputs[goal.id] ?? ""}
                                          onChange={e =>
                                            setNoteInputs(prev => ({ ...prev, [goal.id]: e.target.value }))
                                          }
                                          className="w-full rounded-lg border border-zinc-200 p-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#023435]/30 resize-none"
                                        />
                                        <div className="flex gap-2 mt-1.5">
                                          <button
                                            onClick={() => saveNote(goal.id)}
                                            disabled={savingNote === goal.id}
                                            className="flex items-center gap-1 rounded-md bg-[#023435] px-2.5 py-1 text-xs text-white hover:bg-[#023435]/90 disabled:opacity-50"
                                          >
                                            {savingNote === goal.id
                                              ? <Loader2 className="h-3 w-3 animate-spin" />
                                              : <Check    className="h-3 w-3" />}
                                            Kaydet
                                          </button>
                                          <button
                                            onClick={() => setEditNote(null)}
                                            className="rounded-md px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
                                          >
                                            İptal
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent activities */}
            {activities.length > 0 && (
              <div className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(2,52,53,0.04)]">
                <h3 className="text-sm font-semibold text-zinc-700 mb-4">Son Aktiviteler</h3>
                <div className="relative pl-5 border-l-2 border-zinc-100 space-y-4">
                  {activities.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-zinc-200" />
                      {item.type === "card" ? (
                        <div className="flex items-start gap-2.5">
                          <span className="shrink-0 mt-0.5 rounded-full bg-[#107996]/10 text-[#107996] border border-[#107996]/20 px-2 py-0.5 text-[10px] font-medium">
                            {TOOL_LABELS[item.card.toolType] ?? item.card.toolType}
                          </span>
                          <div>
                            <Link
                              href={`/cards/${item.card.id}`}
                              className="text-xs font-medium text-zinc-700 hover:text-[#023435] hover:underline"
                            >
                              {item.card.title}
                            </Link>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5">
                          <span className={cn(
                            "shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            STATUS_META[item.prog.status]?.cls ?? "bg-zinc-100 text-zinc-500"
                          )}>
                            {STATUS_META[item.prog.status]?.label ?? item.prog.status}
                          </span>
                          <div>
                            <p className="text-xs text-zinc-700">{item.prog.goalTitle}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
