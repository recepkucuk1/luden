"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

interface LessonStudent {
  id: string;
  name: string;
  workArea: string;
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
}

interface DisplayLesson extends Lesson {
  displayDate: Date;
}

interface Student {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS      = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_LABELS    = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const RECURRING_DAYS  = [
  { label: "Pzt", value: 1 }, { label: "Sal", value: 2 },
  { label: "Çar", value: 3 }, { label: "Per", value: 4 },
  { label: "Cum", value: 5 }, { label: "Cmt", value: 6 },
  { label: "Paz", value: 0 },
];

const START_HOUR  = 8;
const END_HOUR    = 20;
const HOUR_HEIGHT = 64;

// Glass pill classes per status
const STATUS_PILL: Record<LessonStatus, string> = {
  PLANNED:   "bg-[#107996]/25 text-[#63d4f5] border-[#107996]/40",
  COMPLETED: "bg-[rgba(100,200,150,0.25)] text-[#86efb5] border-[rgba(100,200,150,0.4)]",
  CANCELLED: "bg-[#692137]/25 text-[#f4a0b5] border-[#692137]/40",
};
const STATUS_LABEL: Record<LessonStatus, string> = {
  PLANNED:   "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
};

// Glass class shorthand
const GLASS = "bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[12px]";
const GLASS_HOVER = "hover:bg-[rgba(255,255,255,0.11)]";

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

function getMonthCalendarDays(year: number, month: number): Date[] {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDay  = new Date(firstDay);
  const dow       = startDay.getDay();
  startDay.setDate(startDay.getDate() - (dow === 0 ? 6 : dow - 1));
  const endDay    = new Date(lastDay);
  const edow      = endDay.getDay();
  endDay.setDate(endDay.getDate() + (edow === 0 ? 0 : 7 - edow));
  const days: Date[] = [];
  const d = new Date(startDay);
  while (d <= endDay) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
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
        if (d >= recurStart && d.getDay() === lesson.recurringDay)
          result.push({ ...lesson, displayDate: new Date(d) });
        d.setDate(d.getDate() + 1);
      }
    }
  }
  return result.sort((a, b) => {
    const dc = a.displayDate.getTime() - b.displayDate.getTime();
    return dc !== 0 ? dc : timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

// ─── Add/Edit Lesson Modal ────────────────────────────────────────────────────

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
  const [date,         setDate]         = useState(
    lesson ? lesson.date.slice(0, 10) : (initialDate ? initialDate.toISOString().slice(0, 10) : "")
  );
  const [startTime,    setStartTime]    = useState(lesson?.startTime ?? "09:00");
  const [endTime,      setEndTime]      = useState(lesson?.endTime   ?? "10:00");
  const [note,         setNote]         = useState(lesson?.note ?? "");
  const [isRecurring,  setIsRecurring]  = useState(lesson?.isRecurring ?? false);
  const [recurringDay, setRecurringDay] = useState<number>(lesson?.recurringDay ?? 1);
  const [saving,       setSaving]       = useState(false);

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

  const inputCls = "w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/40";
  const labelCls = "mb-1.5 block text-xs font-medium text-white/60";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,52,53,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className={cn("w-full max-w-md rounded-2xl shadow-2xl", GLASS)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">{isEdit ? "Dersi Düzenle" : "Yeni Ders Ekle"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Öğrenci */}
          <div>
            <label className={labelCls}>Öğrenci</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={inputCls}
              style={{ colorScheme: "dark" }}
            >
              <option value="">Öğrenci seçin</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {/* Başlık */}
          <div>
            <label className={labelCls}>Başlık</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ders başlığı" className={inputCls} />
          </div>
          {/* Tarih */}
          <div>
            <label className={labelCls}>Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
          </div>
          {/* Saatler */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Başlangıç</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className={labelCls}>Bitiş</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
            </div>
          </div>
          {/* Tekrarlayan */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded accent-[#FE703A]"
              />
              <span className="text-sm font-medium text-white/70">Haftalık tekrarlayan ders</span>
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
                        : "border-white/20 text-white/50 hover:border-[#FE703A]/50 hover:text-white/80"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Not */}
          <div>
            <label className={labelCls}>Not <span className="text-white/30">(isteğe bağlı)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ders notu..."
              className={cn(inputCls, "resize-none")}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(255,255,255,0.1)] px-5 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#FE703A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
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

  const dateStr = displayDate.toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  async function changeStatus(status: LessonStatus) {
    setSaving(true);
    try {
      const res  = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Durum güncellendi");
      onUpdate(data.lesson);
    } catch { toast.error("Güncelleme başarısız"); }
    finally   { setSaving(false); }
  }

  async function saveNote() {
    setSaving(true);
    try {
      const res  = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || null }),
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
      const res = await fetch(`/api/lessons/${lesson.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      toast.success("Ders silindi");
      onDelete(lesson.id);
    } catch { toast.error("Silme başarısız"); setDeleting(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,52,53,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className={cn("w-full max-w-sm rounded-2xl shadow-2xl", GLASS)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[rgba(255,255,255,0.1)] px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-white/40 mb-0.5">{lesson.student.name}</p>
              <h2 className="text-sm font-semibold text-white">{lesson.title}</h2>
              {lesson.isRecurring && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#FE703A]/80">
                  ↺ Haftalık tekrarlayan
                </span>
              )}
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1 text-white/30 hover:bg-white/10 hover:text-white/70 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Date/time */}
          <div className="rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-white/50 capitalize">{dateStr}</p>
            <p className="text-sm font-semibold text-white">{lesson.startTime} – {lesson.endTime}</p>
          </div>

          {/* Status badge */}
          <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_PILL[lesson.status])}>
            {STATUS_LABEL[lesson.status]}
          </span>

          {/* Status actions */}
          {lesson.status !== "CANCELLED" && (
            <div className="flex gap-2">
              {lesson.status !== "COMPLETED" && (
                <button
                  onClick={() => changeStatus("COMPLETED")}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-[rgba(100,200,150,0.35)] bg-[rgba(100,200,150,0.12)] py-2 text-xs font-semibold text-[#86efb5] hover:bg-[rgba(100,200,150,0.2)] disabled:opacity-50 transition-colors"
                >
                  ✓ Tamamlandı
                </button>
              )}
              <button
                onClick={() => changeStatus("CANCELLED")}
                disabled={saving}
                className="flex-1 rounded-xl border border-[#692137]/35 bg-[#692137]/15 py-2 text-xs font-semibold text-[#f4a0b5] hover:bg-[#692137]/25 disabled:opacity-50 transition-colors"
              >
                ✕ İptal Et
              </button>
            </div>
          )}
          {lesson.status === "CANCELLED" && (
            <button
              onClick={() => changeStatus("PLANNED")}
              disabled={saving}
              className="w-full rounded-xl border border-[#107996]/35 bg-[#107996]/15 py-2 text-xs font-semibold text-[#63d4f5] hover:bg-[#107996]/25 disabled:opacity-50 transition-colors"
            >
              ↺ Yeniden Planla
            </button>
          )}

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-white/50">Not</p>
              {!editingNote && (
                <button onClick={() => setEditingNote(true)} className="text-[10px] text-[#FE703A]/80 hover:text-[#FE703A] transition-colors">
                  Düzenle
                </button>
              )}
            </div>
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/40"
                />
                <div className="flex gap-3">
                  <button onClick={() => setEditingNote(false)} className="text-xs text-white/30 hover:text-white/60 transition-colors">İptal</button>
                  <button onClick={saveNote} disabled={saving} className="text-xs font-semibold text-[#FE703A] disabled:opacity-50 transition-colors">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/60 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] px-3 py-2 min-h-[2.5rem]">
                {lesson.note || <span className="text-white/20">Not eklenmemiş</span>}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.1)] px-5 py-3 flex justify-end">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-[#f4a0b5]/70 hover:text-[#f4a0b5] disabled:opacity-50 transition-colors"
          >
            {deleting ? "Siliniyor..." : "Dersi Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  year, month, lessons, onDayClick, onLessonClick,
}: {
  year: number;
  month: number;
  lessons: Lesson[];
  onDayClick: (date: Date) => void;
  onLessonClick: (lesson: Lesson, date: Date) => void;
}) {
  const today     = new Date();
  const days      = getMonthCalendarDays(year, month);
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const displayed = expandLessons(lessons, firstDay, lastDay);

  function lessonsForDay(date: Date): DisplayLesson[] {
    return displayed.filter((l) => isSameDay(l.displayDate, date));
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[rgba(255,255,255,0.08)]">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-white/30 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-l border-t border-[rgba(255,255,255,0.06)]">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday        = isSameDay(day, today);
          const dayLessons     = lessonsForDay(day);

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[90px] cursor-pointer border-b border-r border-[rgba(255,255,255,0.06)] p-1.5 transition-colors",
                isToday
                  ? "bg-[rgba(254,112,58,0.1)]"
                  : isCurrentMonth
                    ? "hover:bg-[rgba(255,255,255,0.04)]"
                    : "bg-[rgba(0,0,0,0.15)] hover:bg-[rgba(0,0,0,0.08)]"
              )}
            >
              <span className={cn(
                "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                isToday
                  ? "bg-[#FE703A] text-white font-bold"
                  : isCurrentMonth
                    ? "text-white/70"
                    : "text-white/20"
              )}>
                {day.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayLessons.slice(0, 2).map((l, j) => (
                  <div
                    key={j}
                    onClick={(e) => { e.stopPropagation(); onLessonClick(l, l.displayDate); }}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[10px] font-medium border cursor-pointer hover:opacity-75 transition-opacity",
                      STATUS_PILL[l.status]
                    )}
                  >
                    {l.startTime} {l.student.name}
                  </div>
                ))}
                {dayLessons.length > 2 && (
                  <p className="text-[10px] text-white/30 px-1">+{dayLessons.length - 2} ders</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day Panel ────────────────────────────────────────────────────────────────

function DayPanel({
  date, lessons, onClose, onLessonClick, onAddClick,
}: {
  date: Date;
  lessons: DisplayLesson[];
  onClose: () => void;
  onLessonClick: (l: Lesson, d: Date) => void;
  onAddClick: () => void;
}) {
  const dateStr = date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={cn("rounded-2xl p-4", GLASS)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white capitalize">{dateStr}</p>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs transition-colors">✕</button>
      </div>
      {lessons.length === 0 ? (
        <p className="text-xs text-white/30 mb-3">Bu gün ders yok</p>
      ) : (
        <div className="space-y-2 mb-3">
          {lessons.map((l, i) => (
            <div
              key={i}
              onClick={() => onLessonClick(l, l.displayDate)}
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition-opacity hover:opacity-75",
                STATUS_PILL[l.status]
              )}
            >
              <p className="text-xs font-semibold">{l.startTime} – {l.endTime}</p>
              <p className="text-xs mt-0.5">{l.student.name} · {l.title}</p>
              {l.isRecurring && <p className="text-[10px] mt-0.5 opacity-60">↺ Tekrarlayan</p>}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onAddClick}
        className="w-full rounded-xl bg-[#FE703A] py-2 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
      >
        + Ders Ekle
      </button>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  weekStart, lessons, onLessonClick,
}: {
  weekStart: Date;
  lessons: Lesson[];
  onLessonClick: (lesson: Lesson, date: Date) => void;
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
      {/* Header */}
      <div
        className="flex border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-10"
        style={{ background: "rgba(2,52,53,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="w-14 shrink-0" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="flex-1 min-w-[100px] py-2 text-center border-l border-[rgba(255,255,255,0.06)]">
              <p className="text-[11px] font-medium text-white/30">{DAY_LABELS[i]}</p>
              <p className={cn("text-sm font-bold mt-0.5", isToday ? "text-[#FE703A]" : "text-white/70")}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: totalHeight + 24 }}>
        {/* Hours column */}
        <div className="w-14 shrink-0 relative">
          {hours.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8 }}
            >
              <span className="text-[10px] text-white/25">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, i) => {
          const dayLessons = lessonsForDay(day);
          const isToday    = isSameDay(day, today);

          return (
            <div
              key={i}
              className="flex-1 min-w-[100px] relative border-l border-[rgba(255,255,255,0.06)]"
              style={{
                height: totalHeight,
                background: isToday ? "rgba(254,112,58,0.04)" : undefined,
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-[rgba(255,255,255,0.04)]"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}
              {dayLessons.map((l, j) => (
                <div
                  key={j}
                  onClick={() => onLessonClick(l, l.displayDate)}
                  style={lessonStyle(l)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-1.5 py-1 text-[10px] overflow-hidden hover:opacity-75 transition-opacity",
                    STATUS_PILL[l.status]
                  )}
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
  const [lessons,        setLessons]        = useState<Lesson[]>([]);
  const [students,       setStudents]       = useState<Student[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [addInitialDate, setAddInitialDate] = useState<Date | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: Lesson; date: Date } | null>(null);
  const [selectedDay,    setSelectedDay]    = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents((d.students ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))));
  }, []);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const query = view === "month"
        ? `month=${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
        : `week=${weekStart.toISOString().slice(0, 10)}`;
      const res  = await fetch(`/api/lessons?${query}`);
      const data = await res.json();
      setLessons(data.lessons ?? []);
    } catch { toast.error("Dersler yüklenemedi"); }
    finally   { setLoading(false); }
  }, [view, currentDate, weekStart]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  function prevPeriod() {
    if (view === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
    setSelectedDay(null);
  }
  function nextPeriod() {
    if (view === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
    setSelectedDay(null);
  }
  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekStart(getWeekStart(today));
    setSelectedDay(null);
  }

  function handleLessonSaved(lesson: Lesson) {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l.id === lesson.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = lesson; return n; }
      return [...prev, lesson];
    });
    setShowAddModal(false);
    if (selectedLesson) setSelectedLesson({ lesson, date: selectedLesson.date });
  }
  function handleLessonDeleted(id: string) {
    setLessons((prev) => prev.filter((l) => l.id !== id));
    setSelectedLesson(null);
  }

  const periodLabel = view === "month"
    ? `${MONTH_LABELS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : (() => {
        const end = new Date(weekStart);
        end.setDate(weekStart.getDate() + 6);
        return `${weekStart.getDate()} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`;
      })();

  const dayLessons = selectedDay ? expandLessons(lessons, selectedDay, selectedDay) : [];

  // Nav button shared style
  const navBtn = cn(
    "rounded-lg border border-[rgba(255,255,255,0.12)] p-1.5 text-white/50",
    "hover:bg-[rgba(255,255,255,0.08)] hover:text-white/80 transition-colors"
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #023435 0%, #034a4c 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ── Toolbar ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevPeriod} className={navBtn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="rounded-lg border border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white/90 transition-colors"
            >
              Bugün
            </button>
            <button onClick={nextPeriod} className={navBtn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-white capitalize ml-1">{periodLabel}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className={cn("flex rounded-xl p-0.5", GLASS)}>
              {(["month", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedDay(null); }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    view === v
                      ? "bg-[#FE703A] text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {v === "month" ? "Aylık" : "Haftalık"}
                </button>
              ))}
            </div>
            {/* Add */}
            <button
              onClick={() => { setAddInitialDate(undefined); setShowAddModal(true); }}
              className="rounded-xl bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
            >
              + Ders Ekle
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
          </div>
        ) : (
          <div className={cn("gap-4", view === "month" && selectedDay ? "grid grid-cols-1 lg:grid-cols-[1fr_260px]" : "")}>
            <div className={cn("rounded-2xl overflow-hidden", GLASS)}>
              {view === "month" ? (
                <MonthView
                  year={currentDate.getFullYear()}
                  month={currentDate.getMonth()}
                  lessons={lessons}
                  onDayClick={(d) => setSelectedDay((prev) => (prev && isSameDay(prev, d) ? null : d))}
                  onLessonClick={(lesson, date) => setSelectedLesson({ lesson, date })}
                />
              ) : (
                <WeekView
                  weekStart={weekStart}
                  lessons={lessons}
                  onLessonClick={(lesson, date) => setSelectedLesson({ lesson, date })}
                />
              )}
            </div>

            {view === "month" && selectedDay && (
              <DayPanel
                date={selectedDay}
                lessons={dayLessons}
                onClose={() => setSelectedDay(null)}
                onLessonClick={(lesson, date) => setSelectedLesson({ lesson, date })}
                onAddClick={() => { setAddInitialDate(selectedDay); setShowAddModal(true); }}
              />
            )}
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
    </div>
  );
}
