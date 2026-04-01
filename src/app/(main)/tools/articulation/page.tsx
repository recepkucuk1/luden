"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Lightbulb, Home, RefreshCw, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
}

interface DrillItem {
  word: string;
  syllableCount: number;
  syllableBreak: string;
  position: string;
  targetSound: string;
  sentence?: string;
  visualPrompt?: string;
}

interface DrillResult {
  title: string;
  targetSounds: string[];
  positions: string[];
  level: string;
  items: DrillItem[];
  expertNotes?: string;
  cueTypes?: string[];
  homeGuidance?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOUND_GROUPS = [
  { label: "Sürtünme / Temas", sounds: ["/s/", "/z/", "/ş/", "/ç/", "/c/", "/j/"] },
  { label: "Akıcı",             sounds: ["/r/", "/l/", "/n/", "/m/"] },
  { label: "Patlayıcı",         sounds: ["/k/", "/g/", "/t/", "/d/", "/p/", "/b/"] },
  { label: "Diğer",             sounds: ["/f/", "/v/", "/h/", "/y/"] },
];

const POSITION_OPTIONS = [
  { value: "initial", label: "Başta" },
  { value: "medial",  label: "Ortada" },
  { value: "final",   label: "Sonda" },
];

const LEVEL_OPTIONS = [
  { value: "isolated",   label: "İzole Ses",    desc: "Tek başına ses tekrarı" },
  { value: "syllable",   label: "Hece Düzeyi",  desc: "Hece kombinasyonları" },
  { value: "word",       label: "Kelime",        desc: "Hedef sesi içeren kelimeler" },
  { value: "sentence",   label: "Cümle",         desc: "Kelimeleri içeren cümleler" },
  { value: "contextual", label: "Bağlam",        desc: "Paragraf düzeyinde" },
];

const ITEM_COUNTS = [10, 15, 20, 25, 30];

const THEMES = [
  { value: "none",          label: "Tema yok (karışık)" },
  { value: "Hayvanlar",     label: "Hayvanlar" },
  { value: "Yiyecekler",    label: "Yiyecekler" },
  { value: "Mevsimler ve hava", label: "Mevsimler ve hava" },
  { value: "Meslekler",     label: "Meslekler" },
  { value: "Okul eşyaları", label: "Okul eşyaları" },
  { value: "Vücut bölümleri", label: "Vücut bölümleri" },
  { value: "Spor ve oyunlar", label: "Spor ve oyunlar" },
];

const POSITION_LABEL: Record<string, string> = {
  initial: "Başta",
  medial:  "Ortada",
  final:   "Sonda",
};

const LEVEL_LABEL: Record<string, string> = {
  isolated:   "İzole Ses",
  syllable:   "Hece Düzeyi",
  word:       "Kelime Düzeyi",
  sentence:   "Cümle Düzeyi",
  contextual: "Bağlam İçi",
};

const LOADING_MSGS = [
  "Hedef ses analiz ediliyor...",
  "Türkçe kelime dağarcığı taranıyor...",
  "Ses pozisyonları kontrol ediliyor...",
  "Alıştırma materyali hazırlanıyor...",
  "Hece yapıları oluşturuluyor...",
  "Uzman önerileri ekleniyor...",
];

// ─── Helper: highlight target sound in text ───────────────────────────────────

function highlightSound(text: string, sounds: string[]) {
  if (!sounds.length) return <span>{text}</span>;
  // Strip slashes for matching: /s/ → s
  const letters = sounds.map((s) => s.replace(/\//g, "")).filter(Boolean);
  const pattern = new RegExp(`(${letters.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <span key={i} className="font-bold text-[#FE703A]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

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

// ─── Result Views ─────────────────────────────────────────────────────────────

function IsolatedView({ items }: { items: DrillItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <span className="text-xs font-semibold text-zinc-400 w-5">{i + 1}.</span>
          <span className="text-sm text-zinc-800">{item.word}</span>
        </li>
      ))}
    </ul>
  );
}

function SyllableView({ items }: { items: DrillItem[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#107996]/20 bg-[#107996]/5 px-3 py-2.5 text-center"
        >
          <span className="text-sm font-semibold text-[#107996]">{item.word}</span>
        </div>
      ))}
    </div>
  );
}

function WordView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400 w-8">#</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Kelime</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Heceler</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Pozisyon</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={cn("border-b border-zinc-100", i % 2 === 0 ? "bg-white" : "bg-zinc-50")}>
              <td className="py-2 text-xs text-zinc-400">{i + 1}</td>
              <td className="py-2 font-medium text-zinc-800">{highlightSound(item.word, sounds)}</td>
              <td className="py-2 text-zinc-500">{item.syllableBreak}</td>
              <td className="py-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {POSITION_LABEL[item.position] ?? item.position}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentenceView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
          <p className="text-sm font-semibold text-zinc-800 mb-1">
            {highlightSound(item.word, sounds)}
          </p>
          {item.sentence && (
            <p className="text-xs text-zinc-600 leading-relaxed">
              {highlightSound(item.sentence, sounds)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ContextualView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
          {item.sentence ? (
            <p className="text-sm text-zinc-700 leading-loose">
              {highlightSound(item.sentence, sounds)}
            </p>
          ) : (
            <p className="text-sm font-medium text-zinc-800">
              {highlightSound(item.word, sounds)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function DrillResultView({ drill }: { drill: DrillResult }) {
  const sounds = drill.targetSounds ?? [];

  return (
    <div className="space-y-5">
      {/* Header badges */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] mb-3">{drill.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          {sounds.map((s) => (
            <span key={s} className="rounded-full bg-[#107996]/10 border border-[#107996]/20 px-2.5 py-0.5 text-xs font-semibold text-[#107996]">
              {s}
            </span>
          ))}
          {(drill.positions ?? []).map((p) => (
            <span key={p} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
              {POSITION_LABEL[p] ?? p}
            </span>
          ))}
          <span className="rounded-full bg-[#FE703A]/10 border border-[#FE703A]/20 px-2.5 py-0.5 text-xs text-[#FE703A]">
            {LEVEL_LABEL[drill.level] ?? drill.level}
          </span>
          <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
            {drill.items?.length ?? 0} öğe
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        {drill.level === "isolated"   && <IsolatedView   items={drill.items} />}
        {drill.level === "syllable"   && <SyllableView   items={drill.items} />}
        {drill.level === "word"       && <WordView       items={drill.items} sounds={sounds} />}
        {drill.level === "sentence"   && <SentenceView   items={drill.items} sounds={sounds} />}
        {drill.level === "contextual" && <ContextualView items={drill.items} sounds={sounds} />}
      </div>

      {/* Cue Types */}
      {drill.cueTypes?.length ? (
        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-2">İpucu Türleri</p>
          <div className="flex flex-wrap gap-2">
            {drill.cueTypes.map((c, i) => (
              <span key={i} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Expert Notes */}
      {drill.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{drill.expertNotes}</p>
        </div>
      )}

      {/* Home Guidance */}
      {drill.homeGuidance && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-blue-800">Veli Rehberi</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">{drill.homeGuidance}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticulationPage() {
  const [students, setStudents]           = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,      setStudentId]      = useState("");
  const [selectedSounds, setSelectedSounds] = useState<string[]>([]);
  const [positions,      setPositions]      = useState<string[]>(["initial"]);
  const [level,          setLevel]          = useState("word");
  const [itemCount,      setItemCount]      = useState(15);
  const [theme,          setTheme]          = useState("none");
  const [formKey,        setFormKey]        = useState(0);

  // Result state
  const [loading,     setLoading]     = useState(false);
  const [drill,       setDrill]       = useState<DrillResult | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .finally(() => setStudentsLoading(false));
  }, []);

  function toggleSound(sound: string) {
    setSelectedSounds((prev) =>
      prev.includes(sound) ? prev.filter((s) => s !== sound) : [...prev, sound]
    );
  }

  function togglePosition(pos: string) {
    if (pos === "all") {
      setPositions(["initial", "medial", "final"]);
      return;
    }
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId)          { toast.error("Lütfen bir öğrenci seçin"); return; }
    if (!selectedSounds.length) { toast.error("En az bir hedef ses seçin"); return; }
    if (!positions.length)   { toast.error("En az bir ses pozisyonu seçin"); return; }

    setLoading(true);
    setDrill(null);
    setSavedCardId(null);

    try {
      const res = await fetch("/api/tools/articulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          targetSounds: selectedSounds,
          positions,
          level,
          itemCount,
          theme: theme === "none" ? undefined : theme,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setDrill(data.drill as DrillResult);
      setSavedCardId(data.cardId ?? null);
      toast.success("Alıştırma materyali üretildi!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setDrill(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setStudentId("");
    setSelectedSounds([]);
    setPositions(["initial"]);
    setLevel("word");
    setItemCount(15);
    setTheme("none");
  }

  const inputCls = "w-full rounded-xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#023435]/20 focus:border-[#023435]/40 placeholder:text-[#023435]/30";
  const labelCls = "block text-xs font-bold text-[#023435]/70 mb-1.5 uppercase tracking-wide";

  return (
    <div
      className="w-full flex flex-col relative md:h-[calc(100vh-0px)] md:overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#107996]/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FE703A]/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:h-full flex flex-col">
      {/* Header */}
      <div className="mb-5 shrink-0 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/70 px-5 py-4 shadow-[0_2px_8px_rgba(2,52,53,0.04)]">
        <Link
          href="/tools"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#023435]/50 hover:text-[#023435] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Araçlara Dön
        </Link>
        <h1 className="text-xl font-extrabold text-[#023435] tracking-tight">Artikülasyon Alıştırma Üretici</h1>
        <p className="text-sm text-[#023435]/60 mt-0.5">
          Konuşma sesi bozuklukları için hedef ses bazlı, kişiselleştirilmiş alıştırma materyalleri üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr] md:flex-1 md:min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col md:min-h-0">
          <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(2,52,53,0.04)] overflow-y-auto no-scrollbar md:flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci */}
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
                {selectedStudent && (
                  <div className="mt-2 rounded-xl border border-white/80 bg-white/50 backdrop-blur-sm px-3 py-2.5 flex flex-wrap gap-1.5">
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

              {/* Hedef sesler */}
              <div>
                <label className={labelCls}>
                  Hedef Ses(ler)
                  {selectedSounds.length > 0 && (
                    <span className="ml-2 text-[#107996] font-normal">
                      ({selectedSounds.join(", ")} seçili)
                    </span>
                  )}
                </label>
                <div className="space-y-2.5">
                  {SOUND_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] text-zinc-400 mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.sounds.map((sound) => (
                          <button
                            key={sound}
                            type="button"
                            onClick={() => toggleSound(sound)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                              selectedSounds.includes(sound)
                                ? "border-[#107996] bg-[#107996] text-white"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-[#107996]/40 hover:bg-[#107996]/5"
                            )}
                          >
                            {sound}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ses pozisyonu */}
              <div>
                <label className={labelCls}>Ses Pozisyonu</label>
                <div className="flex flex-wrap gap-2">
                  {POSITION_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePosition(p.value)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        positions.includes(p.value)
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => togglePosition("all")}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      positions.length === 3
                        ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    Tümü
                  </button>
                </div>
              </div>

              {/* Alıştırma seviyesi */}
              <div>
                <label className={labelCls}>Alıştırma Seviyesi</label>
                <div className="space-y-1.5">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLevel(opt.value)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                        level === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-zinc-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kelime sayısı */}
              <div>
                <label className={labelCls}>Kelime / Öğe Sayısı</label>
                <div className="flex gap-2">
                  {ITEM_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setItemCount(n)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors",
                        itemCount === n
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema */}
              <div>
                <label className={labelCls}>Tema <span className="font-normal text-zinc-400">(opsiyonel)</span></label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={inputCls}
                >
                  {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Üretiliyor..." : "Alıştırma Üret"}
              </button>

              <p className="text-center text-xs text-zinc-400">15 kredi kullanılacak</p>
            </form>
          </div>
        </div>

        {/* ── Sağ: Sonuç ── */}
        <div className="flex flex-col md:min-h-0">
          <div className="overflow-y-auto no-scrollbar flex flex-col md:flex-1 md:min-h-0">
            {loading ? (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(2,52,53,0.04)]">
                <div className="text-center space-y-4 px-8">
                  <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
                  <LoadingMessages />
                </div>
              </div>
            ) : drill ? (
              <div className="flex flex-col gap-4 md:flex-1 md:min-h-0">
                <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(2,52,53,0.04)] overflow-y-auto no-scrollbar md:flex-1">
                  <DrillResultView drill={drill} />
                </div>

                {/* Aksiyon butonları */}
                <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(2,52,53,0.04)] shrink-0">
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
                      Yeni Alıştırma Üret
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-[#023435]/15 bg-white/40 backdrop-blur-xl">
                <div className="text-center space-y-2 px-8">
                  <div className="text-4xl">🎤</div>
                  <p className="text-sm font-medium text-zinc-500">Henüz alıştırma üretilmedi</p>
                  <p className="text-xs text-zinc-400">
                    Sol taraftan hedef sesleri ve parametreleri seçip &quot;Alıştırma Üret&quot; butonuna bas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </div>
  );
}
