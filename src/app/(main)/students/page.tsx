"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

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

const WORK_AREAS = [
  { value: "speech", label: "Konuşma", icon: "🗣️" },
  { value: "language", label: "Dil", icon: "📚" },
  { value: "hearing", label: "İşitme", icon: "👂" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterArea, setFilterArea] = useState<FilterArea>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  // Yeni öğrenci formu
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [workArea, setWorkArea] = useState("speech");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // Düzenleme modalı
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editWorkArea, setEditWorkArea] = useState("speech");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  function openEdit(student: Student) {
    setEditingStudent(student);
    setEditName(student.name);
    setEditBirthDate(toInputDate(student.birthDate));
    setEditWorkArea(student.workArea);
    setEditDiagnosis(student.diagnosis ?? "");
    setEditNotes(student.notes ?? "");
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent || !editName.trim()) { setEditError("Ad Soyad zorunludur."); return; }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName, birthDate: editBirthDate || null,
          workArea: editWorkArea, diagnosis: editDiagnosis, notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? { ...s, name: editName, birthDate: editBirthDate || null, workArea: editWorkArea, diagnosis: editDiagnosis || null, notes: editNotes || null }
            : s
        )
      );
      toast.success("Değişiklikler kaydedildi");
      setEditingStudent(null);
    } catch (err) {
      toast.error("Bir hata oluştu, tekrar deneyin");
      setEditError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setEditSubmitting(false);
    }
  }

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStudents(data.students ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  function resetForm() {
    setName(""); setBirthDate(""); setWorkArea("speech");
    setDiagnosis(""); setNotes(""); setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Ad Soyad zorunludur."); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate: birthDate || null, workArea, diagnosis, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      toast.success("Öğrenci başarıyla eklendi");
      setShowForm(false);
      resetForm();
      fetchStudents();
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
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Üst Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Öğrenciler</h1>
          <p className="text-sm text-zinc-500">
            {loading ? "Yükleniyor…" : (
              filtered.length === students.length
                ? `${students.length} öğrenci`
                : `${filtered.length} / ${students.length} öğrenci`
            )}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          + Yeni Öğrenci
        </Button>
      </div>

      {/* Filtre + Sıralama */}
      {!loading && students.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterArea(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  filterArea === opt.value
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span className="ml-1.5 text-zinc-400">
                    {students.filter((s) => s.workArea === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 shrink-0">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                "bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                sortBy !== "name"
                  ? "border-blue-400 text-blue-700 bg-blue-50"
                  : "border-zinc-200"
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Yeni Öğrenci Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-900">Yeni Öğrenci Ekle</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Ad Soyad *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Öğrenci adı"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthDate" className="text-sm font-medium">Doğum Tarihi</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Çalışma Alanı *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {WORK_AREAS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setWorkArea(w.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all text-xs font-medium",
                        workArea === w.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      <span className="text-lg">{w.icon}</span>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis" className="text-sm font-medium">Tanı</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Örn: Dil gelişim gecikmesi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium">Notlar</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Öğrenci hakkında ek notlar..."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-900">Öğrenci Düzenle</h2>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm font-medium">Ad Soyad *</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-birthDate" className="text-sm font-medium">Doğum Tarihi</Label>
                <Input id="edit-birthDate" type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Çalışma Alanı *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {WORK_AREAS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setEditWorkArea(w.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all text-xs font-medium",
                        editWorkArea === w.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      <span className="text-lg">{w.icon}</span>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-diagnosis" className="text-sm font-medium">Tanı</Label>
                <Input id="edit-diagnosis" value={editDiagnosis} onChange={(e) => setEditDiagnosis(e.target.value)} placeholder="Örn: Dil gelişim gecikmesi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-notes" className="text-sm font-medium">Notlar</Label>
                <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="resize-none text-sm" />
              </div>
              {editError && <p className="text-xs text-red-500">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={editSubmitting} className="flex-1">
                  {editSubmitting ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)} className="flex-1">
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hata */}
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          <strong>Hata:</strong> {fetchError}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
          <div className="text-5xl mb-3">👤</div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Henüz öğrenci yok</p>
          <p className="text-xs text-zinc-400">Yukarıdaki butona tıklayarak öğrenci ekle.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">Bu kategoride öğrenci bulunamadı.</p>
          <button onClick={() => setFilterArea("all")} className="mt-2 text-xs text-blue-600 hover:underline">
            Filtreyi temizle
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => (
            <div
              key={student.id}
              className="group relative rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <Link href={`/students/${student.id}`} className="block p-5">
                <div className="mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold text-sm">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{student.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  <Badge className={WORK_AREA_COLOR[student.workArea] ?? "bg-zinc-100 text-zinc-600"}>
                    {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                  </Badge>
                  {student.birthDate && <span>{calcAge(student.birthDate)}</span>}
                  {student.diagnosis && (
                    <span className="truncate">{student.diagnosis}</span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {student._count.cards} kart
                    {student.latestCardAt && (
                      <span className="ml-1">
                        · {new Date(student.latestCardAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-blue-600 font-medium group-hover:underline">
                    Detay →
                  </span>
                </div>
              </Link>
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(student)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Düzenle"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(student.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Silme onayı */}
              {confirmDeleteId === student.id && (
                <div className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 z-10">
                  <p className="text-sm font-medium text-zinc-700 text-center">
                    Bu öğrenciyi silmek istediğinize emin misiniz?
                  </p>
                  <p className="text-xs text-zinc-400 text-center">Tüm kartları da silinecek.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      disabled={deletingId === student.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      {deletingId === student.id ? "Siliniyor…" : "Evet, Sil"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
