"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, toInputDate, formatDate } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";
import { StudentForm, StudentFormData } from "@/components/students/StudentForm";
import { ModalPortal } from "@/components/ui/modal-portal";

type FilterArea = "all" | "speech" | "language" | "hearing";
type SortBy = "name" | "birthDate-asc" | "birthDate-desc" | "lastCard" | "mostCards";

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  latestCardAt: string | null;
  _count: { cards: number };
  progressSummary: { completed: number; total: number };
}

const FILTER_OPTIONS: { value: FilterArea; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "speech", label: "Konuşma" },
  { value: "language", label: "Dil" },
  { value: "hearing", label: "İşitme" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Ada göre (A–Z)" },
  { value: "birthDate-asc", label: "Yaşa göre (küçükten büyüğe)" },
  { value: "birthDate-desc", label: "Yaşa göre (büyükten küçüğe)" },
  { value: "lastCard", label: "En son kart üretilene göre" },
  { value: "mostCards", label: "En çok kart üretilene göre" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filterArea, setFilterArea] = useState<FilterArea>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  // Curriculum
  const [curricula, setCurricula] = useState<{id:string;area:string;title:string}[]>([]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Silme
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(studentId: string) {
    setDeletingId(studentId);
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      toast.success("Öğrenci silindi");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/students?page=1&limit=1000");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStudents(data.students ?? []);
      setHasMore(data.hasMore ?? false);
      setCurrentPage(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadMoreStudents() {
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/students?page=${nextPage}&limit=1000`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudents((prev) => [...prev, ...(data.students ?? [])]);
      setHasMore(data.hasMore ?? false);
      setCurrentPage(nextPage);
    } catch {
      toast.error("Öğrenciler yüklenemedi");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    fetch("/api/curriculum")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setCurricula(d.curricula ?? []))
      .catch(() => {/* curriculum is optional */});
  }, []);


  async function handleCreate(data: StudentFormData) {
    if (!data.name.trim()) { setFormError("Ad Soyad zorunludur."); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: data.name, 
          birthDate: data.birthDate || null, 
          workArea: data.workArea, 
          diagnosis: data.diagnosis, 
          notes: data.notes, 
          curriculumIds: data.curriculumIds 
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Hata oluştu");
      toast.success("Öğrenci başarıyla eklendi");
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      toast.error("Bir hata oluştu, tekrar deneyin");
      setFormError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(data: StudentFormData) {
    if (!editingStudent || !data.name.trim()) { setFormError("Ad Soyad zorunludur."); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, 
          birthDate: data.birthDate || null,
          workArea: data.workArea, 
          diagnosis: data.diagnosis, 
          notes: data.notes,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Hata oluştu");
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? { ...s, name: data.name, birthDate: data.birthDate || null, workArea: data.workArea, diagnosis: data.diagnosis || null, notes: data.notes || null }
            : s
        )
      );
      toast.success("Değişiklikler kaydedildi");
      setEditingStudent(null);
    } catch (err) {
      toast.error("Bir hata oluştu, tekrar deneyin");
      setFormError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    let list = filterArea === "all"
      ? students
      : students.filter((s) => s.workArea === filterArea);

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "tr");
        case "birthDate-asc":
          return (a.birthDate ?? "9999").localeCompare(b.birthDate ?? "9999");
        case "birthDate-desc":
          return (b.birthDate ?? "0000").localeCompare(a.birthDate ?? "0000");
        case "lastCard":
          return (b.latestCardAt ?? "").localeCompare(a.latestCardAt ?? "");
        case "mostCards":
          return b._count.cards - a._count.cards;
        default:
          return 0;
      }
    });

    return list;
  }, [students, filterArea, sortBy]);

  return (
    <div className="min-h-full flex-1 w-full flex flex-col relative bg-[#F0F4F4] dark:bg-gray-900 overflow-x-hidden custom-scrollbar" style={{ background: "linear-gradient(135deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%)" }}>
      <style jsx>{`
        div {
          --bg-start: #f0f7f7;
          --bg-mid: #e8f4f4;
          --bg-end: #f5fafa;
        }
        :global(.dark) div {
          --bg-start: #111827;
          --bg-mid: #111827;
          --bg-end: #111827;
        }
      `}</style>
      {/* Dekoratif Işıklar (Orbs) */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#107996]/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/60 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.03)] px-6 py-4 transition-all">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#023435] dark:text-zinc-100 tracking-tight">Öğrenciler</h1>
            <p className="mt-0.5 text-xs text-[#023435]/60 dark:text-zinc-400 font-medium">
              {loading ? "Yükleniyor…" : (
                filtered.length === students.length
                  ? `${students.length} öğrenci`
                  : `${filtered.length} / ${students.length} öğrenci gösteriliyor`
              )}
            </p>
          </div>
          <Button 
            onClick={() => { setFormError(null); setShowForm(true); }}
            className="bg-[#FE703A] hover:bg-[#FE703A]/90 text-white font-bold tracking-wide shadow-md shadow-[#FE703A]/20 transition-all hover:-translate-y-0.5 rounded-xl px-5 h-10"
          >
            ✨ Yeni Öğrenci
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 relative z-10 flex-1">
        {/* Filtre + Sıralama */}
        {!loading && students.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 w-max p-1 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/60 dark:border-gray-700/60 rounded-full shadow-inner overflow-x-auto custom-scrollbar">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterArea(opt.value)}
                  className={cn(
                    "rounded-full px-5 py-2 text-xs font-bold transition-all whitespace-nowrap",
                    filterArea === opt.value
                      ? "bg-[#023435] dark:bg-gray-700 text-white dark:text-gray-100 shadow-md shadow-[#023435]/20 dark:shadow-black/20"
                      : "bg-transparent text-[#023435]/60 dark:text-gray-400 hover:text-[#023435] dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/50"
                  )}
                >
                  {opt.label}
                  {opt.value !== "all" && (
                    <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]", filterArea === opt.value ? "bg-white/20 dark:bg-gray-800/50 text-white dark:text-gray-300" : "bg-[#023435]/10 dark:bg-gray-800/50 text-[#023435]/60 dark:text-gray-500")}>
                      {students.filter((s) => s.workArea === opt.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#023435]/60 dark:text-gray-400 shrink-0">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-xl border border-white/80 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm px-4 py-2 text-sm font-bold text-[#023435] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/50 transition-all cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-sm font-medium">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

      {/* Yeni Öğrenci Modal */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-900">Yeni Öğrenci Ekle</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">✕</button>
            </div>
            <StudentForm 
              curricula={curricula}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitting={submitting}
              error={formError}
            />
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Düzenleme Modalı */}
      {editingStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-900">Öğrenci Düzenle</h2>
              <button onClick={() => setEditingStudent(null)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">✕</button>
            </div>
            <StudentForm 
              initialValues={{
                name: editingStudent.name,
                birthDate: toInputDate(editingStudent.birthDate) || "",
                workArea: editingStudent.workArea,
                diagnosis: editingStudent.diagnosis || "",
                notes: editingStudent.notes || ""
              }}
              curricula={curricula}
              onSubmit={handleEdit}
              onCancel={() => setEditingStudent(null)}
              submitting={submitting}
              error={formError}
            />
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Hata */}
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          <strong>Hata:</strong> {fetchError}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20 relative z-10">
          <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 dark:border-gray-700 bg-white/40 dark:bg-gray-800/40 shadow-sm backdrop-blur-md py-20 text-center relative z-10">
          <div className="text-5xl mb-4 opacity-80">👤</div>
          <p className="text-lg font-bold text-[#023435] dark:text-gray-100 mb-1">Henüz öğrenci kaydınız yok</p>
          <p className="text-sm font-medium text-[#023435]/50 dark:text-gray-400">Öğrencilerinizi eklemeye başlayarak raporlar üretebilirsiniz.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 dark:border-gray-700 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md py-16 text-center relative z-10">
          <p className="text-sm font-bold text-[#023435]/60 dark:text-gray-400 mb-3">Bu filtreye uygun öğrenci bulunamadı.</p>
          <button onClick={() => setFilterArea("all")} className="text-xs font-bold text-[#FE703A] border border-[#FE703A]/30 px-3 py-1.5 rounded-lg hover:bg-[#FE703A]/10 transition-colors">
            Filtreyi Temizle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10">
          {filtered.map((student) => (
            <div key={student.id} className="group relative rounded-3xl border border-white/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-800/60 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)] hover:border-[#107996]/30 dark:hover:border-gray-600/80 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-white/60 dark:hidden to-transparent pointer-events-none rounded-tr-3xl" />
              <Link href={`/students/${student.id}`} className="block p-5 flex-1 relative z-10">
                <div className="mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#023435]/10 dark:from-gray-700/50 to-[#107996]/10 dark:to-gray-800/50 text-[#023435] dark:text-gray-200 font-extrabold text-lg shadow-sm border border-white dark:border-gray-700">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="font-extrabold text-[#023435] dark:text-gray-100 text-[16px] mb-2 line-clamp-1">{student.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-xs mb-4">
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", WORK_AREA_COLOR[student.workArea] ?? "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400")}>
                    {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                  </span>
                  {student.birthDate && <span className="rounded-md border border-zinc-200/60 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-0.5 text-[10px] font-extrabold text-[#023435]/60 dark:text-gray-400 uppercase tracking-widest">{calcAge(student.birthDate)}</span>}
                  {student.diagnosis && <span className="truncate rounded-md border border-[#107996]/20 bg-[#107996]/5 px-2 py-0.5 text-[10px] font-extrabold text-[#107996] uppercase tracking-widest">{student.diagnosis}</span>}
                </div>
                
                <div className="mt-auto pt-4 border-t border-[#023435]/5 dark:border-gray-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#023435]/50 dark:text-gray-400 uppercase tracking-widest flex flex-col">
                      <span>{student._count.cards} Materyal</span>
                      {student.latestCardAt && <span className="text-[9px] opacity-70 mt-0.5">Son: {formatDate(student.latestCardAt, "short")}</span>}
                    </span>
                    <span className="text-xs text-[#FE703A] font-bold group-hover:translate-x-1 transition-transform">Detay →</span>
                  </div>
                  
                  {student.progressSummary.total > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-white/60 dark:border-gray-700/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#023435]/40 dark:text-gray-500 uppercase tracking-wider">{student.progressSummary.completed}/{student.progressSummary.total} Hedef</span>
                        <span className="text-[10px] font-extrabold text-[#107996] dark:text-[#90DDF0]">{Math.round((student.progressSummary.completed / student.progressSummary.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#023435]/5 dark:bg-gray-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#107996] to-[#023435] dark:from-[#90DDF0] dark:to-[#107996] transition-all duration-500 rounded-full" style={{ width: `${(student.progressSummary.completed / student.progressSummary.total) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-20">
                <button onClick={(e) => { e.preventDefault(); setFormError(null); setEditingStudent(student); }} className="rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm border border-white dark:border-gray-700 p-2 text-[#023435]/40 dark:text-gray-400 hover:text-[#107996] dark:hover:text-[#90DDF0] hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110" title="Düzenle">
                  <Pencil size={14} />
                </button>
                <button onClick={(e) => { e.preventDefault(); setConfirmDeleteId(student.id); }} className="rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm border border-white dark:border-gray-700 p-2 text-[#023435]/40 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all hover:scale-110" title="Sil">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Silme onayı */}
              {confirmDeleteId === student.id && (
                <div className="absolute inset-0 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-5 z-30">
                  <p className="text-sm font-bold text-[#023435] dark:text-gray-100 text-center">Bu öğrenciyi silmek istediğinize emin misiniz?</p>
                  <p className="text-[11px] font-semibold text-red-500/80 dark:text-red-400/80 uppercase tracking-widest text-center">Tüm materyalleri de silinecektir.</p>
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl border border-[#023435]/10 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs font-bold text-[#023435]/60 dark:text-gray-300 hover:bg-[#023435]/5 dark:hover:bg-gray-700 transition-colors">İptal</button>
                    <button onClick={() => handleDelete(student.id)} disabled={deletingId === student.id} className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-60 transition-colors">
                      {deletingId === student.id ? "Siliniyor…" : "Evet, Sil"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Daha fazla yükle */}
      {hasMore && (
        <div className="flex justify-center mt-8 pb-8 relative z-10">
          <button onClick={loadMoreStudents} disabled={loadingMore} className="rounded-xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm px-6 py-2.5 text-sm font-bold text-[#023435] hover:bg-white disabled:opacity-60 transition-all hover:-translate-y-0.5">
            {loadingMore ? "Yükleniyor…" : "Daha Fazla Yükle"}
          </button>
        </div>
      )}
      </main>
    </div>
  );
}
