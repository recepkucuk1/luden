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
import { SessionSummaryView, type SessionSummaryContent } from "@/components/cards/SessionSummaryView";
import { MatchingGameView, type MatchingGameContent } from "@/components/cards/MatchingGameView";
import { PhonationView, type PhonationActivityContent } from "@/components/cards/PhonationView";
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
  SESSION_SUMMARY:    { label: "Oturum Özeti",        cls: "bg-purple-50 text-purple-700 border-purple-200" },
  MATCHING_GAME:      { label: "Kelime Eşleştirme",   cls: "bg-[#107996]/10 text-[#107996] border-[#107996]/20" },
  PHONATION_ACTIVITY: { label: "Sesletim Aktivitesi", cls: "bg-green-50 text-green-700 border-green-200" },
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

async function downloadSessionSummaryFullPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const summary = card.content as unknown as SessionSummaryContent;
  const goals   = Array.isArray(summary.goalPerformance) ? summary.goalPerformance : [];
  const today   = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  function parseP(acc: string | number): number {
    if (typeof acc === "number") return Math.min(100, Math.max(0, acc));
    const m = String(acc).match(/\d+/);
    return m ? Math.min(100, Math.max(0, parseInt(m[0]))) : 0;
  }
  function barClr(pct: number): string {
    if (pct >= 81) return "#16a34a";
    if (pct >= 61) return "#ca8a04";
    if (pct >= 31) return "#FE703A";
    return "#ef4444";
  }

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    infoBadge: { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    goalCard:  { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, padding: 10, marginBottom: 8 },
    goalTitle: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#18181b", marginBottom: 6 },
    barBg:     { height: 5, backgroundColor: "#f4f4f5", borderRadius: 3, marginBottom: 6 },
    cueBadge:  { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 },
    bodyText:  { fontSize: 9, lineHeight: 1.6, color: "#3f3f46" },
    recRow:    { flexDirection: "row", marginTop: 4 },
    recBullet: { fontSize: 8, color: "#a1a1aa", marginRight: 4, marginTop: 1 },
    recText:   { flex: 1, fontSize: 8, color: "#71717a", lineHeight: 1.5 },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footerTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={summary.title ?? card.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{summary.title ?? card.title}</Text>
        <View style={S.infoRow}>
          {card.student?.name ? <Text style={S.infoBadge}>Öğrenci: {card.student.name}</Text> : null}
          {summary.sessionInfo?.date     ? <Text style={S.infoBadge}>{summary.sessionInfo.date}</Text> : null}
          {summary.sessionInfo?.duration ? <Text style={S.infoBadge}>{summary.sessionInfo.duration}</Text> : null}
          {summary.sessionInfo?.type     ? <Text style={S.infoBadge}>{summary.sessionInfo.type}</Text> : null}
        </View>
        {goals.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={S.secHdr}>Çalışılan Hedefler</Text>
            {goals.map((g, i) => {
              const pct = parseP(g.accuracy);
              return (
                <View key={i} style={S.goalCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={[S.goalTitle, { flex: 1, marginRight: 8 }]}>{g.goal}</Text>
                    <Text style={{ fontSize: 9, fontFamily: "NotoSans", fontWeight: "bold", color: barClr(pct) }}>{g.accuracy}</Text>
                  </View>
                  <View style={S.barBg}>
                    <View style={{ height: 5, borderRadius: 3, width: `${pct}%`, backgroundColor: barClr(pct) }} />
                  </View>
                  {g.cueLevel ? <Text style={S.cueBadge}>{g.cueLevel}</Text> : null}
                  {g.analysis ? <Text style={S.bodyText}>{g.analysis}</Text> : null}
                  {g.recommendation ? (
                    <View style={S.recRow}>
                      <Text style={S.recBullet}>›</Text>
                      <Text style={S.recText}>{g.recommendation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
        {summary.overallAssessment ? (
          <View style={[S.box, { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" }]}>
            <Text style={[S.boxTitle, { color: "#0369a1" }]}>Genel Değerlendirme</Text>
            <Text style={[S.boxText, { color: "#0c4a6e" }]}>{summary.overallAssessment}</Text>
          </View>
        ) : null}
        {summary.behaviorNotes ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Davranış ve Katılım</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{summary.behaviorNotes}</Text>
          </View>
        ) : null}
        {summary.nextSessionPlan ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderLeftWidth: 3, borderLeftColor: "#16a34a" }]}>
            <Text style={[S.boxTitle, { color: "#15803d" }]}>Sonraki Oturum Planı</Text>
            <Text style={[S.boxText, { color: "#166534" }]}>{summary.nextSessionPlan}</Text>
          </View>
        ) : null}
        {summary.parentNote ? (
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#86efac" }]}>
            <Text style={[S.boxTitle, { color: "#15803d" }]}>Veliye İletilecek Not</Text>
            <Text style={[S.boxText, { color: "#166534" }]}>{summary.parentNote}</Text>
          </View>
        ) : null}
        {summary.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları (Gizli)</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{summary.expertNotes}</Text>
          </View>
        ) : null}
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

async function downloadSessionSummaryParentPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const summary = card.content as unknown as SessionSummaryContent;
  const today   = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const S = StyleSheet.create({
    page:    { fontFamily: "NotoSans", fontSize: 11, color: "#18181b", padding: 56, paddingBottom: 70 },
    header:  { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#023435", paddingBottom: 16 },
    brand:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#023435", marginBottom: 4 },
    h1:      { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 4 },
    sub:     { fontSize: 10, color: "#52525b" },
    body:    { fontSize: 11, lineHeight: 1.8, color: "#27272a" },
    footer:  { position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt: { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title="Veli Notu" author="LudenLab">
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.brand}>LudenLab</Text>
          <Text style={S.h1}>Veli Bilgilendirme Notu</Text>
          <Text style={S.sub}>
            {card.student?.name ? `Öğrenci: ${card.student.name}  ·  ` : ""}
            {summary.sessionInfo?.date ?? today}
          </Text>
        </View>
        <Text style={S.body}>{summary.parentNote ?? ""}</Text>
        <View style={S.footer} fixed>
          <Text style={S.footTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Veli_Notu_${(card.student?.name ?? "ogrenci").replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPhonationPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const activity = card.content as Record<string, unknown>;
  const sounds   = Array.isArray(activity.targetSounds) ? (activity.targetSounds as string[]) : [];
  const today    = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const ACTIVITY_TYPE_LABEL: Record<string, string> = {
    sound_hunt: "Ses Avı", bingo: "Tombala", snakes_ladders: "Yılan Merdiven",
    word_chain: "Kelime Zinciri", sound_maze: "Ses Labirenti",
  };

  const S = StyleSheet.create({
    page:     { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:  { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:    { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    sHdr:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6 },
    gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    gridCell: { width: "18%", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, padding: 6, alignItems: "center", justifyContent: "center", minHeight: 40 },
    gridTxt:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, textAlign: "center" },
    tHdr:     { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
    tHdrNum:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: 24 },
    tHdrCell: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    tRow:     { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
    tNum:     { fontSize: 9, color: "#a1a1aa", width: 24 },
    tCell:    { fontSize: 9, color: "#18181b", flex: 1 },
    chainRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    chainNum: { fontSize: 8, color: "#a1a1aa", width: 18 },
    chainWrd: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 10, color: "#6d28d9" },
    chainCon: { fontSize: 8, color: "#8b5cf6", marginLeft: 8 },
    box:      { borderRadius: 4, padding: 10, marginBottom: 8, marginTop: 10 },
    boxTitle: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 4 },
    boxText:  { fontSize: 9, lineHeight: 1.6 },
    footer:   { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt:  { fontSize: 8, color: "#a1a1aa" },
  });

  const aType = activity.activityType as string;

  const renderBody = () => {
    if (aType === "sound_hunt") {
      const objects = Array.isArray(activity.objects) ? (activity.objects as { name: string; hasTargetSound: boolean }[]) : [];
      return (
        <View>
          {activity.scene ? (
            <View style={[S.box, { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" }]}>
              <Text style={[S.boxTitle, { color: "#0369a1" }]}>Sahne</Text>
              <Text style={[S.boxText, { color: "#0c4a6e" }]}>{activity.scene as string}</Text>
            </View>
          ) : null}
          <Text style={S.sHdr}>Nesneler ({objects.length})</Text>
          <View style={S.gridWrap}>
            {objects.map((o, i) => (
              <View key={i} style={S.gridCell}>
                <Text style={S.gridTxt}>{o.name}</Text>
              </View>
            ))}
          </View>
          <View style={[S.box, { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" }]}>
            <Text style={[S.boxTitle, { color: "#0369a1" }]}>Cevap Anahtarı</Text>
            <Text style={[S.boxText, { color: "#0c4a6e" }]}>{objects.filter((o) => o.hasTargetSound).map((o) => o.name).join(" · ")}</Text>
          </View>
        </View>
      );
    }
    if (aType === "bingo") {
      const grid = activity.grid as { rows: number; cols: number; cells: { word: string }[] } | undefined;
      if (!grid) return null;
      return (
        <View>
          <Text style={S.sHdr}>Tombala Kartı — {grid.rows}×{grid.cols}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
            {grid.cells.map((cell, i) => (
              <View key={i} style={{ width: `${Math.floor(100 / grid.cols) - 1}%`, borderWidth: 2, borderColor: "#f59e0b", borderRadius: 4, padding: 6, alignItems: "center", justifyContent: "center", minHeight: 44, backgroundColor: "#fffbeb" }}>
                <Text style={{ fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, textAlign: "center", color: "#92400e" }}>{cell.word}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    if (aType === "snakes_ladders") {
      const grid = activity.grid as { cells: { position: number; word: string; isLadder?: boolean; isSnake?: boolean }[] } | undefined;
      if (!grid) return null;
      return (
        <View>
          <Text style={S.sHdr}>Oyun Tahtası ({grid.cells.length} kare)</Text>
          <View style={S.tHdr}>
            <Text style={S.tHdrNum}>#</Text>
            <Text style={S.tHdrCell}>Kelime</Text>
            <Text style={[S.tHdrCell, { flex: 0, width: 80 }]}>Tür</Text>
          </View>
          {grid.cells.map((cell, i) => (
            <View key={i} style={[S.tRow, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
              <Text style={S.tNum}>{cell.position}</Text>
              <Text style={S.tCell}>{cell.word}</Text>
              <Text style={[S.tCell, { flex: 0, width: 80, color: cell.isLadder ? "#16a34a" : cell.isSnake ? "#dc2626" : "#a1a1aa" }]}>
                {cell.isLadder ? "↑ Merdiven" : cell.isSnake ? "↓ Yılan" : "Normal"}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    if (aType === "word_chain") {
      const chain = Array.isArray(activity.wordChain) ? (activity.wordChain as { order: number; word: string; connection?: string }[]) : [];
      return (
        <View>
          <Text style={S.sHdr}>Kelime Zinciri ({chain.length} kelime)</Text>
          {chain.map((item, i) => (
            <View key={i} style={S.chainRow}>
              <Text style={S.chainNum}>{item.order}.</Text>
              <Text style={S.chainWrd}>{item.word}</Text>
              {item.connection ? <Text style={S.chainCon}>{item.connection}</Text> : null}
            </View>
          ))}
        </View>
      );
    }
    if (aType === "sound_maze") {
      const grid = activity.grid as { cells: { word: string; hasTargetSound: boolean }[] } | undefined;
      if (!grid) return null;
      const correct = grid.cells.filter((c) => c.hasTargetSound);
      const wrong   = grid.cells.filter((c) => !c.hasTargetSound);
      return (
        <View>
          <Text style={S.sHdr}>Labirent ({grid.cells.length} kelime)</Text>
          <View style={[S.box, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#86efac" }]}>
            <Text style={[S.boxTitle, { color: "#166534" }]}>✓ Doğru Yol</Text>
            <Text style={[S.boxText, { color: "#14532d" }]}>{correct.map((c) => c.word).join(" → ")}</Text>
          </View>
          <View style={[S.box, { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fca5a5" }]}>
            <Text style={[S.boxTitle, { color: "#991b1b" }]}>✗ Yanlış Yollar</Text>
            <Text style={[S.boxText, { color: "#7f1d1d" }]}>{wrong.map((c) => c.word).join(" · ")}</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const Doc = () => (
    <Document title={card.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{card.title}</Text>
        <View style={S.infoRow}>
          {card.student?.name ? <Text style={S.badge}>Öğrenci: {card.student.name}</Text> : null}
          <Text style={S.badge}>{ACTIVITY_TYPE_LABEL[aType] ?? aType}</Text>
          <Text style={S.badge}>{activity.difficulty === "easy" ? "Kolay" : activity.difficulty === "medium" ? "Orta" : "Zor"}</Text>
          {sounds.map((s, i) => <Text key={i} style={S.badge}>{s}</Text>)}
          {activity.theme ? <Text style={S.badge}>{activity.theme as string}</Text> : null}
        </View>
        {renderBody()}
        {activity.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Nasıl Oynanır</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.instructions as string}</Text>
          </View>
        ) : null}
        {activity.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.adaptations as string}</Text>
          </View>
        ) : null}
        {activity.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{activity.expertNotes as string}</Text>
          </View>
        ) : null}
        <View style={S.footer} fixed>
          <Text style={S.footTxt}>LudenLab — ludenlab.com</Text>
          <Text style={S.footTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${card.title.replace(/\s+/g, "_")}_sesletim.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadMatchingGameTablePDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const game = card.content as Record<string, unknown>;
  const pairs = Array.isArray(game.pairs) ? (game.pairs as { id: number; cardA: string; cardB: string; hint?: string }[]) : [];
  const MATCH_TYPE_LABEL: Record<string, string> = {
    definition: "Kelime — Tanım", image_desc: "Kelime — Resim Açıklaması",
    synonym: "Eş Anlamlı", antonym: "Zıt Anlamlı", category: "Kategori Eşleştirme", sentence: "Cümle Tamamlama",
  };

  const S = StyleSheet.create({
    page:     { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44 },
    title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    badges:   { flexDirection: "row", gap: 8, marginBottom: 16 },
    badge:    { fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    tableHdr: { flexDirection: "row", backgroundColor: "#f4f4f5", borderRadius: 4, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4 },
    thNum:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: 24 },
    thA:      { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#52525b", flex: 1 },
    thB:      { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#52525b", flex: 1 },
    row:      { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
    cellNum:  { fontSize: 9, color: "#a1a1aa", width: 24 },
    cellA:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, flex: 1, color: "#18181b" },
    cellB:    { fontSize: 9, flex: 1, color: "#3f3f46" },
    box:      { borderRadius: 4, padding: 10, marginTop: 12 },
    boxTitle: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, marginBottom: 4 },
    boxText:  { fontSize: 9, lineHeight: 1.6 },
  });

  const Doc = () => (
    <Document title={card.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{card.title}</Text>
        <View style={S.badges}>
          <Text style={[S.badge, { backgroundColor: "#107996" + "20", color: "#107996" }]}>
            {MATCH_TYPE_LABEL[game.matchType as string] ?? (game.matchType as string)}
          </Text>
          <Text style={[S.badge, { backgroundColor: "#f4f4f5", color: "#52525b" }]}>
            {game.difficulty === "easy" ? "Kolay" : game.difficulty === "medium" ? "Orta" : "Zor"}
          </Text>
          <Text style={[S.badge, { backgroundColor: "#f4f4f5", color: "#52525b" }]}>{pairs.length} çift</Text>
        </View>
        <View style={S.tableHdr}>
          <Text style={S.thNum}>#</Text>
          <Text style={S.thA}>Kart A</Text>
          <Text style={S.thB}>Kart B</Text>
        </View>
        {pairs.map((pair, i) => (
          <View key={i} style={[S.row, i % 2 === 1 ? { backgroundColor: "#fafafa" } : {}]}>
            <Text style={S.cellNum}>{pair.id ?? i + 1}</Text>
            <Text style={S.cellA}>{pair.cardA}</Text>
            <Text style={S.cellB}>{pair.cardB}{pair.hint ? ` (${pair.hint})` : ""}</Text>
          </View>
        ))}
        {game.instructions ? (
          <View style={[S.box, { backgroundColor: "#f4f4f5" }]}>
            <Text style={S.boxTitle}>Nasıl Oynanır</Text>
            <Text style={S.boxText}>{game.instructions as string}</Text>
          </View>
        ) : null}
        {game.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f4f4f5" }]}>
            <Text style={S.boxTitle}>Uyarlama Önerileri</Text>
            <Text style={S.boxText}>{game.adaptations as string}</Text>
          </View>
        ) : null}
        {game.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{game.expertNotes as string}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${card.title.replace(/\s+/g, "_")}_Tablo.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadMatchingGameCardsPDF(card: CardRecord) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });

  const game  = card.content as Record<string, unknown>;
  const pairs = Array.isArray(game.pairs) ? (game.pairs as { id: number; cardA: string; cardB: string }[]) : [];

  // Interleave: B cards first then A cards, alternating
  const shuffled: { text: string; isA: boolean; pairId: number }[] = [];
  pairs.forEach((p, i) => {
    shuffled.push({ text: p.cardA, isA: true,  pairId: p.id ?? i + 1 });
    shuffled.push({ text: p.cardB, isA: false, pairId: p.id ?? i + 1 });
  });
  // Simple deterministic shuffle: reverse interleave
  const cards2: typeof shuffled = [];
  for (let i = 0; i < shuffled.length; i += 2) cards2.push(shuffled[i + 1]!);
  for (let i = 0; i < shuffled.length; i += 2) cards2.push(shuffled[i]!);

  const S = StyleSheet.create({
    page:     { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 36 },
    title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 14, color: "#023435", marginBottom: 4 },
    sub:      { fontSize: 9, color: "#71717a", marginBottom: 16 },
    grid:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    cardA:    { width: "30%", minHeight: 80, borderWidth: 2, borderStyle: "dashed", borderColor: "#107996", borderRadius: 6, padding: 10, backgroundColor: "#f0f9ff", justifyContent: "center" },
    cardB:    { width: "30%", minHeight: 80, borderWidth: 2, borderStyle: "dashed", borderColor: "#FE703A", borderRadius: 6, padding: 10, backgroundColor: "#fff7ed", justifyContent: "center" },
    cardTxt:  { fontSize: 10, lineHeight: 1.5, color: "#18181b", textAlign: "center" },
    p2title:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 14, color: "#023435", marginBottom: 12 },
    ansRow:   { flexDirection: "row", gap: 6, marginBottom: 4, alignItems: "center" },
    ansNum:   { fontSize: 9, color: "#a1a1aa", width: 20 },
    ansA:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, flex: 1, color: "#18181b" },
    ansArr:   { fontSize: 9, color: "#a1a1aa", width: 14, textAlign: "center" },
    ansB:     { fontSize: 9, flex: 1, color: "#3f3f46" },
  });

  const Doc = () => (
    <Document title={card.title} author="LudenLab">
      {/* Page 1 — shuffled cut cards */}
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{card.title}</Text>
        <Text style={S.sub}>Kartları kesin ve karıştırın. Mavi kenarlı = Kart A · Turuncu kenarlı = Kart B</Text>
        <View style={S.grid}>
          {cards2.map((c, i) => (
            <View key={i} style={c.isA ? S.cardA : S.cardB}>
              <Text style={S.cardTxt}>{c.text}</Text>
            </View>
          ))}
        </View>
      </Page>
      {/* Page 2 — answer key */}
      <Page size="A4" style={S.page}>
        <Text style={S.p2title}>Cevap Anahtarı</Text>
        {pairs.map((pair, i) => (
          <View key={i} style={S.ansRow}>
            <Text style={S.ansNum}>{pair.id ?? i + 1}.</Text>
            <Text style={S.ansA}>{pair.cardA}</Text>
            <Text style={S.ansArr}>→</Text>
            <Text style={S.ansB}>{pair.cardB}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  const blob = await pdf(<Doc />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${card.title.replace(/\s+/g, "_")}_Kartlar.pdf`;
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
  const [downloadingParent, setDownloadingParent] = useState(false);
  const [downloadingCards, setDownloadingCards] = useState(false);

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
      } else if (tt === "SESSION_SUMMARY") {
        await downloadSessionSummaryFullPDF(card);
      } else if (tt === "MATCHING_GAME") {
        await downloadMatchingGameTablePDF(card);
      } else if (tt === "PHONATION_ACTIVITY") {
        await downloadPhonationPDF(card);
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

  async function handleDownloadParentPDF() {
    if (!card) return;
    setDownloadingParent(true);
    const loadingToast = toast.loading("Veli notu hazırlanıyor…");
    try {
      await downloadSessionSummaryParentPDF(card);
      toast.success("Veli notu indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] hata:", err);
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloadingParent(false);
    }
  }

  async function handleDownloadCardsPDF() {
    if (!card) return;
    setDownloadingCards(true);
    const loadingToast = toast.loading("Kesme kartları hazırlanıyor…");
    try {
      await downloadMatchingGameCardsPDF(card);
      toast.success("PDF indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] hata:", err);
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloadingCards(false);
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
          ) : toolType === "SESSION_SUMMARY" ? (
            <SessionSummaryView summary={card.content as unknown as SessionSummaryContent} />
          ) : toolType === "MATCHING_GAME" ? (
            <MatchingGameView game={card.content as unknown as MatchingGameContent} />
          ) : toolType === "PHONATION_ACTIVITY" ? (
            <PhonationView activity={card.content as unknown as PhonationActivityContent} />
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
            {/* PDF butonları */}
            {toolType === "MATCHING_GAME" && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading || downloadingCards}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
                >
                  {downloading ? "Hazırlanıyor…" : "PDF — Tablo"}
                </button>
                <button
                  onClick={handleDownloadCardsPDF}
                  disabled={downloading || downloadingCards}
                  className="flex items-center gap-1.5 rounded-lg border border-[#023435]/30 bg-[#023435]/5 px-3 py-1.5 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 transition-colors disabled:opacity-60"
                >
                  {downloadingCards ? "Hazırlanıyor…" : "PDF — Kesme Kartları"}
                </button>
              </>
            )}
            {(toolType === "SOCIAL_STORY" || toolType === "ARTICULATION_DRILL" || toolType === "HOMEWORK_MATERIAL" || toolType === "PHONATION_ACTIVITY") && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
              >
                {downloading ? "Hazırlanıyor…" : "PDF İndir"}
              </button>
            )}
            {toolType === "SESSION_SUMMARY" && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading || downloadingParent}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
                >
                  {downloading ? "Hazırlanıyor…" : "Tam Rapor PDF"}
                </button>
                <button
                  onClick={handleDownloadParentPDF}
                  disabled={downloading || downloadingParent}
                  className="flex items-center gap-1.5 rounded-lg border border-[#023435]/30 bg-[#023435]/5 px-3 py-1.5 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 transition-colors disabled:opacity-60"
                >
                  {downloadingParent ? "Hazırlanıyor…" : "Veli Notu PDF"}
                </button>
              </>
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
