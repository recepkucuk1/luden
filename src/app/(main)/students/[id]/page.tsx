"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, toInputDate, formatDate } from "@/lib/utils";
import type { GeneratedCard } from "@/lib/prompts";
import {
  WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
  CARD_STATUS_LABEL,
  CARD_STATUS_COLOR,
  calcAge,
} from "@/lib/constants";
import { ProgressTab } from "@/components/students/ProgressTab";
import { CurriculumPicker } from "@/components/students/CurriculumPicker";
import { Markdown } from "@/components/Md";
import { SwipeableCard } from "@/components/SwipeableCard";
import { ModalPortal } from "@/components/ui/modal-portal";

function parseProfileSections(text: string): { title: string; content: string }[] {
  const result: { title: string; content: string }[] = [];
  let current: { title: string; content: string } | null = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) {
      if (current) result.push(current);
      current = { title: line.slice(3).trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) result.push(current);
  return result;
}

const SECTION_STYLE: Record<string, { box: string; title: string }> = {
  "Kavramsal Arka Plan": {
    box: "bg-[#023435]/5 border border-[#023435]/10",
    title: "text-[#023435]",
  },
  "Uzmana Öneriler": {
    box: "bg-[#FE703A]/5 border border-[#FE703A]/10",
    title: "text-[#FE703A]",
  },
};

const WORK_AREAS = [
  { value: "speech", label: "Konuşma", icon: "🗣️" },
  { value: "language", label: "Dil", icon: "📚" },
  { value: "hearing", label: "İşitme", icon: "👂" },
];

interface StudentCard {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  ageGroup: string;
  content: GeneratedCard;
  createdAt: string;
}

interface AssignedCard {
  id: string;
  status: string;
  assignedAt: string;
  card: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    ageGroup: string;
    createdAt: string;
  };
}

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  notes: string | null;
  curriculumIds: string[];
  aiProfile: string | null;
  createdAt: string;
  cards: StudentCard[];
  assignments: AssignedCard[];
}


export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [curricula, setCurricula] = useState<{id:string;area:string;title:string}[]>([]);
  const [editCurriculumIds, setEditCurriculumIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "progress" | "aiProfile">("cards");
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmCardId, setConfirmCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);

  // Yaklaşan dersler
  const [upcomingLessons, setUpcomingLessons] = useState<{
    id: string; title: string; date: string;
    startTime: string; endTime: string; status: string;
  }[]>([]);

  async function handleGenerateProfile() {
    if (!student) return;
    setGeneratingProfile(true);
    setConfirmRegenerate(false);
    try {
      const res = await fetch(`/api/students/${student.id}/ai-profile`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      setStudent((prev) => prev ? { ...prev, aiProfile: data.aiProfile } : prev);
      toast.success("Eğitim profili oluşturuldu");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Profil oluşturulamadı, tekrar deneyin");
    } finally {
      setGeneratingProfile(false);
    }
  }

  // Öğrenci silme
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);

  async function handleDeleteStudent() {
    if (!student) return;
    setDeletingStudent(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      toast.success("Öğrenci silindi");
      router.push("/students");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin");
      setDeletingStudent(false);
      setShowDeleteConfirm(false);
    }
  }

  // Düzenleme
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editWorkArea, setEditWorkArea] = useState("speech");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit() {
    if (!student) return;
    setEditName(student.name);
    setEditBirthDate(toInputDate(student.birthDate));
    setEditWorkArea(student.workArea);
    setEditDiagnosis(student.diagnosis ?? "");
    setEditNotes(student.notes ?? "");
    setEditCurriculumIds(student.curriculumIds ?? []);
    setEditError(null);
    setShowEdit(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !editName.trim()) { setEditError("Ad Soyad zorunludur."); return; }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName, birthDate: editBirthDate || null,
          workArea: editWorkArea, diagnosis: editDiagnosis, notes: editNotes,
          curriculumIds: editCurriculumIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      setStudent((prev) =>
        prev ? { ...prev, name: editName, birthDate: editBirthDate || null, workArea: editWorkArea, diagnosis: editDiagnosis || null, notes: editNotes || null, curriculumIds: editCurriculumIds } : prev
      );
      toast.success("Değişiklikler kaydedildi");
      setShowEdit(false);
    } catch (err) {
      toast.error("Bir hata oluştu, tekrar deneyin");
      setEditError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setEditSubmitting(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes, lRes] = await Promise.all([
          fetch(`/api/students/${id}`),
          fetch("/api/curriculum"),
          fetch(`/api/lessons?studentId=${id}&upcoming=true`),
        ]);
        if (sRes.status === 404) { setNotFound(true); return; }
        const [sData, cData, lData] = await Promise.all([sRes.json(), cRes.json(), lRes.json()]);
        if (!sRes.ok) throw new Error(sData.error || `HTTP ${sRes.status}`);
        setStudent(sData.student);
        setCurricula(cData.curricula ?? []);
        setUpcomingLessons(lData.lessons ?? []);
      } catch (err) {
        console.error("Öğrenci yüklenemedi:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function deleteCard(cardId: string) {
    setDeletingCardId(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      setStudent((prev) =>
        prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== cardId) } : prev
      );
      toast.success("Kart silindi");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin");
    } finally {
      setDeletingCardId(null);
      setConfirmCardId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-zinc-500">Öğrenci bulunamadı.</p>
        <Button variant="outline" onClick={() => router.push("/students")}>
          Öğrencilere Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 w-full flex flex-col relative bg-[#F0F4F4] overflow-x-hidden custom-scrollbar" style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}>
      {/* Dekoratif Işıklar (Orbs) */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#107996]/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

      {/* Breadcrumb - Sticky */}
      <div className="sticky top-0 z-30 border-b border-white/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.03)] px-6 py-3 transition-all">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Link href="/students" className="text-[#023435]/50 dark:text-gray-400 hover:text-[#023435] dark:hover:text-gray-200 transition-colors">
              Öğrenciler
            </Link>
            <span className="text-[#023435]/30 dark:text-gray-600">/</span>
            <span className="text-[#023435] dark:text-gray-100 tracking-tight">{student.name}</span>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl border-white dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-700 dark:hover:text-red-400 shadow-sm transition-all h-8 text-xs font-bold px-3">
              Sil
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit} className="rounded-xl border-white dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-[#023435]/60 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-[#023435] dark:hover:text-gray-100 shadow-sm transition-all h-8 text-xs font-bold px-3">
              Düzenle
            </Button>
            <Link
              href={`/generate?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}
            >
              <Button size="sm" className="bg-[#FE703A] hover:bg-[#FE703A]/90 text-white font-bold tracking-wide shadow-md shadow-[#FE703A]/20 transition-all hover:-translate-y-0.5 rounded-xl h-8 px-4 text-xs">
                ✨ Kart Üret
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 relative z-10 flex-1 space-y-6">
        {/* Öğrenci Bilgileri (Kutu) */}
        <div className="rounded-3xl border border-white/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-800/60 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-white/60 dark:hidden to-transparent pointer-events-none rounded-tr-3xl" />
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-5 min-w-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#023435]/10 dark:from-gray-700/50 to-[#107996]/10 dark:to-gray-800/50 text-[#023435] dark:text-gray-200 font-extrabold text-2xl shadow-sm border border-white dark:border-gray-700">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#023435] dark:text-gray-100 tracking-tight">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", WORK_AREA_COLOR[student.workArea] ?? "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400")}>
                    {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                  </span>
                  {student.birthDate && (
                    <span className="rounded-md border border-zinc-200/60 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-0.5 text-[10px] font-extrabold text-[#023435]/60 dark:text-gray-400 uppercase tracking-widest">{calcAge(student.birthDate)}</span>
                  )}
                  {student.diagnosis && (
                    <span className="truncate rounded-md border border-[#107996]/20 bg-[#107996]/5 px-2 py-0.5 text-[10px] font-extrabold text-[#107996] uppercase tracking-widest">{student.diagnosis}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(student.notes || (student.curriculumIds?.length ?? 0) > 0) && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-gray-700/50 space-y-3">
              {student.notes && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wide mb-1">Notlar</p>
                  <p className="text-sm text-zinc-600 dark:text-gray-300">{student.notes}</p>
                </div>
              )}
              {(student.curriculumIds?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Çalışma Modülleri</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.curriculumIds?.map(cid => {
                      const c = curricula.find(x => x.id === cid);
                      return c ? (
                        <span key={cid} className="rounded-full bg-[#FE703A]/10 border border-[#FE703A]/20 px-2.5 py-0.5 text-xs text-[#FE703A]">
                          {c.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Silme Onayı */}
        {showDeleteConfirm && (
          <ModalPortal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 text-center">
              <p className="text-base font-semibold text-zinc-900 mb-1">Öğrenciyi sil</p>
              <p className="text-sm text-zinc-500 mb-1">
                <strong>{student.name}</strong> silinecek.
              </p>
              <p className="text-xs text-zinc-400 mb-5">Bu işlem geri alınamaz. Tüm kartlar da silinecek.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={deletingStudent}>
                  İptal
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDeleteStudent} disabled={deletingStudent}>
                  {deletingStudent ? "Siliniyor…" : "Evet, Sil"}
                </Button>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Düzenleme Modalı */}
        {showEdit && (
          <ModalPortal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-zinc-900">Öğrenci Düzenle</h2>
                <button onClick={() => setShowEdit(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">✕</button>
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
                            ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <span className="text-lg">{w.icon}</span>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <CurriculumPicker
                  key={editWorkArea}
                  curricula={curricula}
                  selectedIds={editCurriculumIds}
                  onChange={setEditCurriculumIds}
                  defaultOpenKey={editWorkArea}
                />
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
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)} className="flex-1">
                    İptal
                  </Button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Yaklaşan Dersler */}
        {upcomingLessons.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-gray-100">Yaklaşan Dersler</h2>
              <a href="/calendar" className="text-xs text-[#FE703A] hover:underline">Takvime git →</a>
            </div>
            <div className="space-y-2">
              {upcomingLessons.map((l) => {
                const d = new Date(l.date);
                const dateStr = formatDate(d, "medium");
                const statusColor = l.status === "COMPLETED" ? "text-emerald-600" : l.status === "CANCELLED" ? "text-zinc-400" : "text-[#107996]";
                return (
                  <div key={l.id} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-gray-800/80 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-zinc-700 dark:text-gray-200">{l.title}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-gray-500 mt-0.5">{dateStr} · {l.startTime}–{l.endTime}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold", statusColor)}>
                      {l.status === "COMPLETED" ? "Tamamlandı" : l.status === "CANCELLED" ? "İptal" : "Planlandı"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sekme Bar */}
        <div className="flex gap-2 border-b border-[#023435]/10 dark:border-gray-800 mt-2 px-1">
          {([
            { key: "cards", label: "Kartlar", count: student.cards.length + student.assignments.length },
            { key: "progress", label: "İlerleme", count: null },
            { key: "aiProfile", label: "Eğitim Profili", count: null },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-3 text-[13px] font-extrabold uppercase tracking-wide transition-all translate-y-[1px]",
                activeTab === tab.key
                  ? "text-[#023435] dark:text-gray-100 border-b-[3px] border-[#FE703A]"
                  : "text-[#023435]/40 dark:text-gray-500 hover:text-[#023435] dark:hover:text-gray-300 border-b-[3px] border-transparent"
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[10px]", activeTab === tab.key ? "bg-[#FE703A]/10 text-[#FE703A] dark:text-[#FE703A]" : "bg-[#023435]/5 dark:bg-gray-800 text-[#023435]/40 dark:text-gray-500")}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* İlerleme Sekmesi */}
        {activeTab === "progress" && (
          <ProgressTab
            studentId={student.id}
            curriculumIds={student.curriculumIds ?? []}
            onEditClick={openEdit}
          />
        )}

        {/* Eğitim Profili Sekmesi */}
        {activeTab === "aiProfile" && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Eğitim Profili</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  AI destekli klinik arka plan ve uzman önerileri · 20 kredi
                </p>
              </div>
              {student.aiProfile && !generatingProfile && (
                <button
                  onClick={() => setConfirmRegenerate(true)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Yeniden Üret
                </button>
              )}
            </div>

            {/* Yeniden üret onay diyaloğu */}
            {confirmRegenerate && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800 mb-1">Mevcut profil silinecek, devam et?</p>
                <p className="text-xs text-amber-600 mb-3">Yeni profil oluşturmak 20 kredi harcar.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateProfile}
                    className="rounded-lg bg-[#FE703A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#FE703A]/90 transition-colors"
                  >
                    Evet, Yeniden Üret
                  </button>
                  <button
                    onClick={() => setConfirmRegenerate(false)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* Boş durum */}
            {!student.aiProfile && !generatingProfile && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">🧠</div>
                <p className="text-sm font-medium text-zinc-700 mb-1">Henüz eğitim profili oluşturulmadı</p>
                <p className="text-xs text-zinc-400 mb-5">
                  AI, öğrencinin bilgilerine göre klinik arka plan ve uzman önerileri hazırlar.
                </p>
                <button
                  onClick={handleGenerateProfile}
                  className="rounded-xl bg-[#FE703A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors shadow-sm"
                >
                  ✨ Eğitim Profili Üret
                </button>
              </div>
            )}

            {/* Yükleniyor */}
            {generatingProfile && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-6 w-6 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500">Profil oluşturuluyor…</p>
                <p className="text-xs text-zinc-400 mt-1">Bu birkaç saniye sürebilir.</p>
              </div>
            )}

            {/* Profil içeriği */}
            {student.aiProfile && !generatingProfile && (
              <div className="space-y-3 min-w-0">
                {parseProfileSections(student.aiProfile).map((section) => {
                  const style = SECTION_STYLE[section.title] ?? {
                    box: "bg-zinc-50 border border-zinc-100",
                    title: "text-zinc-700",
                  };
                  return (
                    <div key={section.title} className={cn("rounded-xl p-4", style.box)}>
                      <h2 className={cn("text-sm font-bold mb-3", style.title)}>
                        {section.title}
                      </h2>
                      <Markdown>{section.content.trim()}</Markdown>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Kartlar Sekmesi */}
        {activeTab === "cards" && <>

        {/* Bu öğrenci için üretilen kartlar */}
        <div>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-xl font-extrabold text-[#023435] tracking-tight">
              Öğrenciye Özel Üretilenler
              <span className="ml-3 text-sm font-semibold text-[#023435]/40">({student.cards.length})</span>
            </h2>
          </div>

          {student.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/40 shadow-sm backdrop-blur-md py-16 text-center relative z-10">
              <div className="text-4xl mb-4 opacity-80">🗂️</div>
              <p className="text-lg font-bold text-[#023435] mb-1">Henüz özel kart üretilmedi</p>
              <p className="text-sm font-medium text-[#023435]/50 mb-4">
                Bu öğrenci için yapay zeka destekli gelişim kartı hazırlamak çok kolay.
              </p>
              <Link
                href={`/generate?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}
              >
                <Button size="sm">✨ Kart Üret</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {student.cards.map((card) => (
                <SwipeableCard
                  key={card.id}
                  id={card.id}
                  openId={swipeOpenId}
                  onOpen={setSwipeOpenId}
                  onClose={() => setSwipeOpenId(null)}
                  onDeletePress={() => { setSwipeOpenId(null); setConfirmCardId(card.id); }}
                >
                <div
                  className="group relative rounded-3xl border border-white/80 bg-white/60 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)] hover:border-[#107996]/30 overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-white/60 to-transparent pointer-events-none rounded-tr-3xl" />
                  <Link href={`/cards/${card.id}`} className="block p-5 flex-1 relative z-10 flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-3 pr-8">
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", WORK_AREA_COLOR[card.category] ?? "border-zinc-200 text-zinc-600")}>
                        {WORK_AREA_LABEL[card.category] ?? card.category}
                      </span>
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", DIFFICULTY_COLOR[card.difficulty] ?? "border-zinc-200 text-zinc-600")}>
                        {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                      </span>
                      <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#023435]/60 uppercase tracking-widest">
                        {card.ageGroup}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-[#023435] text-[15px] mb-2 line-clamp-2 leading-snug">{card.title}</h3>
                    {(card.content as GeneratedCard).objective && (
                      <p className="text-[12px] font-medium text-[#023435]/60 mb-2 line-clamp-2">
                        {(card.content as GeneratedCard).objective}
                      </p>
                    )}
                    <div className="mt-auto pt-3 border-t border-[#023435]/5 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-[#023435]/40 uppercase tracking-widest">
                        {formatDate(card.createdAt, "short")}
                      </p>
                      <span className="text-xs text-[#FE703A] font-bold group-hover:translate-x-1 transition-transform">
                        Aç →
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setConfirmCardId(card.id)}
                    className="absolute top-4 right-4 rounded-full bg-white/90 shadow-sm border border-white p-2 text-[#023435]/40 hover:text-red-600 hover:bg-red-50 transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-20"
                  >
                    ✕
                  </button>

                  {confirmCardId === card.id && (
                    <div className="absolute inset-0 rounded-3xl bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-5 z-30">
                      <p className="text-sm font-bold text-[#023435] text-center">
                        Bu kartı silmek istediğinize emin misiniz?
                      </p>
                      <div className="flex gap-2 w-full mt-2">
                        <button
                          onClick={() => setConfirmCardId(null)}
                          className="flex-1 rounded-xl border border-[#023435]/10 bg-white px-3 py-2.5 text-xs font-bold text-[#023435]/60 hover:bg-[#023435]/5 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          disabled={deletingCardId === card.id}
                          className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          {deletingCardId === card.id ? "Siliniyor…" : "Evet, Sil"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </div>

        {/* Atanan kartlar */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-[#023435] tracking-tight">
              Kütüphaneden Atananlar
              <span className="ml-3 text-sm font-semibold text-[#023435]/40">({student.assignments.length})</span>
            </h2>
          </div>

          {student.assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/40 shadow-sm backdrop-blur-md py-16 text-center relative z-10">
              <div className="text-4xl mb-4 opacity-80">📋</div>
              <p className="text-lg font-bold text-[#023435] mb-1">Henüz kart atanmadı</p>
              <p className="text-sm font-medium text-[#023435]/50">
                Kart kütüphanesinden bu öğrenciye materyal atayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {student.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="group relative rounded-3xl border border-white/80 bg-white/60 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)] hover:border-[#107996]/30 overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-white/60 to-transparent pointer-events-none rounded-tr-3xl" />
                  <Link href={`/cards/${assignment.card.id}`} className="block p-5 pb-3 flex-1 relative z-10 flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-3 pr-8">
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", WORK_AREA_COLOR[assignment.card.category] ?? "border-zinc-200 text-zinc-600")}>
                        {WORK_AREA_LABEL[assignment.card.category] ?? assignment.card.category}
                      </span>
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border", DIFFICULTY_COLOR[assignment.card.difficulty] ?? "border-zinc-200 text-zinc-600")}>
                        {DIFFICULTY_LABEL[assignment.card.difficulty] ?? assignment.card.difficulty}
                      </span>
                      <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#023435]/60 uppercase tracking-widest">
                        {assignment.card.ageGroup}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-[#023435] text-[15px] mb-2 line-clamp-2 leading-snug">{assignment.card.title}</h3>
                    <p className="mt-auto pt-3 border-t border-[#023435]/5 text-[10px] font-bold text-[#023435]/40 uppercase tracking-widest">
                      Atanma: {formatDate(assignment.assignedAt, "short")}
                    </p>
                  </Link>
                  {/* Durum Seçici */}
                  <div className="px-5 pb-5 relative z-10 pt-2 border-t border-dashed border-[#023435]/10 mt-2">
                    <p className="text-[9px] font-extrabold text-[#023435]/50 uppercase tracking-wider mb-2 text-center">GELİŞİM DURUMU</p>
                    <div className="flex bg-white/50 p-1 rounded-xl border border-white/60 shadow-inner">
                      {(["not_started", "in_progress", "completed"] as const).map((s) => {
                        const isColorSelected = assignment.status === s;
                        let activeStyles = "";
                        if (isColorSelected && s === "not_started") activeStyles = "bg-zinc-100 text-zinc-700 shadow-sm border-zinc-200";
                        if (isColorSelected && s === "in_progress") activeStyles = "bg-[#FE703A]/10 text-[#FE703A] shadow-sm border-[#FE703A]/20";
                        if (isColorSelected && s === "completed")   activeStyles = "bg-[#107996]/10 text-[#107996] shadow-sm border-[#107996]/20";

                        return (
                        <button
                          key={s}
                          onClick={async () => {
                            const prev = assignment.status;
                            setStudent((p) =>
                              p
                                ? {
                                    ...p,
                                    assignments: p.assignments.map((a) =>
                                      a.id === assignment.id ? { ...a, status: s } : a
                                    ),
                                  }
                                : p
                            );
                            try {
                              const res = await fetch(
                                `/api/cards/assignments/${assignment.id}/status`,
                                {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: s }),
                                }
                              );
                              if (!res.ok) throw new Error();
                              toast.success(`Durum Güncellendi: ${CARD_STATUS_LABEL[s]}`);
                            } catch {
                              setStudent((p) =>
                                p
                                  ? {
                                      ...p,
                                      assignments: p.assignments.map((a) =>
                                        a.id === assignment.id ? { ...a, status: prev } : a
                                      ),
                                    }
                                  : p
                              );
                              toast.error("Durum güncellenemedi");
                            }
                          }}
                          className={cn(
                            "flex-1 rounded-lg px-2 py-2 text-[9px] font-extrabold uppercase tracking-wider transition-all border border-transparent mx-0.5",
                            isColorSelected
                              ? activeStyles
                              : "bg-transparent text-[#023435]/40 hover:text-[#023435]/70 hover:bg-white/40"
                          )}
                        >
                          {CARD_STATUS_LABEL[s]}
                        </button>
                      )})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </>}
      </main>
    </div>
  );
}
