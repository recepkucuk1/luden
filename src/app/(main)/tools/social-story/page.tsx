"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Lightbulb, Home, RefreshCw, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
}

interface StorySentence {
  type: "descriptive" | "perspective" | "directive" | "affirmative";
  text: string;
  visualPrompt?: string;
}

interface StoryResult {
  title: string;
  sentences: StorySentence[];
  expertNotes?: string;
  homeGuidance?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SITUATIONS = [
  "Sıra bekleme",
  "Selamlaşma",
  "Paylaşma",
  "Duygularını ifade etme",
  "Sınıf kurallarına uyma",
  "Arkadaş edinme",
  "Çatışma çözme",
  "Özür dileme",
  "Yardım isteme",
  "Diğer",
];

const ENVIRONMENTS = [
  "Okul",
  "Ev",
  "Park",
  "Market",
  "Hastane",
  "Rehabilitasyon merkezi",
];

const SENTENCE_TYPE_LABEL: Record<string, string> = {
  descriptive:  "Tanımlayıcı",
  perspective:  "Perspektif",
  directive:    "Yönlendirici",
  affirmative:  "Olumlu",
};

const SENTENCE_TYPE_COLOR: Record<string, string> = {
  descriptive:  "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  perspective:  "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  directive:    "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  affirmative:  "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

const LOADING_MSGS = [
  "Sosyal bağlam analiz ediliyor...",
  "Carol Gray formatı uygulanıyor...",
  "Perspektif cümleleri oluşturuluyor...",
  "Yaşa uygun dil ayarlanıyor...",
  "Hikaye yapılandırılıyor...",
  "Son dokunuşlar yapılıyor...",
];

// ─── Loading Messages ─────────────────────────────────────────────────────────

function LoadingMessages() {
  const [index, setIndex] = useState(0);
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SocialStoryPage() {
  const [students, setStudents]         = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,     setStudentId]     = useState("");
  const [situation,     setSituation]     = useState("");
  const [customSit,     setCustomSit]     = useState("");
  const [environment,   setEnvironment]   = useState("Okul");
  const [length,        setLength]        = useState<"short" | "medium" | "long">("medium");
  const [visualSupport, setVisualSupport] = useState(false);

  // Result state
  const [loading,    setLoading]    = useState(false);
  const [story,      setStory]      = useState<StoryResult | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [formKey,    setFormKey]    = useState(0);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .finally(() => setStudentsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) { toast.error("Lütfen bir öğrenci seçin"); return; }
    const finalSituation = situation === "Diğer" ? customSit.trim() : situation;
    if (!finalSituation) { toast.error("Lütfen sosyal durumu belirtin"); return; }

    setLoading(true);
    setStory(null);
    setSavedCardId(null);

    try {
      const res = await fetch("/api/tools/social-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, situation: finalSituation, environment, length, visualSupport }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setStory(data.story as StoryResult);
      setSavedCardId(data.cardId ?? null);
      toast.success("Sosyal hikaye üretildi!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStory(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setSituation("");
    setCustomSit("");
    setEnvironment("Okul");
    setLength("medium");
    setVisualSupport(false);
    setStudentId("");
  }

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#023435]/30 focus:border-[#023435]";
  const labelCls = "block text-xs font-semibold text-zinc-600 mb-1.5";

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
        <h1 className="text-xl font-bold text-[#023435]">Sosyal Hikaye Üretici</h1>
        <p className="text-sm text-zinc-500">
          Pragmatik dil ve sosyal iletişim becerileri için Carol Gray formatında kişiselleştirilmiş sosyal hikayeler üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] flex-1 min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci seçimi */}
              <div>
                <label className={labelCls}>Öğrenci</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">
                    {studentsLoading ? "Yükleniyor..." : "Öğrenci seçin"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Öğrenci bilgi kartı */}
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

              {/* Sosyal durum */}
              <div>
                <label className={labelCls}>Sosyal Durum</label>
                <select
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Durum seçin</option>
                  {SITUATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {situation === "Diğer" && (
                  <input
                    type="text"
                    placeholder="Sosyal durumu açıklayın..."
                    value={customSit}
                    onChange={(e) => setCustomSit(e.target.value)}
                    className={cn(inputCls, "mt-2")}
                    required
                  />
                )}
              </div>

              {/* Ortam */}
              <div>
                <label className={labelCls}>Ortam</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className={inputCls}
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
              </div>

              {/* Hikaye uzunluğu */}
              <div>
                <label className={labelCls}>Hikaye Uzunluğu</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["short", "medium", "long"] as const).map((l) => {
                    const labels = { short: "Kısa", medium: "Orta", long: "Uzun" };
                    const sub    = { short: "3–5 cümle", medium: "6–10 cümle", long: "11–15 cümle" };
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLength(l)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left transition-colors",
                          length === l
                            ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        <span className="block text-xs font-semibold">{labels[l]}</span>
                        <span className="block text-[10px] text-zinc-400">{sub[l]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Görsel destek */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-zinc-700">Görsel Destek Açıklamaları</p>
                  <p className="text-[10px] text-zinc-400">Her cümle için görsel sahne notu ekle</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisualSupport((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none",
                    visualSupport ? "bg-[#023435]" : "bg-zinc-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                      visualSupport ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Üretiliyor..." : "Sosyal Hikaye Üret"}
              </button>

              <p className="text-center text-xs text-zinc-400">20 kredi kullanılacak</p>
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
            ) : story ? (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                {/* Hikaye kartı */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
                  {/* Başlık */}
                  <h2 className="text-lg font-bold text-[#023435] mb-5">{story.title}</h2>

                  {/* Cümleler */}
                  <div className="space-y-2.5">
                    {story.sentences?.map((sentence, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                      >
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold h-fit mt-0.5",
                            SENTENCE_TYPE_COLOR[sentence.type] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"
                          )}
                        >
                          {SENTENCE_TYPE_LABEL[sentence.type] ?? sentence.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-800 leading-relaxed">{sentence.text}</p>
                          {sentence.visualPrompt && (
                            <p className="mt-1 text-xs italic text-zinc-400">{sentence.visualPrompt}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Uzman Notları */}
                  {story.expertNotes && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">{story.expertNotes}</p>
                    </div>
                  )}

                  {/* Veli Rehberi */}
                  {story.homeGuidance && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-800">Veli Rehberi</span>
                      </div>
                      <p className="text-xs text-blue-700 leading-relaxed">{story.homeGuidance}</p>
                    </div>
                  )}
                </div>

                {/* Aksiyon butonları */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shrink-0">
                  <p className="text-xs font-semibold text-zinc-400 mb-3">Sonraki adım</p>
                  <div className="flex flex-wrap gap-2">
                    {savedCardId && (
                      <Link
                        href="/cards"
                        className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <Library className="h-4 w-4" />
                        Kütüphaneye Git
                      </Link>
                    )}
                    <button
                      onClick={handleReset}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Yeni Hikaye Üret
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="text-center space-y-2 px-8">
                  <div className="text-4xl">📖</div>
                  <p className="text-sm font-medium text-zinc-500">Henüz hikaye üretilmedi</p>
                  <p className="text-xs text-zinc-400">
                    Sol taraftan parametreleri seçip &quot;Sosyal Hikaye Üret&quot; butonuna bas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
