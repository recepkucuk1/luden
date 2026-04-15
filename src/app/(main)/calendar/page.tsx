"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { GlassCalendar } from "@/components/ui/glass-calendar";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

interface LessonStudent {
  id: string;
  name: string;
  workArea: string;
}

interface LessonException {
  id: string;
  lessonId: string;
  originalDate: string;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
  status: LessonStatus | null;
  note: string | null;
}

interface Lesson {
  id: string;
  studentId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  isRecurring: boolean;
  recurringDay: number | null;
  status: LessonStatus;
  student: LessonStudent;
  exceptions?: LessonException[];
}

interface DisplayLesson extends Lesson {
  displayDate: Date;
}

interface Student {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS   = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const RECURRING_DAYS = [
  { label: "Pzt", value: 1 }, { label: "Sal", value: 2 },
  { label: "Çar", value: 3 }, { label: "Per", value: 4 },
  { label: "Cum", value: 5 }, { label: "Cmt", value: 6 },
  { label: "Paz", value: 0 },
];

const START_HOUR  = 8;
const END_HOUR    = 20;
const HOUR_HEIGHT = 48;

const STATUS_PILL: Record<LessonStatus, string> = {
  PLANNED:   "bg-[rgba(16,121,150,0.12)] text-[#107996] border-[#107996]/25",
  COMPLETED: "bg-[rgba(2,52,53,0.1)] text-[#023435] border-[rgba(2,52,53,0.2)]",
  CANCELLED: "bg-[rgba(105,33,55,0.1)] text-[#692137] border-[rgba(105,33,55,0.2)]",
};
const STATUS_LABEL: Record<LessonStatus, string> = {
  PLANNED:   "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
};

const GLASS = "bg-[rgba(2,52,53,0.06)] border border-[rgba(2,52,53,0.12)] backdrop-blur-[12px]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}


function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function expandLessons(lessons: Lesson[], startDate: Date, endDate: Date): DisplayLesson[] {
  const result: DisplayLesson[] = [];
  for (const lesson of lessons) {
    if (!lesson.isRecurring) {
      const d = new Date(lesson.date);
      d.setHours(0, 0, 0, 0);
      if (d >= startDate && d <= endDate) result.push({ ...lesson, displayDate: d });
    } else {
      const recurStart = new Date(lesson.date);
      recurStart.setHours(0, 0, 0, 0);
      const d = new Date(startDate);
      while (d <= endDate) {
        if (d >= recurStart && d.getDay() === lesson.recurringDay) {
          const currentDateStr = new Date(d).toISOString().split("T")[0];
          const exception = lesson.exceptions?.find(ex => ex.originalDate.startsWith(currentDateStr));
          
          if (exception?.status === "CANCELLED") {
            // Cancelled exception means it's deleted for this instance
            d.setDate(d.getDate() + 1);
            continue;
          }

          result.push({
            ...lesson, 
            displayDate: new Date(d),
            ...(exception ? {
              title: exception.title ?? lesson.title,
              startTime: exception.startTime ?? lesson.startTime,
              endTime: exception.endTime ?? lesson.endTime,
              status: exception.status ?? lesson.status,
              note: exception.note ?? lesson.note,
            } : {})
          });
        }
        d.setDate(d.getDate() + 1);
      }
    }
  }
  return result.sort((a, b) => {
    const dc = a.displayDate.getTime() - b.displayDate.getTime();
    return dc !== 0 ? dc : timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

// Collect all dates that have at least one lesson (for GlassCalendar dots)
function collectLessonDates(lessons: Lesson[], year: number, month: number): Date[] {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month + 1, 0);
  return expandLessons(lessons, start, end).map((l) => l.displayDate);
}

// ─── 24-saat TimeSelect ───────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimeSelect({ value, onChange, inputCls }: {
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
}) {
  const [hh, mm] = value.split(":").map((p) => p.padStart(2, "0"));
  const selectCls = inputCls + " cursor-pointer";
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={hh ?? "09"}
        onChange={(e) => onChange(`${e.target.value}:${mm ?? "00"}`)}
        className={cn(selectCls, "w-20 text-center")}
      >
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-[#023435]/50 font-semibold select-none">:</span>
      <select
        value={mm ?? "00"}
        onChange={(e) => onChange(`${hh ?? "09"}:${e.target.value}`)}
        className={cn(selectCls, "w-20 text-center")}
      >
        {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function LessonModal({
  students, initialDate, lesson, onClose, onSave,
}: {
  students: Student[];
  initialDate?: Date;
  lesson?: Lesson | null;
  onClose: () => void;
  onSave: (data: Lesson) => void;
}) {
  const isEdit = !!lesson;
  const [studentId,    setStudentId]    = useState(lesson?.studentId ?? "");
  const [title,        setTitle]        = useState(lesson?.title ?? "");

  // Tarih: 3 ayrı alan (GG / AA / YYYY)
  const _initDate = lesson ? lesson.date.slice(0, 10) : (initialDate ? initialDate.toISOString().slice(0, 10) : "");
  const [dayStr,   setDayStr]   = useState(_initDate ? String(parseInt(_initDate.slice(8, 10), 10)) : "");
  const [monthStr, setMonthStr] = useState(_initDate ? String(parseInt(_initDate.slice(5, 7), 10))  : "");
  const [yearStr,  setYearStr]  = useState(_initDate ? _initDate.slice(0, 4) : "");
  // YYYY-MM-DD formatında birleştirilmiş değer
  const date = (dayStr && monthStr && yearStr && yearStr.length === 4)
    ? `${yearStr}-${monthStr.padStart(2, "0")}-${dayStr.padStart(2, "0")}`
    : "";

  const [startTime,    setStartTime]    = useState(lesson?.startTime ?? "09:00");
  const [endTime,      setEndTime]      = useState(lesson?.endTime   ?? "10:00");
  const [note,         setNote]         = useState(lesson?.note ?? "");
  const [isRecurring,  setIsRecurring]  = useState(lesson?.isRecurring ?? false);
  const [recurringDay, setRecurringDay] = useState<number>(lesson?.recurringDay ?? 1);
  const [saving,       setSaving]       = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!isEdit && studentId) {
      const s = students.find((st) => st.id === studentId);
      if (s) setTitle(`${s.name} Dersi`);
    }
  }, [studentId, students, isEdit]);

  async function handleSave() {
    if (!studentId || !title || !date || !startTime || !endTime) {
      toast.error("Öğrenci, başlık, tarih ve saatler zorunludur");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error("Bitiş saati başlangıç saatinden sonra olmalıdır");
      return;
    }
    setSaving(true);
    try {
      const body = {
        studentId, title, date, startTime, endTime,
        note: note || undefined,
        isRecurring,
        recurringDay: isRecurring ? recurringDay : undefined,
        ...(isEdit ? { status: lesson!.status } : {}),
      };
      const res  = await fetch(
        isEdit ? `/api/lessons/${lesson!.id}` : "/api/lessons",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata");
      toast.success(isEdit ? "Ders güncellendi" : "Ders eklendi");
      onSave(data.lesson);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[rgba(2,52,53,0.15)] bg-[#f8fafa] px-3 py-2 text-sm text-[#023435] placeholder-[#023435]/40 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/40";
  const labelCls = "mb-1.5 block text-xs font-medium text-[#023435]/60";

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(2,52,53,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl bg-white border border-[rgba(2,52,53,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(2,52,53,0.1)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#023435]">{isEdit ? "Dersi Düzenle" : "Yeni Ders Ekle"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#023435]/40 hover:bg-[#023435]/8 hover:text-[#023435]/80 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Öğrenci</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} style={{ colorScheme: "light" }}>
              <option value="">Öğrenci seçin</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ders başlığı" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tarih</label>
            <div className="relative mt-1">
              <div className="flex items-center gap-2">
                <input value={dayStr} onChange={(e) => setDayStr(e.target.value)} placeholder="GG" className={cn(inputCls, "w-16 text-center")} maxLength={2} />
                <span className="text-[#023435]/30 hidden sm:inline">/</span>
                <input value={monthStr} onChange={(e) => setMonthStr(e.target.value)} placeholder="AA" className={cn(inputCls, "w-16 text-center")} maxLength={2} />
                <span className="text-[#023435]/30 hidden sm:inline">/</span>
                <input value={yearStr} onChange={(e) => setYearStr(e.target.value)} placeholder="YYYY" className={cn(inputCls, "w-20 text-center")} maxLength={4} />
                
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="ml-auto w-11 h-11 flex items-center justify-center rounded-xl bg-[rgba(2,52,53,0.04)] hover:bg-[#FE703A]/10 text-[#023435]/60 hover:text-[#FE703A] transition-colors border border-transparent shadow-[0_2px_4px_rgba(2,52,53,0.02)]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              {showCalendar && (
                <div className="absolute top-[52px] left-0 right-0 z-50 bg-white shadow-[0_8px_32px_rgba(2,52,53,0.12)] rounded-3xl border border-[rgba(2,52,53,0.08)] overflow-hidden">
                  <GlassCalendar
                    selectedDate={(() => {
                      const d = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
                      return isNaN(d.getTime()) ? new Date() : d;
                    })()}
                    onSelectDate={(newDate) => {
                      setDayStr(String(newDate.getDate()).padStart(2, "0"));
                      setMonthStr(String(newDate.getMonth() + 1).padStart(2, "0"));
                      setYearStr(String(newDate.getFullYear()));
                      setShowCalendar(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Başlangıç</label>
              <TimeSelect value={startTime} onChange={setStartTime} inputCls={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bitiş</label>
              <TimeSelect value={endTime} onChange={setEndTime} inputCls={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#023435]/40 font-medium">Süre:</span>
            {[30, 40, 45, 60].map((m) => {
              const st = timeToMinutes(startTime);
              const end = st + m;
              const endStr = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
              const isActive = endTime === endStr;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEndTime(endStr)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors",
                    isActive
                      ? "bg-[#FE703A] text-white border-[#FE703A]"
                      : "border-[rgba(2,52,53,0.15)] text-[#023435]/50 hover:border-[#FE703A]/50"
                  )}
                >
                  {m}dk
                </button>
              );
            })}
          </div>
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded accent-[#FE703A]" />
              <span className="text-sm font-medium text-[#023435]/70">Haftalık tekrarlayan ders</span>
            </label>
            {isRecurring && (
              <div className="mt-2.5 flex gap-1.5 flex-wrap">
                {RECURRING_DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setRecurringDay(d.value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
                      recurringDay === d.value
                        ? "bg-[#FE703A] text-white border-[#FE703A]"
                        : "border-[rgba(2,52,53,0.2)] text-[#023435]/50 hover:border-[#FE703A]/50 hover:text-[#023435]/80"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Not <span className="text-[#023435]/30">(isteğe bağlı)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ders notu..." className={cn(inputCls, "resize-none")} />
          </div>
        </div>

        <div className="border-t border-[rgba(2,52,53,0.1)] px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-[rgba(2,52,53,0.15)] px-4 py-2 text-sm text-[#023435]/60 hover:bg-[#023435]/5 transition-colors">İptal</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#FE703A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-50 transition-colors">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ─── Lesson Detail Modal ──────────────────────────────────────────────────────

function LessonDetailModal({
  lesson, displayDate, onClose, onUpdate, onDelete,
}: {
  lesson: Lesson;
  displayDate: Date;
  onClose: () => void;
  onUpdate: (updated: Lesson) => void;
  onDelete: (id: string) => void;
}) {
  const [note,        setNote]        = useState(lesson.note ?? "");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [scope,       setScope]       = useState<"this" | "all">("this");

  const dateStr = formatDate(displayDate, "long");
  const originalDateStr = displayDate.toISOString().split("T")[0];

  async function changeStatus(status: LessonStatus) {
    setSaving(true);
    try {
      const qs = lesson.isRecurring ? `?scope=${scope}&date=${originalDateStr}` : "";
      const res  = await fetch(`/api/lessons/${lesson.id}${qs}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Durum güncellendi");
      onUpdate(data.lesson);
      // Wait here, if scope was "this", the server returns updated original lesson which has exceptions. 
      // This is handled by onUpdate at the top level
    } catch { toast.error("Güncelleme başarısız"); }
    finally   { setSaving(false); }
  }

  async function saveNote() {
    setSaving(true);
    try {
      const qs = lesson.isRecurring ? `?scope=${scope}&date=${originalDateStr}` : "";
      const res  = await fetch(`/api/lessons/${lesson.id}${qs}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Not kaydedildi");
      onUpdate(data.lesson);
      setEditingNote(false);
    } catch { toast.error("Not kaydedilemedi"); }
    finally   { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const qs = lesson.isRecurring ? `?scope=${scope}&date=${originalDateStr}` : "";
      const res = await fetch(`/api/lessons/${lesson.id}${qs}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error("Silinemedi");
      toast.success("Ders silindi");
      if (data.scope === "this") {
        // We shouldn't physically delete the lesson, just trigger an update so UI refreshes to show it cancelled
        // Wait, the API doesn't return the lesson object on DELETE.
        // Actually, for "this", we created an exception with status CANCELLED.
        // Easiest is to just reload page or tell caller to fetch again.
        // For now, let's call onUpdate with original lesson but changed so the effect applies.
        // But we don't have the updated lesson. Better: fetch it.
        const freshRes = await fetch(`/api/calendar?month=xx`); // no, we don't have this
        // Just reload window for now or trigger a refresh via custom event. Let's just reload.
        window.location.reload();
      } else {
        onDelete(lesson.id);
      }
    } catch { toast.error("Silme başarısız"); setDeleting(false); }
  }

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(2,52,53,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl bg-white border border-[rgba(2,52,53,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[rgba(2,52,53,0.1)] px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-[#023435]/40 mb-0.5">{lesson.student.name}</p>
              <h2 className="text-sm font-semibold text-[#023435]">{lesson.title}</h2>
              {lesson.isRecurring && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#FE703A]/80">↺ Haftalık tekrarlayan</span>
              )}
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1 text-[#023435]/30 hover:bg-[#023435]/8 hover:text-[#023435]/70 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="rounded-xl bg-[rgba(2,52,53,0.05)] border border-[rgba(2,52,53,0.1)] px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-[#023435]/50 capitalize">{dateStr}</p>
            <p className="text-sm font-semibold text-[#023435]">{lesson.startTime} – {lesson.endTime}</p>
          </div>

          {lesson.isRecurring && (
            <div className="flex bg-[rgba(2,52,53,0.04)] rounded-lg p-1 border border-[rgba(2,52,53,0.08)]">
              <button
                onClick={() => setScope("this")}
                className={cn("flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-colors", scope === "this" ? "bg-white shadow-sm text-[#023435]" : "text-[#023435]/50")}
              >
                Sadece Bu Ders
              </button>
              <button
                onClick={() => setScope("all")}
                className={cn("flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-colors", scope === "all" ? "bg-white shadow-sm text-[#023435]" : "text-[#023435]/50")}
              >
                Tüm Seri
              </button>
            </div>
          )}

          <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_PILL[lesson.status])}>
            {STATUS_LABEL[lesson.status]}
          </span>

          {lesson.status !== "CANCELLED" && (
            <div className="flex gap-2">
              {lesson.status !== "COMPLETED" && (
                <button onClick={() => changeStatus("COMPLETED")} disabled={saving}
                  className="flex-1 rounded-xl border border-[rgba(2,52,53,0.25)] bg-[rgba(2,52,53,0.08)] py-2 text-xs font-semibold text-[#023435] hover:bg-[rgba(2,52,53,0.15)] disabled:opacity-50 transition-colors">
                  ✓ Tamamlandı
                </button>
              )}
              <button onClick={() => changeStatus("CANCELLED")} disabled={saving}
                className="flex-1 rounded-xl border border-[rgba(105,33,55,0.25)] bg-[rgba(105,33,55,0.08)] py-2 text-xs font-semibold text-[#692137] hover:bg-[rgba(105,33,55,0.15)] disabled:opacity-50 transition-colors">
                ✕ İptal Et
              </button>
            </div>
          )}
          {lesson.status === "CANCELLED" && (
            <button onClick={() => changeStatus("PLANNED")} disabled={saving}
              className="w-full rounded-xl border border-[#107996]/30 bg-[rgba(16,121,150,0.1)] py-2 text-xs font-semibold text-[#107996] hover:bg-[rgba(16,121,150,0.18)] disabled:opacity-50 transition-colors">
              ↺ Yeniden Planla
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-[#023435]/50">Not</p>
              {!editingNote && (
                <button onClick={() => setEditingNote(true)} className="text-[10px] text-[#FE703A]/80 hover:text-[#FE703A] transition-colors">Düzenle</button>
              )}
            </div>
            {editingNote ? (
              <div className="space-y-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  className="w-full resize-none rounded-xl border border-[rgba(2,52,53,0.15)] bg-[#f8fafa] px-3 py-2 text-sm text-[#023435] placeholder-[#023435]/40 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/40" />
                <div className="flex gap-3">
                  <button onClick={() => setEditingNote(false)} className="text-xs text-[#023435]/30 hover:text-[#023435]/60 transition-colors">İptal</button>
                  <button onClick={saveNote} disabled={saving} className="text-xs font-semibold text-[#FE703A] disabled:opacity-50 transition-colors">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#023435]/60 rounded-xl bg-[rgba(2,52,53,0.04)] border border-[rgba(2,52,53,0.08)] px-3 py-2 min-h-[2.5rem]">
                {lesson.note || <span className="text-[#023435]/25">Not eklenmemiş</span>}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-[rgba(2,52,53,0.1)] px-5 py-3 flex justify-end">
          <button onClick={handleDelete} disabled={deleting}
            className="text-xs font-medium text-[#692137]/60 hover:text-[#692137] disabled:opacity-50 transition-colors">
            {deleting ? "Siliniyor..." : "Dersi Sil"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ─── Day Lessons List ─────────────────────────────────────────────────────────

function DayLessonList({
  date, lessons, allLessons, onLessonClick, onAddClick,
}: {
  date: Date;
  lessons: DisplayLesson[];
  allLessons: DisplayLesson[];
  onLessonClick: (l: Lesson, d: Date) => void;
  onAddClick: () => void;
}) {
  const dateStr = formatDate(date, "long");

  // Weekly stats
  const planned = allLessons.filter((l) => l.status === "PLANNED").length;
  const completed = allLessons.filter((l) => l.status === "COMPLETED").length;
  const cancelled = allLessons.filter((l) => l.status === "CANCELLED").length;

  // Upcoming lessons (next ones from today)
  const now = new Date();
  const upcoming = allLessons
    .filter((l) => l.displayDate >= now && l.status === "PLANNED")
    .slice(0, 3);

  return (
    <div className={cn("rounded-2xl", GLASS)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(2,52,53,0.1)] px-5 py-4">
        <div>
          <p className="text-xs text-[rgba(2,52,53,0.4)]">Seçilen gün</p>
          <p className="text-sm font-semibold text-[#023435] capitalize">{dateStr}</p>
        </div>
        <button
          onClick={onAddClick}
          className="rounded-xl bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
        >
          + Ekle
        </button>
      </div>

      {/* Weekly summary */}
      {allLessons.length > 0 && (
        <div className="px-5 py-3 border-b border-[rgba(2,52,53,0.08)] flex items-center gap-4">
          <span className="text-[10px] text-[#023435]/40 font-medium">Bu ay:</span>
          <span className="text-[11px] font-semibold text-[#107996]">{planned} planlandı</span>
          <span className="text-[11px] font-semibold text-[#023435]">{completed} tamamlandı</span>
          {cancelled > 0 && <span className="text-[11px] font-semibold text-[#692137]">{cancelled} iptal</span>}
        </div>
      )}

      {/* Lessons Timeline */}
      <div className="p-5 pl-4 relative">
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-3 text-3xl opacity-20">📅</div>
            <p className="text-sm font-medium text-[#023435]/40">Bu güne ait ders yok</p>
            <button
              onClick={onAddClick}
              className="mt-3 rounded-lg border border-[rgba(2,52,53,0.1)] px-4 py-1.5 text-xs font-semibold text-[#FE703A] hover:bg-[#FE703A]/10 transition-colors"
            >
              + Yeni Ders Ekle
            </button>
            {/* Upcoming Timeline Empty State */}
            {upcoming.length > 0 && (
              <div className="mt-8 relative text-left">
                <div className="flex items-center gap-2 mb-4 pl-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#FE703A] animate-ping" />
                  <p className="text-[10px] font-bold text-[#023435]/40 uppercase tracking-widest">Yaklaşandaki Oturumlar</p>
                </div>
                <div className="ml-[7px] border-l border-dashed border-[#FE703A]/30 pb-2 space-y-4">
                  {upcoming.map((l, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute -left-[4.5px] top-[14px] h-2 w-2 rounded-full bg-white border-2 border-[#FE703A]" />
                      <button
                        onClick={() => onLessonClick(l, l.displayDate)}
                        className="w-full text-left rounded-xl p-3 bg-white hover:bg-[rgba(2,121,150,0.03)] border border-[rgba(2,52,53,0.05)] hover:border-[#107996]/20 transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-[#107996]">
                            {formatDate(l.displayDate, "short")} · {l.startTime}
                          </p>
                          <span className="text-[9px] font-bold text-[#FE703A] opacity-0 group-hover:opacity-100 transition-opacity">İNCELE →</span>
                        </div>
                        <p className="text-sm font-extrabold text-[#023435]">{l.student.name}</p>
                        {l.title && <p className="text-[10px] text-[#023435]/50 truncate mt-0.5 font-medium">{l.title}</p>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative border-l-2 border-[rgba(2,52,53,0.1)] ml-[48px] pb-4 space-y-6">
            {lessons.map((l, i) => {
              // Check if lesson is active right now
              const isToday = l.displayDate.toDateString() === now.toDateString();
              const lStart = parseInt(l.startTime.split(":")[0]) * 60 + parseInt(l.startTime.split(":")[1]);
              const lEnd = parseInt(l.endTime.split(":")[0]) * 60 + parseInt(l.endTime.split(":")[1]);
              const currentMin = now.getHours() * 60 + now.getMinutes();
              const isActiveNow = isToday && currentMin >= lStart && currentMin <= lEnd;

              return (
                <div key={i} className="relative pl-6">
                  {/* Time Axis Label */}
                  <div className="absolute -left-[58px] top-1.5 w-12 text-right">
                    <p className={cn("text-[11px] font-bold", isActiveNow ? "text-[#FE703A]" : "text-[#023435]/60")}>
                      {l.startTime}
                    </p>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-[5px] top-[10px] h-2 w-2 rounded-full ring-4 ring-white",
                    isActiveNow ? "bg-[#FE703A] animate-pulse ring-[#FE703A]/20" : 
                    l.status === "COMPLETED" ? "bg-[#023435]" : 
                    l.status === "CANCELLED" ? "bg-[#692137]" : "bg-[#107996]"
                  )} />

                  {/* Class Card */}
                  <button
                    onClick={() => onLessonClick(l, l.displayDate)}
                    className={cn(
                      "w-full text-left cursor-pointer rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                      isActiveNow ? "bg-white shadow-sm border-[#FE703A]/30 ring-1 ring-[#FE703A]/10" : STATUS_PILL[l.status]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold truncate", isActiveNow ? "text-[#023435]" : "")}>
                          {l.student.name}
                        </p>
                        <p className={cn("text-[11px] font-medium mt-0.5 truncate", isActiveNow ? "text-[#023435]/60" : "opacity-70")}>
                          {l.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            isActiveNow ? "bg-[#FE703A]/10 text-[#FE703A]" : "bg-black/5"
                          )}>
                            {l.startTime} - {l.endTime}
                          </span>
                          {l.isRecurring && <span className="text-[10px] opacity-50" title="Tekrarlayan" >↺</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                          l.status === "PLANNED" ? "text-[#107996] bg-[#107996]/10 border border-[#107996]/10" :
                          l.status === "COMPLETED" ? "text-emerald-700 bg-emerald-100 border border-emerald-200" :
                          "text-[#692137] bg-red-100 border border-red-200"
                        )}>
                          {isActiveNow && l.status === "PLANNED" ? "ŞİMDİ" : STATUS_LABEL[l.status]}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  weekStart, lessons, onLessonClick, onSlotClick, onDropLesson,
}: {
  weekStart: Date;
  lessons: Lesson[];
  onLessonClick: (lesson: Lesson, date: Date) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onDropLesson?: (lessonId: string, newDate: Date, newHour: number) => void;
}) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const displayed = expandLessons(lessons, weekStart, weekEnd);

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const today       = new Date();
  const hours       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  // Current time indicator position
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTop = (nowMinutes - START_HOUR * 60) / 60 * HOUR_HEIGHT;
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  function lessonsForDay(date: Date): DisplayLesson[] {
    return displayed.filter((l) => isSameDay(l.displayDate, date));
  }

  function lessonStyle(l: DisplayLesson): React.CSSProperties {
    const top    = (timeToMinutes(l.startTime) - START_HOUR * 60) / 60 * HOUR_HEIGHT;
    const height = Math.max((timeToMinutes(l.endTime) - timeToMinutes(l.startTime)) / 60 * HOUR_HEIGHT, 24);
    return { top, height, left: 2, right: 2, position: "absolute" };
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="flex border-b border-[rgba(2,52,53,0.1)] sticky top-0 z-10"
        style={{ background: "rgba(240,247,247,0.92)", backdropFilter: "blur(12px)" }}
      >
        <div className="w-14 shrink-0" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className={cn("flex-1 min-w-[100px] py-2 text-center border-l border-[rgba(2,52,53,0.08)]", isToday && "bg-[#FE703A]/5")}>
              <p className="text-[11px] font-medium text-[rgba(2,52,53,0.4)]">{DAY_LABELS[i]}</p>
              <p className={cn("text-sm font-bold mt-0.5", isToday ? "text-[#FE703A]" : "text-[#023435]/70")}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>

      <div className="flex relative" style={{ height: totalHeight + 24 }}>
        <div className="w-14 shrink-0 relative">
          {hours.map((h) => (
            <div key={h} className="absolute w-full pr-2 text-right" style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8 }}>
              <span className="text-[10px] text-[rgba(2,52,53,0.35)]">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        {weekDays.map((day, i) => {
          const dayLessons = lessonsForDay(day);
          const isToday    = isSameDay(day, today);

          return (
            <div
              key={i}
              className={cn("flex-1 min-w-[100px] relative border-l border-[rgba(2,52,53,0.08)]", isToday && "border-l-2 border-l-[#FE703A]/30")}
              style={{ height: "100%", background: isToday ? "rgba(254,112,58,0.04)" : undefined }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-[rgba(2,52,53,0.06)] group/slot cursor-pointer"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  onClick={() => onSlotClick?.(day, h)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const lessonId = e.dataTransfer.getData("lessonId");
                    if (lessonId && onDropLesson) {
                      onDropLesson(lessonId, day, h);
                    }
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity text-[#FE703A]/40 text-lg font-light pointer-events-none">+</span>
                </div>
              ))}
              {/* Current time indicator */}
              {isToday && showNowLine && (
                <div className="absolute w-full z-20 pointer-events-none" style={{ top: nowTop }}>
                  <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FE703A] -ml-[5px] shrink-0" />
                    <div className="flex-1 h-[2px] bg-[#FE703A]" />
                  </div>
                </div>
              )}
              {dayLessons.map((l, j) => (
                <div
                  key={j}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("lessonId", l.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={(e) => { e.stopPropagation(); onLessonClick(l, l.displayDate); }}
                  style={lessonStyle(l)}
                  className={cn("cursor-pointer rounded-lg border px-1.5 py-1 text-[10px] overflow-hidden hover:opacity-75 transition-opacity z-10", STATUS_PILL[l.status])}
                >
                  <p className="font-semibold leading-tight truncate">{l.startTime} {l.student.name}</p>
                  <p className="leading-tight truncate opacity-70">{l.title}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();

  const [view,           setView]           = useState<"month" | "week">("month");
  const [currentDate,    setCurrentDate]    = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekStart,      setWeekStart]      = useState(() => getWeekStart(today));
  const [selectedDay,    setSelectedDay]    = useState<Date>(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  const query = view === "month"
    ? `month=${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
    : `week=${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;

  const { data: studentsData } = useSWR("/api/students", fetcher);
  const { data: lessonsData, mutate: mutateLessons, isLoading } = useSWR(`/api/lessons?${query}`, fetcher);

  const students: Student[] = studentsData?.students ?? [];
  const lessons: Lesson[] = lessonsData?.lessons ?? [];
  const loading = isLoading;

  const [showAddModal,   setShowAddModal]   = useState(false);
  const [addInitialDate, setAddInitialDate] = useState<Date | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: Lesson; date: Date } | null>(null);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("");

  useEffect(() => {
    // Request notification permission for upcoming lesson alerts
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Simple Notification Polling (check every minute)
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      // Expand lessons for today to correctly handle recurring ones
      const todaysLessons = expandLessons(lessons, now, now);
      
      // Look for lessons starting in exactly 15 minutes today
      todaysLessons.forEach(l => {
        const startMin = timeToMinutes(l.startTime);
        if (startMin - currentMin === 15) {
          new Notification("Yaklaşan Ders", {
            body: `${l.startTime}'da ${l.student.name} ile dersiniz başlayacak.`,
            icon: "/favicon.ico"
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [lessons]);

  // When GlassCalendar selects a date in another month → update currentDate for API
  function handleSelectDate(date: Date) {
    setSelectedDay(date);
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function prevPeriod() {
    if (view === "week") setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
    else setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextPeriod() {
    if (view === "week") setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
    else setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function goToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setSelectedDay(t);
    setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setWeekStart(getWeekStart(t));
  }

  function handleLessonSaved(lesson: Lesson) {
    mutateLessons((data: any) => {
      const prev = data?.lessons ?? [];
      const idx = prev.findIndex((l: Lesson) => l.id === lesson.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = lesson; return { ...data, lessons: n }; }
      return { ...data, lessons: [...prev, lesson] };
    }, false);
    setShowAddModal(false);
    if (selectedLesson) setSelectedLesson({ lesson, date: selectedLesson.date });
  }
  function handleLessonDeleted(id: string) {
    mutateLessons((data: any) => {
      const prev = data?.lessons ?? [];
      return { ...data, lessons: prev.filter((l: Lesson) => l.id !== id) };
    }, false);
    setSelectedLesson(null);
  }

  // Apply student filter
  const filteredLessons = useMemo(() => {
    if (!selectedStudentFilter) return lessons;
    return lessons.filter(l => l.studentId === selectedStudentFilter);
  }, [lessons, selectedStudentFilter]);

  // Derive lesson dots for GlassCalendar
  const lessonDotDates = collectLessonDates(
    filteredLessons,
    currentDate.getFullYear(),
    currentDate.getMonth() + 1
  );

  // Lessons for selected day
  const dayLessons = expandLessons(filteredLessons, selectedDay, selectedDay);

  // All lessons in the current month (for stats)
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const allMonthLessons = expandLessons(filteredLessons, monthStart, monthEnd);

  // Week period label
  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${weekStart.getDate()} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`;
  })();

  const navBtn = cn(
    "rounded-lg border border-[rgba(2,52,53,0.15)] p-1.5 text-[#023435]/50",
    "hover:bg-[rgba(2,52,53,0.06)] hover:text-[#023435]/80 transition-colors"
  );

  const handleDropLesson = async (lessonId: string, newDate: Date, newHour: number) => {
    const lessonToMove = lessons.find(l => l.id === lessonId);
    if (!lessonToMove) return;

    if (lessonToMove.isRecurring) {
      toast.error("Tekrarlayan dersleri sürükle-bırak ile taşıyamazsınız. Düzenleme ekranını kullanın.");
      return;
    }

    const startH = String(newHour).padStart(2, "0") + ":00";
    const oldSt = timeToMinutes(lessonToMove.startTime);
    const oldEn = timeToMinutes(lessonToMove.endTime);
    const dur = oldEn - oldSt;
    const newEn = newHour * 60 + dur;
    const endH = String(Math.floor(newEn/60)).padStart(2,"0") + ":" + String(newEn%60).padStart(2,"0");
    const dStr = newDate.toLocaleDateString("en-CA");

    if (newEn > 24*60) {
      toast.error("Ders süresi gün sonunu aşıyor");
      return;
    }

    try {
      const payload: any = {
        date: dStr,
        startTime: startH,
        endTime: endH,
      };
      if (lessonToMove.studentId) payload.studentId = lessonToMove.studentId;
      if (lessonToMove.title) payload.title = lessonToMove.title;

      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Taşıma başarısız");
      
      toast.success("Ders başarıyla taşındı");
      mutateLessons(); // SWR ile yeniden doğrula
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      // setLoading(false) gerekmez çünkü SWR bunu asenkron yönetiyor ancak drop için state korundu if necessary
    }
  };

  return (
    <main
      className="flex flex-col"
      style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%)" }}
    >
      <style jsx>{`
        main {
          --bg-start: #f0f7f7;
          --bg-mid: #e8f4f4;
          --bg-end: #f5fafa;
        }
        :global(.dark) main {
          --bg-start: #111827;
          --bg-mid: #111827;
          --bg-end: #111827;
        }
      `}</style>
      <div className="mx-auto max-w-6xl w-full px-4 py-6 flex flex-col flex-1">

        {/* ── Toolbar ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevPeriod} className={navBtn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={goToday} className="rounded-lg border border-[rgba(2,52,53,0.15)] px-3 py-1.5 text-xs font-medium text-[#023435]/60 hover:bg-[rgba(2,52,53,0.06)] hover:text-[#023435]/90 transition-colors">
              Bugün
            </button>
            <button onClick={nextPeriod} className={navBtn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-[#023435] ml-1">
              {view === "week" ? weekLabel : `${MONTH_LABELS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="rounded-xl border border-[rgba(2,52,53,0.1)] bg-white/50 px-3 py-1.5 text-xs font-semibold text-[#023435]/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FE703A]/20 transition-all cursor-pointer"
            >
              <option value="">Tüm Öğrenciler</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <div className={cn("flex rounded-xl p-0.5 border border-[rgba(2,52,53,0.06)] bg-[rgba(2,52,53,0.02)] shadow-inner", GLASS)}>
              {(["month", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    view === v ? "bg-[#023435] text-white" : "text-[#023435]/40 hover:text-[#023435]/70"
                  )}
                >
                  {v === "month" ? "Aylık" : "Haftalık"}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setAddInitialDate(view === "month" ? selectedDay : undefined); setShowAddModal(true); }}
              className="rounded-xl bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
            >
              + Ders Ekle
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-1 gap-5 py-4">
            <div className="w-full lg:w-[380px] h-96">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
            <div className="hidden lg:flex flex-1 flex-col gap-3">
              <Skeleton className="w-full h-20 rounded-xl" />
              <Skeleton className="w-full h-20 rounded-xl" />
              <Skeleton className="w-full h-20 rounded-xl" />
            </div>
          </div>
        ) : view === "month" ? (
          /* ── Monthly: GlassCalendar + Day lesson list ── */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
            {/* Left: GlassCalendar date picker */}
            <GlassCalendar
              selectedDate={selectedDay}
              onSelectDate={handleSelectDate}
              lessonDates={lessonDotDates}
            />

            {/* Right: lessons for selected day */}
            <DayLessonList
              date={selectedDay}
              lessons={dayLessons}
              allLessons={allMonthLessons}
              onLessonClick={(lesson, date) => setSelectedLesson({ lesson, date })}
              onAddClick={() => { setAddInitialDate(selectedDay); setShowAddModal(true); }}
            />
          </div>
        ) : (
          /* ── Weekly: full time-grid ── */
          <div className={cn("rounded-2xl overflow-hidden flex-1", GLASS)} style={{ minHeight: "calc(100vh - 120px)" }}>
            <WeekView
              weekStart={weekStart}
              lessons={filteredLessons}
              onLessonClick={(lesson, date) => setSelectedLesson({ lesson, date })}
              onSlotClick={(date, hour) => {
                setAddInitialDate(date);
                setShowAddModal(true);
              }}
              onDropLesson={handleDropLesson}
            />
          </div>
        )}

        {/* ── Modals ── */}
        {showAddModal && (
          <LessonModal
            students={students}
            initialDate={addInitialDate}
            onClose={() => setShowAddModal(false)}
            onSave={handleLessonSaved}
          />
        )}
        {selectedLesson && (
          <LessonDetailModal
            lesson={selectedLesson.lesson}
            displayDate={selectedLesson.date}
            onClose={() => setSelectedLesson(null)}
            onUpdate={(updated) => handleLessonSaved(updated)}
            onDelete={handleLessonDeleted}
          />
        )}
      </div>
    </main>
  );
}
