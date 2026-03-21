"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, toInputDate } from "@/lib/utils";
import type { GeneratedCard } from "@/lib/prompts";
import {
  WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
  calcAge,
} from "@/lib/constants";
import { ProgressTab } from "@/components/students/ProgressTab";
import { CurriculumPicker } from "@/components/students/CurriculumPicker";
import { Markdown } from "@/components/Md";
import { SwipeableCard } from "@/components/SwipeableCard";

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
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const [confirmCardId, setConfirmCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);

  // Eğitim Profili — polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => {
    // Profil henüz hazır değilse (yeni öğrenci oluşturuldu, arka planda üretiliyor)
    if (student && !student.aiProfile && !generatingProfile) {
      setProfileTimedOut(false);

      // 30 saniye sonra timeout
      const timeoutId = setTimeout(() => {
        stopPolling();
        setProfileTimedOut(true);
      }, 30_000);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/students/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.student?.aiProfile) {
            setStudent((prev) => prev ? { ...prev, aiProfile: data.student.aiProfile } : prev);
            stopPolling();
            clearTimeout(timeoutId);
          }
        } catch { /* sessiz */ }
      }, 3000);

      return () => {
        stopPolling();
        clearTimeout(timeoutId);
      };
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [id, student?.aiProfile, generatingProfile]);

  async function handleGenerateProfile() {
    if (!student) return;
    setGeneratingProfile(true);
    try {
      const res = await fetch(`/api/students/${student.id}/ai-profile`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      setStudent((prev) => prev ? { ...prev, aiProfile: data.aiProfile } : prev);
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
        const [sRes, cRes] = await Promise.all([
          fetch(`/api/students/${id}`),
          fetch("/api/curriculum"),
        ]);
        if (sRes.status === 404) { setNotFound(true); return; }
        const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
        if (!sRes.ok) throw new Error(sData.error || `HTTP ${sRes.status}`);
        setStudent(sData.student);
        setCurricula(cData.curricula ?? []);
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
    <>
      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 bg-white px-6 py-2.5">
        <div className="mx-auto max-w-5xl flex items-center gap-2 text-sm">
          <Link href="/students" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            Öğrenciler
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-700 font-medium">{student.name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6 overflow-x-hidden">
        {/* Öğrenci Bilgileri */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#023435]/10 text-[#023435] font-bold text-xl">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={WORK_AREA_COLOR[student.workArea] ?? "bg-zinc-100 text-zinc-600"}>
                    {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                  </Badge>
                  {student.birthDate && (
                    <span className="text-sm text-zinc-500">{calcAge(student.birthDate)}</span>
                  )}
                  {student.diagnosis && (
                    <span className="text-sm text-zinc-500">· {student.diagnosis}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                Sil
              </Button>
              <Button size="sm" variant="outline" onClick={openEdit}>
                Düzenle
              </Button>
              <Link
                href={`/generate?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}
              >
                <Button size="sm">✨ Kart Üret</Button>
              </Link>
            </div>
          </div>

          {(student.notes || (student.curriculumIds?.length ?? 0) > 0) && (
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
              {student.notes && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Notlar</p>
                  <p className="text-sm text-zinc-600">{student.notes}</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
        )}

        {/* Düzenleme Modalı */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
        )}

        {/* Sekme Bar */}
        <div className="flex gap-1 border-b border-zinc-200">
          {([
            { key: "cards", label: "Kartlar", count: student.cards.length + student.assignments.length },
            { key: "progress", label: "İlerleme", count: null },
            { key: "aiProfile", label: "Eğitim Profili", count: null },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 pb-3 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "font-semibold text-[#023435] border-b-2 border-[#FE703A]"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1.5 text-zinc-400">{tab.count}</span>
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
                  AI destekli klinik arka plan ve uzman önerileri
                </p>
              </div>
            </div>

            {!student.aiProfile && !generatingProfile && !profileTimedOut && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-6 w-6 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500">Profil hazırlanıyor…</p>
                <p className="text-xs text-zinc-400 mt-1">Bu birkaç saniye sürebilir.</p>
              </div>
            )}

            {!student.aiProfile && !generatingProfile && profileTimedOut && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-sm font-medium text-zinc-600">Profil oluşturulamadı.</p>
                <p className="text-xs text-zinc-400 mt-1">Lütfen daha sonra tekrar deneyin.</p>
                <button
                  onClick={handleGenerateProfile}
                  className="mt-4 rounded-lg border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {generatingProfile && !student.aiProfile && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-6 w-6 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500">Profil oluşturuluyor…</p>
              </div>
            )}

            {student.aiProfile && (
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Bu öğrenci için üretilen kartlar
              <span className="ml-2 text-sm font-normal text-zinc-400">({student.cards.length})</span>
            </h2>
          </div>

          {student.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
              <div className="text-4xl mb-3">🗂️</div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Henüz kart üretilmedi</p>
              <p className="text-xs text-zinc-400 mb-4">
                Bu öğrenci için öğrenme kartı oluşturmak için &quot;Kart Üret&quot; butonuna tıkla.
              </p>
              <Link
                href={`/generate?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}
              >
                <Button size="sm">✨ Kart Üret</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
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
                  className="group relative rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-[#FE703A]/40 hover:shadow-md transition-all overflow-hidden"
                >
                  <Link href={`/cards/${card.id}`} className="block p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
                      <Badge className={WORK_AREA_COLOR[card.category] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                        {WORK_AREA_LABEL[card.category] ?? card.category}
                      </Badge>
                      <Badge className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                        {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                      </Badge>
                      <Badge className="bg-zinc-100 text-zinc-600" style={{ fontSize: "10px" }}>
                        {card.ageGroup}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-zinc-900 text-sm mb-1">{card.title}</h3>
                    {(card.content as GeneratedCard).objective && (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {(card.content as GeneratedCard).objective}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-zinc-400">
                        {new Date(card.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                      <span className="text-xs text-[#FE703A] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Detay →
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setConfirmCardId(card.id)}
                    className="absolute top-3 right-3 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Sil
                  </button>

                  {confirmCardId === card.id && (
                    <div className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                      <p className="text-sm font-medium text-zinc-700 text-center">
                        Bu kartı silmek istediğinize emin misiniz?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmCardId(null)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          disabled={deletingCardId === card.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Atanan kartlar
              <span className="ml-2 text-sm font-normal text-zinc-400">({student.assignments.length})</span>
            </h2>
          </div>

          {student.assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-12 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Henüz kart atanmadı</p>
              <p className="text-xs text-zinc-400">
                Kart kütüphanesinden bu öğrenciye kart atayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {student.assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/cards/${assignment.card.id}`}
                  className="group rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-[#FE703A]/40 hover:shadow-md transition-all overflow-hidden block p-4"
                >
                  <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
                    <Badge className={WORK_AREA_COLOR[assignment.card.category] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                      {WORK_AREA_LABEL[assignment.card.category] ?? assignment.card.category}
                    </Badge>
                    <Badge className={DIFFICULTY_COLOR[assignment.card.difficulty] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                      {DIFFICULTY_LABEL[assignment.card.difficulty] ?? assignment.card.difficulty}
                    </Badge>
                    <Badge className="bg-zinc-100 text-zinc-600" style={{ fontSize: "10px" }}>
                      {assignment.card.ageGroup}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm mb-1">{assignment.card.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-zinc-400">
                      {new Date(assignment.assignedAt).toLocaleDateString("tr-TR")}
                    </p>
                    <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Detay →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        </>}
      </main>
    </>
  );
}
