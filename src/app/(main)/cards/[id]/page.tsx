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
import { CommBoardView, type CommBoardContent } from "@/components/cards/CommBoardView";
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
  PHONATION_ACTIVITY:  { label: "Sesletim Aktivitesi", cls: "bg-green-50 text-green-700 border-green-200" },
  COMMUNICATION_BOARD: { label: "İletişim Panosu",     cls: "bg-[#023435]/10 text-[#023435] border-[#023435]/20" },
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
  Font.registerHyphenationCallback((word) => [word]);

  const activity = card.content as Record<string, unknown>;
  const sounds   = Array.isArray(activity.targetSounds) ? (activity.targetSounds as string[]) : [];
  const today    = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const aType    = activity.activityType as string;

  const ACTIVITY_TYPE_LABEL: Record<string, string> = {
    sound_hunt: "Ses Avı", bingo: "Tombala", snakes_ladders: "Yılan Merdiven",
    word_chain: "Kelime Zinciri", sound_maze: "Ses Labirenti",
  };

  // A4 content width = 595 - 44*2 = 507pt. Row inner padding 8*2 = 16pt → cell area = 491pt.
  const COL_NUM  = 40;
  const COL_TYPE = 145;

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:     { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    tblWrap:   { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
    tHdr:      { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 8 },
    thNum:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: COL_NUM },
    thCell:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    thType:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: COL_TYPE },
    tRow:      { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#f4f4f5", alignItems: "flex-start" },
    tdNum:     { fontSize: 9, color: "#a1a1aa", width: COL_NUM, paddingTop: 1 },
    tdCell:    { fontSize: 9, color: "#18181b", flex: 1 },
    tdType:    { width: COL_TYPE },
    typeBadge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start" },
    typeTxt:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8 },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10, borderWidth: 1 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 3 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt:   { fontSize: 8, color: "#a1a1aa" },
  });

  // Shared table helper
  const Table = ({
    hdrLeft, hdrRight, rows,
  }: {
    hdrLeft: string;
    hdrRight: string;
    rows: { num: number | string; left: string; rightLabel: string; rightBg: string; rightColor: string }[];
  }) => (
    <View style={S.tblWrap}>
      <View style={S.tHdr}>
        <Text style={S.thNum}>#</Text>
        <Text style={S.thCell}>{hdrLeft}</Text>
        <Text style={S.thType}>{hdrRight}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[S.tRow, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
          <Text style={S.tdNum}>{r.num}</Text>
          <Text style={S.tdCell}>{r.left}</Text>
          <View style={S.tdType}>
            <View style={[S.typeBadge, { backgroundColor: r.rightBg }]}>
              <Text style={[S.typeTxt, { color: r.rightColor }]}>{r.rightLabel}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    // ── SES AVI ──────────────────────────────────────────────────────────────
    if (aType === "sound_hunt") {
      const objects = Array.isArray(activity.objects) ? (activity.objects as { name: string; hasTargetSound: boolean }[]) : [];
      const tableRows = objects.map((obj, i) => ({
        num: i + 1,
        left: obj.name,
        rightLabel: obj.hasTargetSound ? "Evet ✓" : "Hayır",
        rightBg:    obj.hasTargetSound ? "#dcfce7" : "#f4f4f5",
        rightColor: obj.hasTargetSound ? "#166534" : "#6b7280",
      }));
      return (
        <View>
          {activity.scene ? (
            <View style={[S.box, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]}>
              <Text style={[S.boxTitle, { color: "#0369a1" }]}>Sahne</Text>
              <Text style={[S.boxText, { color: "#0c4a6e" }]}>{activity.scene as string}</Text>
            </View>
          ) : null}
          <Text style={S.secHdr}>Nesneler ({objects.length})</Text>
          <Table hdrLeft="Nesne" hdrRight="Hedef Ses?" rows={tableRows} />
        </View>
      );
    }

    // ── TOMBALA ──────────────────────────────────────────────────────────────
    if (aType === "bingo") {
      const grid = activity.grid as { rows: number; cols: number; cells: { word: string }[] } | undefined;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      const bingoRows: (typeof cells)[] = [];
      for (let r = 0; r < grid.rows; r++) {
        bingoRows.push(cells.slice(r * grid.cols, (r + 1) * grid.cols));
      }
      const cellW = Math.floor(507 / grid.cols) - 2;
      return (
        <View>
          <Text style={S.secHdr}>Tombala Kartı — {grid.rows}×{grid.cols}</Text>
          {bingoRows.map((rowCells, ri) => (
            <View key={ri} style={{ flexDirection: "row", marginBottom: 2 }}>
              {rowCells.map((cell, ci) => (
                <View
                  key={ci}
                  style={{
                    width: cellW,
                    marginRight: ci < rowCells.length - 1 ? 2 : 0,
                    borderWidth: 2,
                    borderColor: "#f59e0b",
                    borderRadius: 3,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    backgroundColor: "#fffbeb",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, textAlign: "center", color: "#92400e" }}>
                    {cell.word}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // ── YILAN MERDİVEN ───────────────────────────────────────────────────────
    if (aType === "snakes_ladders") {
      const grid = activity.grid as { cells: { position: number; word: string; isLadder?: boolean; isSnake?: boolean }[] } | undefined;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      const total = cells.length;
      const tableRows = cells.map((cell) => {
        const isFinish = cell.position === total;
        if (cell.isLadder) return { num: cell.position, left: cell.word, rightLabel: "↑ Merdiven", rightBg: "#16a34a", rightColor: "#fff" };
        if (cell.isSnake)  return { num: cell.position, left: cell.word, rightLabel: "↓ Yılan",    rightBg: "#dc2626", rightColor: "#fff" };
        if (isFinish)      return { num: cell.position, left: cell.word, rightLabel: "Bitiş",       rightBg: "#f59e0b", rightColor: "#fff" };
        return                    { num: cell.position, left: cell.word, rightLabel: "Normal",      rightBg: "transparent", rightColor: "#a1a1aa" };
      });
      return (
        <View>
          <Text style={S.secHdr}>Oyun Tahtası ({total} kare)</Text>
          <Table hdrLeft="Kelime" hdrRight="Kare Türü" rows={tableRows} />
        </View>
      );
    }

    // ── KELİME ZİNCİRİ ───────────────────────────────────────────────────────
    if (aType === "word_chain") {
      const chain = Array.isArray(activity.wordChain) ? (activity.wordChain as { order: number; word: string; connection?: string }[]) : [];
      const tableRows = chain.map((item) => ({
        num: item.order,
        left: item.word,
        rightLabel: item.connection ?? "",
        rightBg: "transparent",
        rightColor: "#6b7280",
      }));
      return (
        <View>
          <Text style={S.secHdr}>Kelime Zinciri ({chain.length} kelime)</Text>
          <Table hdrLeft="Kelime" hdrRight="Bağlantı" rows={tableRows} />
        </View>
      );
    }

    // ── SES LABİRENTİ ────────────────────────────────────────────────────────
    if (aType === "sound_maze") {
      const grid = activity.grid as { cells: { word: string; hasTargetSound: boolean; position?: number }[] } | undefined;
      if (!grid) return null;
      const cells = Array.isArray(grid.cells) ? grid.cells : [];
      const tableRows = cells.map((cell, i) => ({
        num: i === 0 ? "GİRİŞ" : i === cells.length - 1 ? "ÇIKIŞ" : cell.position ?? i + 1,
        left: cell.word,
        rightLabel: cell.hasTargetSound ? "✓ Doğru Yol" : "✗ Yanlış",
        rightBg:    cell.hasTargetSound ? "#dcfce7" : "#fee2e2",
        rightColor: cell.hasTargetSound ? "#166534" : "#991b1b",
      }));
      return (
        <View>
          <Text style={S.secHdr}>Ses Labirenti ({cells.length} kelime)</Text>
          <Table hdrLeft="Kelime" hdrRight="Doğru Yol?" rows={tableRows} />
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
        {renderContent()}
        {activity.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Nasıl Oynanır</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.instructions as string}</Text>
          </View>
        ) : null}
        {activity.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{activity.adaptations as string}</Text>
          </View>
        ) : null}
        {activity.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
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

async function downloadCommBoardPDF(card: CardRecord, variant: "board" | "report") {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: `${window.location.origin}/fonts/NotoSans-Regular.ttf`, fontWeight: "normal" },
      { src: `${window.location.origin}/fonts/NotoSans-Bold.ttf`,    fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  const board       = card.content as Record<string, unknown>;
  const colorCoding = board.colorCoding !== false;
  const cells       = Array.isArray(board.cells) ? (board.cells as CommBoardContent["cells"]) : [];
  const cols        = (board.cols as number) ?? 3;
  const rows        = (board.rows as number) ?? Math.ceil(cells.length / cols);
  const today       = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const studentName = card.student?.name;

  const FG_BG: Record<string, string> = {
    yellow: "#FEF3C7", green: "#D1FAE5", blue: "#DBEAFE",
    pink: "#FCE7F3",   orange: "#FFEDD5", white: "#F9FAFB",
  };
  const FG_BORDER: Record<string, string> = {
    yellow: "#F59E0B", green: "#10B981", blue: "#3B82F6",
    pink: "#EC4899",   orange: "#F97316", white: "#D4D4D8",
  };
  const FG_TEXT: Record<string, string> = {
    yellow: "#92400E", green: "#065F46", blue: "#1E3A8A",
    pink: "#831843",   orange: "#7C2D12", white: "#3F3F46",
  };

  const BOARD_TYPE_LABEL: Record<string, string> = {
    basic_needs: "Temel İhtiyaçlar", emotions: "Duygular",
    daily_routines: "Günlük Rutinler", school: "Okul Aktiviteleri",
    social: "Sosyal İfadeler", requests: "İstek ve Seçim", custom: "Özel",
  };

  if (variant === "board") {
    // ── Pano PDF — büyük hücre grid, sembol alanı boş ──────────────────────
    const CONTENT_W = 515;
    const GAP = 4;
    const cellW = Math.floor((CONTENT_W - GAP * (cols - 1)) / cols);
    const CONTENT_H = 842 - 80 - 50 - rows * GAP;
    const cellH = Math.floor(CONTENT_H / rows);

    const S = StyleSheet.create({
      page:     { fontFamily: "NotoSans", padding: 40, paddingBottom: 50 },
      title:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 16, color: "#023435", marginBottom: 2 },
      subtitle: { fontSize: 9, color: "#71717a", marginBottom: 12 },
      row:      { flexDirection: "row" },
      cell:     { borderWidth: 2, borderRadius: 6, padding: 6, flexDirection: "column", alignItems: "center" },
      cellWord: { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 12, textAlign: "center", marginBottom: 4 },
      cellBox:  { flex: 1, width: "100%", borderWidth: 1, borderRadius: 4, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
      footer:   { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 5 },
      footTxt:  { fontSize: 7, color: "#a1a1aa" },
    });

    const gridRows: (typeof cells)[] = [];
    for (let r = 0; r < rows; r++) gridRows.push(cells.slice(r * cols, (r + 1) * cols));

    const Doc = () => (
      <Document title={card.title} author="LudenLab">
        <Page size="A4" style={S.page}>
          <Text style={S.title}>{card.title}</Text>
          <Text style={S.subtitle}>
            {studentName ? `Öğrenci: ${studentName} · ` : ""}
            {rows}×{cols} İletişim Panosu · {today}
          </Text>
          {gridRows.map((rowCells, ri) => (
            <View key={ri} style={[S.row, { marginBottom: ri < rows - 1 ? GAP : 0 }]}>
              {rowCells.map((cell, ci) => {
                const color = colorCoding ? (cell.fitzgeraldColor ?? "white") : "white";
                return (
                  <View
                    key={ci}
                    style={[
                      S.cell,
                      {
                        width: cellW, height: cellH,
                        marginRight: ci < rowCells.length - 1 ? GAP : 0,
                        backgroundColor: FG_BG[color] ?? "#F9FAFB",
                        borderColor: FG_BORDER[color] ?? "#D4D4D8",
                        borderStyle: "dashed",
                      },
                    ]}
                  >
                    <Text style={[S.cellWord, { color: FG_TEXT[color] ?? "#3F3F46" }]}>{cell.word}</Text>
                    <View style={[S.cellBox, { borderColor: FG_BORDER[color] ?? "#D4D4D8", borderStyle: "dashed" }]} />
                  </View>
                );
              })}
            </View>
          ))}
          <View style={S.footer} fixed>
            <Text style={S.footTxt}>LudenLab — ludenlab.com</Text>
            <Text style={S.footTxt}>Görsel iletişim panosu — sembol yapıştırın</Text>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(<Doc />).toBlob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${card.title.replace(/\s+/g, "_")}_pano.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // ── Tam Rapor PDF ─────────────────────────────────────────────────────────
  const COLOR_LABEL: Record<string, string> = {
    yellow: "Sarı — İsim", green: "Yeşil — Fiil", blue: "Mavi — Sıfat",
    pink: "Pembe — Sosyal", orange: "Turuncu — Soru", white: "Beyaz — Diğer",
  };

  const S = StyleSheet.create({
    page:      { fontFamily: "NotoSans", fontSize: 10, color: "#18181b", padding: 44, paddingBottom: 70 },
    title:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 18, color: "#023435", marginBottom: 6 },
    infoRow:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 10 },
    badge:     { fontSize: 8, color: "#52525b", backgroundColor: "#f4f4f5", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
    secHdr:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    tblWrap:   { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
    tHdr:      { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 5, paddingHorizontal: 8 },
    thPos:     { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#a1a1aa", width: 28 },
    thWord:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: 80 },
    thDesc:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", flex: 1 },
    thColor:   { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 8, color: "#71717a", width: 70 },
    tRow:      { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#f4f4f5", alignItems: "flex-start" },
    tdPos:     { fontSize: 9, color: "#a1a1aa", width: 28, paddingTop: 1 },
    tdWord:    { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, color: "#18181b", width: 80 },
    tdDesc:    { fontSize: 9, color: "#52525b", flex: 1, lineHeight: 1.5 },
    tdColor:   { width: 70 },
    colorBadge:{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start" },
    colorTxt:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 7 },
    box:       { borderRadius: 4, padding: 10, marginBottom: 10, borderWidth: 1 },
    boxTitle:  { fontFamily: "NotoSans", fontWeight: "bold", fontSize: 9, marginBottom: 3 },
    boxText:   { fontSize: 9, lineHeight: 1.6 },
    footer:    { position: "absolute", bottom: 28, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e4e4e7", paddingTop: 6 },
    footTxt:   { fontSize: 8, color: "#a1a1aa" },
  });

  const Doc = () => (
    <Document title={card.title} author="LudenLab">
      <Page size="A4" style={S.page}>
        <Text style={S.title}>{card.title}</Text>
        <View style={S.infoRow}>
          {studentName ? <Text style={S.badge}>Öğrenci: {studentName}</Text> : null}
          <Text style={S.badge}>{BOARD_TYPE_LABEL[board.boardType as string] ?? (board.boardType as string)}</Text>
          <Text style={S.badge}>{`${rows}×${cols} — ${(board.symbolCount as number | undefined) ?? cells.length} sembol`}</Text>
          <Text style={S.badge}>{board.layout === "grid" ? "Grid" : "Satır"}</Text>
          {colorCoding ? <Text style={S.badge}>Fitzgerald renk kodu</Text> : null}
          <Text style={S.badge}>{today}</Text>
        </View>

        <Text style={S.secHdr}>Semboller ({cells.length} hücre)</Text>
        <View style={S.tblWrap}>
          <View style={S.tHdr}>
            <Text style={S.thPos}>#</Text>
            <Text style={S.thWord}>Kelime</Text>
            <Text style={S.thDesc}>Görsel Açıklama</Text>
            {colorCoding ? <Text style={S.thColor}>Renk</Text> : null}
          </View>
          {cells.map((cell, i) => {
            const color = colorCoding ? (cell.fitzgeraldColor ?? "white") : "white";
            return (
              <View key={i} style={[S.tRow, { backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }]}>
                <Text style={S.tdPos}>{cell.position ?? i + 1}</Text>
                <Text style={S.tdWord}>{cell.word}{cell.sentence ? `\n"${cell.sentence}"` : ""}</Text>
                <Text style={S.tdDesc}>{cell.visualDescription}{cell.usage ? `\n↳ ${cell.usage}` : ""}</Text>
                {colorCoding ? (
                  <View style={S.tdColor}>
                    <View style={[S.colorBadge, { backgroundColor: FG_BG[color] ?? "#F9FAFB" }]}>
                      <Text style={[S.colorTxt, { color: FG_TEXT[color] ?? "#3F3F46" }]}>{COLOR_LABEL[color] ?? color}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {board.instructions ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Kullanım Talimatları</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{board.instructions as string}</Text>
          </View>
        ) : null}
        {board.expertNotes ? (
          <View style={[S.box, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
            <Text style={[S.boxTitle, { color: "#92400e" }]}>Uzman Notları</Text>
            <Text style={[S.boxText, { color: "#78350f" }]}>{board.expertNotes as string}</Text>
          </View>
        ) : null}
        {board.homeGuidance ? (
          <View style={[S.box, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
            <Text style={[S.boxTitle, { color: "#1e40af" }]}>Veli Rehberi</Text>
            <Text style={[S.boxText, { color: "#1e3a8a" }]}>{board.homeGuidance as string}</Text>
          </View>
        ) : null}
        {board.adaptations ? (
          <View style={[S.box, { backgroundColor: "#f9fafb", borderColor: "#e4e4e7" }]}>
            <Text style={[S.boxTitle, { color: "#374151" }]}>Uyarlama Önerileri</Text>
            <Text style={[S.boxText, { color: "#4b5563" }]}>{board.adaptations as string}</Text>
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
  a.download = `${card.title.replace(/\s+/g, "_")}_tam_rapor.pdf`;
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
  const [downloadingBoardPDF, setDownloadingBoardPDF]   = useState(false);
  const [downloadingReportPDF, setDownloadingReportPDF] = useState(false);

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

  async function handleDownloadBoardPDF() {
    if (!card) return;
    setDownloadingBoardPDF(true);
    const loadingToast = toast.loading("Pano PDF hazırlanıyor…");
    try {
      await downloadCommBoardPDF(card, "board");
      toast.success("Pano PDF indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] hata:", err);
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloadingBoardPDF(false);
    }
  }

  async function handleDownloadReportPDF() {
    if (!card) return;
    setDownloadingReportPDF(true);
    const loadingToast = toast.loading("Tam rapor PDF hazırlanıyor…");
    try {
      await downloadCommBoardPDF(card, "report");
      toast.success("Tam rapor PDF indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] hata:", err);
      toast.error("PDF oluşturulamadı", { id: loadingToast });
    } finally {
      setDownloadingReportPDF(false);
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
          ) : toolType === "COMMUNICATION_BOARD" ? (
            <CommBoardView board={card.content as unknown as CommBoardContent} />
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
            {toolType === "COMMUNICATION_BOARD" && (
              <>
                <button
                  onClick={handleDownloadBoardPDF}
                  disabled={downloadingBoardPDF || downloadingReportPDF}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FE703A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE703A]/90 transition-colors disabled:opacity-60"
                >
                  {downloadingBoardPDF ? "Hazırlanıyor…" : "PDF — Pano"}
                </button>
                <button
                  onClick={handleDownloadReportPDF}
                  disabled={downloadingBoardPDF || downloadingReportPDF}
                  className="flex items-center gap-1.5 rounded-lg border border-[#023435]/30 bg-[#023435]/5 px-3 py-1.5 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 transition-colors disabled:opacity-60"
                >
                  {downloadingReportPDF ? "Hazırlanıyor…" : "PDF — Tam Rapor"}
                </button>
              </>
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
