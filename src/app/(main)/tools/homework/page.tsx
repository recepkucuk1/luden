"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Library, Eye, Star, Clock, Package, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_AREA_LABEL, WORK_AREA_COLOR, calcAge } from "@/lib/constants";
import type { HomeworkContent } from "@/components/cards/HomeworkView";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  curriculumIds?: string[];
}

interface CurriculumItem {
  id: string;
  area: string;
  title: string;
  goals?: { id: string; title: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERAL_AREAS = [
  "Artikülasyon / Ses çalışması",
  "Dil gelişimi / Kelime hazinesi",
  "Akıcı konuşma",
  "Pragmatik dil / Sosyal iletişim",
  "İşitsel algı / Dinleme becerileri",
  "Oral motor egzersizler",
  "Diğer",
];

const MATERIAL_TYPE_OPTIONS = [
  { value: "exercise",       label: "Ev Egzersizi",         desc: "Adım adım yapılandırılmış aktivite" },
  { value: "observation",    label: "Gözlem Formu",          desc: "Velinin çocuğu gözlemleyip not alacağı form" },
  { value: "daily_activity", label: "Günlük Konuşma Aktivitesi", desc: "Günlük rutinlere entegre edilecek aktivite" },
];

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  exercise:       "Ev Egzersizi",
  observation:    "Gözlem Formu",
  daily_activity: "Günlük Aktivite",
};

const MATERIAL_TYPE_COLOR: Record<string, string> = {
  exercise:       "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  observation:    "bg-[#023435]/10 text-[#023435] border-[#023435]/20",
  daily_activity: "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

const LOADING_MSGS = [
  "Öğrenci profili analiz ediliyor...",
  "Hedef çalışma alanı değerlendiriliyor...",
  "Veli dostu talimatlar hazırlanıyor...",
  "Adımlar yapılandırılıyor...",
  "İpuçları ekleniyor...",
  "Son dokunuşlar yapılıyor...",
];

// ─── Loading Messages ─────────────────────────────────────────────────────────

function LoadingMessages() {
  const [index, setIndex]   = useState(0);
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

// ─── Result View (inline, for PDF exclusion of expertNotes) ──────────────────

function HomeworkResult({ hw, forPdf = false }: { hw: HomeworkContent; forPdf?: boolean }) {
  return (
    <div className="space-y-5">
      {/* Başlık + badge'ler */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] mb-3">{hw.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", MATERIAL_TYPE_COLOR[hw.materialType] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
            {MATERIAL_TYPE_LABEL[hw.materialType] ?? hw.materialType}
          </span>
          {hw.duration && (
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hw.duration}
            </span>
          )}
          {hw.targetArea && (
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
              {hw.targetArea}
            </span>
          )}
        </div>
      </div>

      {/* Giriş */}
      {hw.introduction && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex gap-3">
          <Lightbulb className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-700 leading-relaxed">{hw.introduction}</p>
        </div>
      )}

      {/* Gerekli malzemeler */}
      {hw.materials && hw.materials.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-500">Gerekli Malzemeler</p>
          </div>
          <ul className="space-y-1">
            {hw.materials.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE703A] shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adımlar */}
      {hw.steps && hw.steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-3">Adımlar</p>
          <div className="space-y-2.5">
            {hw.steps.map((step, i) => (
              <div key={i} className="rounded-lg border border-zinc-100 bg-white p-3 flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-[#107996]/10 text-[#107996] text-xs font-bold flex items-center justify-center">
                  {step.stepNumber ?? i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 leading-relaxed">{step.instruction}</p>
                  {step.tip && (
                    <p className="mt-1.5 rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5 text-xs italic text-zinc-500">
                      <ChevronRight className="inline h-3 w-3 mr-0.5" />
                      {step.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dikkat Edin */}
      {hw.watchFor && (
        <div className="rounded-xl border border-[#F4AE10]/30 bg-[#F4AE10]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Dikkat Edin</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{hw.watchFor}</p>
        </div>
      )}

      {/* Kutlama Anı */}
      {hw.celebration && (
        <div className="rounded-xl border border-[#023435]/20 bg-[#023435]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-[#023435] shrink-0" />
            <span className="text-xs font-semibold text-[#023435]">Kutlama Anı</span>
          </div>
          <p className="text-xs text-[#023435]/80 leading-relaxed">{hw.celebration}</p>
        </div>
      )}

      {/* Tekrar sıklığı */}
      {hw.frequency && (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-500">Öneri: <span className="font-medium text-zinc-700">{hw.frequency}</span></span>
        </div>
      )}

      {/* Uyarlama önerileri */}
      {hw.adaptations && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Uyarlama Önerileri</p>
          <p className="text-xs text-zinc-600 leading-relaxed">{hw.adaptations}</p>
        </div>
      )}

      {/* Uzman Notları — sadece ekranda, PDF'e dahil edilmez */}
      {!forPdf && hw.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{hw.expertNotes}</p>
        </div>
      )}
    </div>
  );
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadHomeworkPDF(hw: HomeworkContent, studentName?: string) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const MTLABEL: Record<string, string> = {
    exercise: "Ev Egzersizi", observation: "Gözlem Formu", daily_activity: "Günlük Aktivite",
  };

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 20, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    infoText:  { fontSize: 9, color: "#52525b", marginRight: 16 },
    sectionHdr:{ fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    intro:     { backgroundColor: "#f4f4f5", borderRadius: 4, padding: 10, marginBottom: 14 },
    introText: { fontSize: 10, lineHeight: 1.6, color: "#3f3f46" },
    matItem:   { fontSize: 9, color: "#3f3f46", marginBottom: 3 },
    stepWrap:  { marginBottom: 12 },
    stepRow:   { flexDirection: "row" },
    stepNum:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#107996", width: 22 },
    stepText:  { flex: 1, fontSize: 10, lineHeight: 1.6, color: "#3f3f46" },
    stepTip:   { fontSize: 8, color: "#a1a1aa", marginTop: 4, marginLeft: 22, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: "#d4d4d8" },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    freq:      { fontSize: 9, color: "#52525b", marginBottom: 10 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footerTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const steps  = Array.isArray(hw.steps)    ? hw.steps    : [];
  const mats   = Array.isArray(hw.materials) ? hw.materials : [];

  const Doc = () => (
    <Document title={hw.title} author="LudenLab">
      <Page size="A4" style={S.page}>

        {/* Başlık */}
        <Text style={S.title}>{hw.title ?? ""}</Text>

        {/* Bilgi satırı */}
        <View style={S.infoRow}>
          {studentName ? <Text style={S.infoText}>Öğrenci: {studentName}</Text> : null}
          {hw.duration  ? <Text style={S.infoText}>Süre: {hw.duration}</Text>   : null}
          {hw.targetArea ? <Text style={S.infoText}>{hw.targetArea}</Text>      : null}
          <Text style={[S.infoText, { marginRight: 0 }]}>
            {MTLABEL[hw.materialType] ?? hw.materialType}
          </Text>
          <Text style={[S.infoText, { marginLeft: "auto", marginRight: 0 }]}>{today}</Text>
        </View>

        {/* Giriş */}
        {hw.introduction ? (
          <View style={[S.intro, { marginBottom: 14 }]}>
            <Text style={S.introText}>{hw.introduction}</Text>
          </View>
        ) : null}

        {/* Malzemeler */}
        {mats.length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={S.sectionHdr}>Gerekli Malzemeler</Text>
            {mats.map((m, i) => (
              <Text key={i} style={S.matItem}>• {m}</Text>
            ))}
          </View>
        ) : null}

        {/* Adımlar */}
        {steps.length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={S.sectionHdr}>Adımlar</Text>
            {steps.map((step, i) => (
              <View key={i} style={S.stepWrap}>
                <View style={S.stepRow}>
                  <Text style={S.stepNum}>{step.stepNumber ?? i + 1}.</Text>
                  <Text style={S.stepText}>{step.instruction ?? ""}</Text>
                </View>
                {step.tip ? <Text style={S.stepTip}>İpucu: {step.tip}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Dikkat Edin */}
        {hw.watchFor ? (
          <View style={[S.box, { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>⚠ Dikkat Edin</Text>
            <Text style={[S.boxText,  { color: "#78350f" }]}>{hw.watchFor}</Text>
          </View>
        ) : null}

        {/* Kutlama Anı */}
        {hw.celebration ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" }]}>
            <Text style={[S.boxTitle, { color: "#14532d" }]}>★ Kutlama Anı</Text>
            <Text style={[S.boxText,  { color: "#166534" }]}>{hw.celebration}</Text>
          </View>
        ) : null}

        {/* Tekrar sıklığı */}
        {hw.frequency ? <Text style={S.freq}>Önerilen Sıklık: {hw.frequency}</Text> : null}

        {/* Uyarlama önerileri */}
        {hw.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText,  { color: "#4b5563" }]}>{hw.adaptations}</Text>
          </View>
        ) : null}

        {/* expertNotes — PDF'e dahil edilmez */}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footerTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${(hw.title ?? "ev-odevi").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeworkPage() {
  const [students, setStudents]         = useState<Student[]>([]);
  const [curricula, setCurricula]       = useState<CurriculumItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Form state
  const [studentId,    setStudentId]    = useState("");
  const [targetArea,   setTargetArea]   = useState("");
  const [customArea,   setCustomArea]   = useState("");
  const [duration,     setDuration]     = useState<"10" | "15" | "20">("15");
  const [parentLevel,  setParentLevel]  = useState<"basic" | "detailed">("basic");
  const [materialType, setMaterialType] = useState<"exercise" | "observation" | "daily_activity">("exercise");
  const [extraNote,    setExtraNote]    = useState("");

  // Result state
  const [loading,     setLoading]     = useState(false);
  const [homework,    setHomework]    = useState<HomeworkContent | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [formKey,     setFormKey]     = useState(0);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  // Öğrencinin modüllerinden türetilen hedef alanlar
  const studentAreas = curricula
    .filter((c) => selectedStudent?.curriculumIds?.includes(c.id))
    .map((c) => c.title);

  const areaOptions = studentAreas.length > 0 ? [...studentAreas, "Diğer"] : GENERAL_AREAS;

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/curriculum").then((r) => r.json()),
    ]).then(([sData, cData]) => {
      setStudents(sData.students ?? []);
      setCurricula(cData.curricula ?? []);
    }).finally(() => setStudentsLoading(false));
  }, []);

  // Öğrenci değişince alan seçimini sıfırla
  function handleStudentChange(id: string) {
    setStudentId(id);
    setTargetArea("");
    setCustomArea("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) { toast.error("Lütfen bir öğrenci seçin"); return; }
    const finalArea = targetArea === "Diğer" ? customArea.trim() : targetArea;
    if (!finalArea) { toast.error("Lütfen çalışma alanını belirtin"); return; }

    setLoading(true);
    setHomework(null);
    setSavedCardId(null);

    try {
      const res = await fetch("/api/tools/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          targetArea: finalArea,
          duration,
          parentLevel,
          materialType,
          extraNote: extraNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Bir hata oluştu"); return; }
      setHomework(data.homework as HomeworkContent);
      setSavedCardId(data.cardId ?? null);
      toast.success("Ev ödevi materyali üretildi!");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setHomework(null);
    setSavedCardId(null);
    setFormKey((k) => k + 1);
    setStudentId("");
    setTargetArea("");
    setCustomArea("");
    setDuration("15");
    setParentLevel("basic");
    setMaterialType("exercise");
    setExtraNote("");
  }

  async function handleDownloadPDF() {
    if (!homework) return;
    setDownloading(true);
    const loadingToast = toast.loading("PDF hazırlanıyor...");
    try {
      await downloadHomeworkPDF(homework, selectedStudent?.name);
      toast.success("PDF indirildi", { id: loadingToast });
    } catch {
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloading(false);
    }
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
        <h1 className="text-xl font-bold text-[#023435]">Ev Ödevi Materyali Üretici</h1>
        <p className="text-sm text-zinc-500">
          Velilerin evde uygulayabileceği, uzman yönlendirmeli çalışma materyalleri üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] flex-1 min-h-0">
        {/* ── Sol: Form ── */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
            <form key={formKey} onSubmit={handleSubmit} className="space-y-5">

              {/* Öğrenci */}
              <div>
                <label className={labelCls}>Öğrenci</label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
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

              {/* Çalışma Alanı */}
              <div>
                <label className={labelCls}>
                  Çalışma Alanı
                  {studentAreas.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-normal text-zinc-400">(öğrencinin modüllerinden)</span>
                  )}
                </label>
                <select
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Alan seçin</option>
                  {areaOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {targetArea === "Diğer" && (
                  <input
                    type="text"
                    placeholder="Çalışma alanını açıklayın..."
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className={cn(inputCls, "mt-2")}
                    required
                  />
                )}
              </div>

              {/* Süre */}
              <div>
                <label className={labelCls}>Süre</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["10", "15", "20"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-center transition-colors",
                        duration === d
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{d} dk</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Veli Bilgi Düzeyi */}
              <div>
                <label className={labelCls}>Veli Bilgi Düzeyi</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "basic",    label: "Temel",    desc: "Basit anlatım" },
                    { value: "detailed", label: "Detaylı",  desc: "Teknik bilgi" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setParentLevel(opt.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left transition-colors",
                        parentLevel === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{opt.label}</span>
                      <span className="block text-[10px] text-zinc-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Materyal Türü */}
              <div>
                <label className={labelCls}>Materyal Türü</label>
                <div className="space-y-2">
                  {MATERIAL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaterialType(opt.value as typeof materialType)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                        materialType === opt.value
                          ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-xs font-semibold">{opt.label}</span>
                      <span className="block text-[10px] text-zinc-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ek Not */}
              <div>
                <label className={labelCls}>
                  Ek Not
                  <span className="ml-1 text-[10px] font-normal text-zinc-400">(opsiyonel)</span>
                </label>
                <textarea
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  placeholder="Bu oturumdaki gözlemleriniz, özel durumlar..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Üretiliyor..." : "Ev Ödevi Üret"}
              </button>
              <p className="text-center text-xs text-zinc-400">15 kredi kullanılacak</p>
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
            ) : homework ? (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-y-auto no-scrollbar flex-1">
                  <HomeworkResult hw={homework} />
                </div>

                {/* Aksiyon butonları */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shrink-0">
                  <p className="text-xs font-semibold text-zinc-400 mb-3">Sonraki adım</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#FE703A]/90 disabled:opacity-60 transition-colors"
                    >
                      {downloading ? "Hazırlanıyor..." : "PDF İndir"}
                    </button>
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
                      Yeni Materyal Üret
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="text-center space-y-2 px-8">
                  <div className="text-4xl">📋</div>
                  <p className="text-sm font-medium text-zinc-500">Henüz materyal üretilmedi</p>
                  <p className="text-xs text-zinc-400">
                    Sol taraftan parametreleri seçip &quot;Ev Ödevi Üret&quot; butonuna bas.
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
