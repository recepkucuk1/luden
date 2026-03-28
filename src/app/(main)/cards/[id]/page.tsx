"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CardPreview } from "@/components/cards/CardPreview";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
import { SocialStoryView, type SocialStoryContent } from "@/components/cards/SocialStoryView";
import { ArticulationView, type ArticulationContent } from "@/components/cards/ArticulationView";
import { HomeworkView, type HomeworkContent } from "@/components/cards/HomeworkView";
import type { GeneratedCard } from "@/lib/prompts";
import { cn } from "@/lib/utils";

interface CurriculumGoal {
  id: string;
  code: string;
  title: string;
  isMainGoal: boolean;
  curriculum: { code: string; title: string };
}

interface CardRecord {
  id: string;
  title: string;
  category: string;
  toolType: string | null;
  difficulty: string;
  ageGroup: string;
  content: Record<string, unknown>;
  createdAt: string;
  student: { id: string; name: string } | null;
  _count: { assignments: number };
  curriculumGoals: CurriculumGoal[];
}

const TOOL_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  LEARNING_CARD:      { label: "Öğrenme Kartı",      cls: "bg-[#107996]/10 text-[#107996] border-[#107996]/20" },
  SOCIAL_STORY:       { label: "Sosyal Hikaye",       cls: "bg-[#023435]/10 text-[#023435] border-[#023435]/20" },
  ARTICULATION_DRILL: { label: "Artikülasyon",        cls: "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20" },
  HOMEWORK_MATERIAL:  { label: "Ev Ödevi Materyali",  cls: "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30" },
};

async function downloadSocialStoryPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const content = card.content as unknown as SocialStoryContent;
  const TYPE_COLORS: Record<string, string> = {
    descriptive: "#107996",
    perspective: "#023435",
    directive:   "#FE703A",
    affirmative: "#b45309",
  };
  const TYPE_LABELS: Record<string, string> = {
    descriptive: "Tanımlayıcı",
    perspective: "Perspektif",
    directive:   "Yönlendirici",
    affirmative: "Olumlu",
  };

  const styles = StyleSheet.create({
    page:    { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, backgroundColor: "#fff" },
    title:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 16 },
    row:     { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" },
    badge:   { fontWeight: "bold", fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    text:    { fontSize: 10, lineHeight: 1.6, flex: 1, color: "#3f3f46" },
    visual:  { fontSize: 8, color: "#a1a1aa", fontStyle: "italic", marginTop: 2 },
    section: { marginTop: 14, padding: 10, borderRadius: 6 },
    secTitle:{ fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    secText: { fontSize: 9, lineHeight: 1.6 },
  });

  const Doc = () => (
    <Document title={content.title} author="LudenLab">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{content.title}</Text>
        {(content.sentences ?? []).map((s, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.badge, { backgroundColor: `${TYPE_COLORS[s.type] ?? "#107996"}20`, color: TYPE_COLORS[s.type] ?? "#107996" }]}>
              {TYPE_LABELS[s.type] ?? s.type}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{s.text}</Text>
              {s.visualPrompt && <Text style={styles.visual}>{s.visualPrompt}</Text>}
            </View>
          </View>
        ))}
        {content.expertNotes && (
          <View style={[styles.section, { backgroundColor: "#fffbeb" }]}>
            <Text style={[styles.secTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[styles.secText, { color: "#78350f" }]}>{content.expertNotes}</Text>
          </View>
        )}
        {content.homeGuidance && (
          <View style={[styles.section, { backgroundColor: "#eff6ff" }]}>
            <Text style={[styles.secTitle, { color: "#1e40af" }]}>Veli Rehberi</Text>
            <Text style={[styles.secText, { color: "#1e3a8a" }]}>{content.homeGuidance}</Text>
          </View>
        )}
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${card.title.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadArticulationPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const content = card.content as unknown as ArticulationContent;
  const POSITION_LABEL: Record<string, string> = { initial: "Başta", medial: "Ortada", final: "Sonda" };

  const styles = StyleSheet.create({
    page:   { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, backgroundColor: "#fff" },
    title:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 8 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 16 },
    badge:  { fontWeight: "bold", fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    row:    { flexDirection: "row", gap: 4, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingVertical: 4 },
    cell:   { fontSize: 9, color: "#3f3f46" },
    hdr:    { fontWeight: "bold", fontSize: 8, color: "#71717a" },
    section:{ marginTop: 14, padding: 10, borderRadius: 6 },
    secTitle:{ fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    secText: { fontSize: 9, lineHeight: 1.6 },
  });

  const Doc = () => (
    <Document title={content.title} author="LudenLab">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{content.title}</Text>
        <View style={styles.badges}>
          {(content.targetSounds ?? []).map((s, i) => (
            <Text key={i} style={[styles.badge, { backgroundColor: "#10799620", color: "#107996" }]}>{s}</Text>
          ))}
          {(content.positions ?? []).map((p, i) => (
            <Text key={i} style={[styles.badge, { backgroundColor: "#f4f4f5", color: "#52525b" }]}>{POSITION_LABEL[p] ?? p}</Text>
          ))}
        </View>
        {/* Header row */}
        <View style={[styles.row, { backgroundColor: "#f4f4f5" }]}>
          <Text style={[styles.hdr, { width: 20 }]}>#</Text>
          <Text style={[styles.hdr, { flex: 2 }]}>Kelime</Text>
          <Text style={[styles.hdr, { flex: 2 }]}>Heceler</Text>
          <Text style={[styles.hdr, { flex: 1 }]}>Pozisyon</Text>
        </View>
        {(content.items ?? []).map((item, i) => (
          <View key={i} style={[styles.row, { backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" }]}>
            <Text style={[styles.cell, { width: 20 }]}>{i + 1}</Text>
            <Text style={[styles.cell, { flex: 2, fontWeight: "bold" }]}>{item.word}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{item.syllableBreak ?? "—"}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{POSITION_LABEL[item.position ?? ""] ?? item.position ?? "—"}</Text>
          </View>
        ))}
        {content.expertNotes && (
          <View style={[styles.section, { backgroundColor: "#fffbeb" }]}>
            <Text style={[styles.secTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[styles.secText, { color: "#78350f" }]}>{content.expertNotes}</Text>
          </View>
        )}
        {content.homeGuidance && (
          <View style={[styles.section, { backgroundColor: "#eff6ff" }]}>
            <Text style={[styles.secTitle, { color: "#1e40af" }]}>Veli Rehberi</Text>
            <Text style={[styles.secText, { color: "#1e3a8a" }]}>{content.homeGuidance}</Text>
          </View>
        )}
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${card.title.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadHomeworkPDFFromCard(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const hw = card.content as unknown as HomeworkContent;
  const MTLABEL: Record<string, string> = {
    exercise: "Ev Egzersizi", observation: "Gözlem Formu", daily_activity: "Günlük Aktivite",
  };

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const studentName = card.student?.name;

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 20, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    infoText:  { fontSize: 9, color: "#52525b", marginRight: 16 },
    sectionHdr:{ fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    intro:     { backgroundColor: "#f4f4f5", borderRadius: 4, padding: 10, marginBottom: 14 },
    introText: { fontSize: 10, lineHeight: 1.6, color: "#3f3f46" },
    matItem:   { fontSize: 9, color: "#3f3f46", marginBottom: 3 },
    stepRow:   { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
    stepNum:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#107996", width: 22 },
    stepText:  { flex: 1, fontSize: 10, lineHeight: 1.6, color: "#3f3f46" },
    stepTip:   { fontSize: 8, color: "#a1a1aa", marginTop: 3, paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: "#d4d4d8" },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    freq:      { fontSize: 9, color: "#52525b", marginBottom: 10 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footerTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const steps = Array.isArray(hw.steps)    ? hw.steps    : [];
  const mats  = Array.isArray(hw.materials) ? hw.materials : [];

  const Doc = () => (
    <Document title={hw.title ?? card.title} author="LudenLab">
      <Page size="A4" style={S.page}>

        <Text style={S.title}>{hw.title ?? card.title}</Text>

        <View style={S.infoRow}>
          {studentName ? <Text style={S.infoText}>Öğrenci: {studentName}</Text> : null}
          {hw.duration   ? <Text style={S.infoText}>Süre: {hw.duration}</Text>   : null}
          {hw.targetArea ? <Text style={S.infoText}>{hw.targetArea}</Text>       : null}
          <Text style={[S.infoText, { marginRight: 0 }]}>
            {MTLABEL[hw.materialType] ?? hw.materialType ?? ""}
          </Text>
          <Text style={[S.infoText, { marginLeft: "auto", marginRight: 0 }]}>{today}</Text>
        </View>

        {hw.introduction ? (
          <View style={S.intro}>
            <Text style={S.introText}>{hw.introduction}</Text>
          </View>
        ) : null}

        {mats.length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={S.sectionHdr}>Gerekli Malzemeler</Text>
            {mats.map((m, i) => (
              <Text key={i} style={S.matItem}>• {m}</Text>
            ))}
          </View>
        ) : null}

        {steps.length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={S.sectionHdr}>Adımlar</Text>
            {steps.map((step, i) => (
              <View key={i} style={S.stepRow}>
                <Text style={S.stepNum}>{step.stepNumber ?? i + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={S.stepText}>{step.instruction ?? ""}</Text>
                  {step.tip ? <Text style={S.stepTip}>İpucu: {step.tip}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {hw.watchFor ? (
          <View style={[S.box, { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>⚠ Dikkat Edin</Text>
            <Text style={[S.boxText,  { color: "#78350f" }]}>{hw.watchFor}</Text>
          </View>
        ) : null}

        {hw.celebration ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" }]}>
            <Text style={[S.boxTitle, { color: "#14532d" }]}>★ Kutlama Anı</Text>
            <Text style={[S.boxText,  { color: "#166534" }]}>{hw.celebration}</Text>
          </View>
        ) : null}

        {hw.frequency ? <Text style={S.freq}>Önerilen Sıklık: {hw.frequency}</Text> : null}

        {hw.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText,  { color: "#4b5563" }]}>{hw.adaptations}</Text>
          </View>
        ) : null}

        {/* expertNotes — PDF'e dahil edilmez */}

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
  a.download = `${card.title.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = use(params);
  const router    = useRouter();
  const [card, setCard]               = useState<CardRecord | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);
  const [showAssign, setShowAssign]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/cards/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setCard(data.card);
        setAssignedCount(data.card._count?.assignments ?? 0);
      } catch (err) {
        console.error("Kart yüklenemedi:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDownloadPDF() {
    if (!card) return;
    setDownloading(true);
    const loadingToast = toast.loading("PDF hazırlanıyor…");
    try {
      const tt = card.toolType ?? "LEARNING_CARD";
      if (tt === "SOCIAL_STORY") {
        await downloadSocialStoryPDF(card);
      } else if (tt === "ARTICULATION_DRILL") {
        await downloadArticulationPDF(card);
      } else if (tt === "HOMEWORK_MATERIAL") {
        await downloadHomeworkPDFFromCard(card);
      } else {
        // LEARNING_CARD — mevcut CardPreview PDF'i kullanılır (aşağıda buton var)
        return;
      }
      toast.success("PDF indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] hata:", err);
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-zinc-500">Kart bulunamadı.</p>
        <button onClick={() => router.back()} className="text-sm text-[#FE703A] hover:underline">
          Geri dön
        </button>
      </div>
    );
  }

  const toolType = card.toolType ?? "LEARNING_CARD";
  const ttBadge  = TOOL_TYPE_BADGE[toolType];

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 bg-white px-6 py-2.5">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm">
          {card.student ? (
            <>
              <Link href="/students" className="text-zinc-400 hover:text-zinc-600 transition-colors">Öğrenciler</Link>
              <span className="text-zinc-300">/</span>
              <Link href={`/students/${card.student.id}`} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                {card.student.name}
              </Link>
            </>
          ) : (
            <Link href="/cards" className="text-zinc-400 hover:text-zinc-600 transition-colors">Kütüphane</Link>
          )}
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-700 font-medium truncate max-w-[200px]">{card.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Araç türü badge */}
        {ttBadge && (
          <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4", ttBadge.cls)}>
            {ttBadge.label}
          </span>
        )}

        {/* Müfredat Hedefleri */}
        {card.curriculumGoals.length > 0 && (
          <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-purple-500 text-sm">🎯</span>
              <p className="text-xs font-semibold text-purple-700">
                Müfredat Hedefleri ({card.curriculumGoals.length})
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {card.curriculumGoals.map((goal) => (
                <div key={goal.id} className="flex items-start gap-2">
                  <span className="rounded-full bg-purple-200 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 shrink-0 mt-px">
                    {goal.code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-purple-500 leading-none mb-0.5">
                      {goal.curriculum.code} {goal.curriculum.title}
                    </p>
                    <p className="text-xs text-purple-700 leading-snug">{goal.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── İçerik — toolType'a göre ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {toolType === "SOCIAL_STORY" ? (
            <SocialStoryView story={card.content as unknown as SocialStoryContent} />
          ) : toolType === "ARTICULATION_DRILL" ? (
            <ArticulationView drill={card.content as unknown as ArticulationContent} />
          ) : toolType === "HOMEWORK_MATERIAL" ? (
            <HomeworkView hw={card.content as unknown as HomeworkContent} />
          ) : (
            (() => {
              const raw = card.content;
              const generatedCard: GeneratedCard = {
                title:              typeof raw.title === "string" ? raw.title : card.title,
                objective:          typeof raw.objective === "string" ? raw.objective : "",
                materials:          Array.isArray(raw.materials) ? (raw.materials as string[]) : [],
                instructions:       Array.isArray(raw.instructions) ? (raw.instructions as string[]) : [],
                exercises:          Array.isArray(raw.exercises) ? (raw.exercises as GeneratedCard["exercises"]) : [],
                therapistNotes:     typeof raw.therapistNotes === "string" ? raw.therapistNotes : "",
                progressIndicators: Array.isArray(raw.progressIndicators) ? (raw.progressIndicators as string[]) : [],
                homeExercise:       typeof raw.homeExercise === "string" ? raw.homeExercise : "",
                category:           card.category as GeneratedCard["category"],
                difficulty:         card.difficulty as GeneratedCard["difficulty"],
                ageGroup:           card.ageGroup as GeneratedCard["ageGroup"],
              };
              return <CardPreview card={generatedCard} />;
            })()
          )}
        </div>

        {/* Alt çubuk */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <p className="text-xs text-zinc-400">
            {new Date(card.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {card.student && ` · ${card.student.name}`}
          </p>
          <div className="flex items-center gap-2">
            {/* PDF butonu — LEARNING_CARD CardPreview içinde zaten mevcut; diğerleri için burada göster */}
            {(toolType === "SOCIAL_STORY" || toolType === "ARTICULATION_DRILL" || toolType === "HOMEWORK_MATERIAL") && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
              >
                {downloading ? "Hazırlanıyor…" : "PDF İndir"}
              </button>
            )}
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
            >
              Öğrenciye Ata
              {assignedCount > 0 && (
                <span className="rounded-full bg-[#023435]/10 text-[#023435] px-1.5 py-0.5 text-[10px] font-semibold">
                  {assignedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </main>

      {showAssign && (
        <AssignStudentsModal
          cardId={card.id}
          cardTitle={card.title}
          onClose={() => setShowAssign(false)}
          onSaved={(count) => setAssignedCount(count)}
        />
      )}
    </>
  );
}
