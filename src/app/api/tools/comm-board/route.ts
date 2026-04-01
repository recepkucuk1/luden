import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const COST = 15;

const bodySchema = z.object({
  studentId:      z.string().optional(),
  boardType:      z.enum(["basic_needs", "emotions", "daily_routines", "school", "social", "requests", "custom"]),
  customCategory: z.string().max(100).optional(),
  symbolCount:    z.number().int().refine((v) => [4, 6, 9, 12].includes(v), "Geçersiz sembol sayısı"),
  layout:         z.enum(["grid", "strip"]),
  textMode:       z.enum(["word_only", "word_sentence"]),
  colorCoding:    z.boolean().default(true),
});

const BOARD_TYPE_LABEL: Record<string, string> = {
  basic_needs:    "Temel İhtiyaçlar",
  emotions:       "Duygular",
  daily_routines: "Günlük Rutinler",
  school:         "Okul Aktiviteleri",
  social:         "Sosyal İfadeler",
  requests:       "İstek ve Seçim",
  custom:         "Özel",
};

const SYSTEM_PROMPT = `Sen LudenLab platformunun iletişim panosu üretici aracısın.
Söz öncesi dönemde veya alternatif-destekleyici iletişim (ADİ/AAC) kullanan öğrenciler için
yazdırılabilir görsel iletişim panoları üretiyorsun.

Kurallar:
- Her hücre için bir kelime/ifade ve detaylı görsel açıklama üret
- Görsel açıklama, basit ve net bir sembol/resim tarif etmeli
  (uzman veya veli bu açıklamaya göre sembol/resim yapıştırabilir)
- Kelimeler öğrencinin yaş ve gelişim düzeyine uygun olsun
- Temel iletişim fonksiyonlarını kapsa: istek, ret, selamlama, bilgi
- Fitzgerald renk kodlaması kullanılıyorsa her hücrenin renk kategorisini belirt:
  noun=sarı, verb=yeşil, adjective=mavi, social=pembe, question=turuncu, other=beyaz
- Cümle modu seçildiyse her kelime için kısa model cümle ekle (örn: 'Su' → 'Su istiyorum lütfen')

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Pano başlığı",
  "boardType": "basic_needs|emotions|daily_routines|school|social|requests|custom",
  "layout": "grid|strip",
  "rows": 3,
  "cols": 3,
  "cells": [
    {
      "position": 1,
      "word": "Su",
      "sentence": "Su istiyorum lütfen",
      "category": "noun",
      "fitzgeraldColor": "yellow",
      "visualDescription": "Mavi bir su bardağı, içinde su dalgalanıyor",
      "usage": "Çocuk su istediğinde bu sembole işaret eder veya dokunur"
    }
  ],
  "instructions": "Panonun kullanım talimatları",
  "expertNotes": "Uzman için uygulama önerileri (modelleme, sabretme, genişletme stratejileri)",
  "homeGuidance": "Veli için rehber (panoyu evde nasıl kullanacağı)",
  "adaptations": "Kolaylaştırma (daha az hücre) ve zorlaştırma (cümle düzeyi) önerileri"
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`comm-board:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, boardType, customCategory, symbolCount, layout, textMode, colorCoding } = parsed.data;

    let student: { id: string; name: string; birthDate: Date | null; workArea: string; diagnosis: string | null } | null = null;
    if (studentId) {
      student = await prisma.student.findFirst({
        where: { id: studentId, therapistId: session.user.id },
        select: { id: true, name: true, birthDate: true, workArea: true, diagnosis: true },
      });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    if (!therapist || therapist.credits < COST) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut: ${therapist?.credits ?? 0}, Gerekli: ${COST}` },
        { status: 403 }
      );
    }

    let ageText = "";
    let ageGroup = "7-12";
    if (student?.birthDate) {
      const years = new Date().getFullYear() - new Date(student.birthDate).getFullYear();
      ageText = `, ${years} yaşında`;
      if (years <= 6)       ageGroup = "3-6";
      else if (years <= 12) ageGroup = "7-12";
      else if (years <= 18) ageGroup = "13-18";
      else                  ageGroup = "adult";
    }

    // Compute grid dimensions
    const gridMap: Record<number, { rows: number; cols: number }> = {
      4:  { rows: 2, cols: 2 },
      6:  { rows: 2, cols: 3 },
      9:  { rows: 3, cols: 3 },
      12: { rows: 3, cols: 4 },
    };
    const grid = gridMap[symbolCount] ?? { rows: 3, cols: 3 };

    const studentBlock = student
      ? `Öğrenci bilgileri:\n- Ad: ${student.name}${ageText}\n- Çalışma alanı: ${student.workArea}${student.diagnosis ? `\n- Tanı: ${student.diagnosis}` : ""}\n\n`
      : "";

    const boardLabel = boardType === "custom" && customCategory
      ? `Özel — ${customCategory}`
      : BOARD_TYPE_LABEL[boardType] ?? boardType;

    const userPrompt = `${studentBlock}Parametreler:
- Pano türü: ${boardLabel}
- Sembol sayısı: ${symbolCount} (${grid.rows}×${grid.cols} grid)
- Düzen: ${layout === "grid" ? "Grid" : "Satır (iletişim şeridi)"}
- Metin modu: ${textMode === "word_only" ? "Sadece kelime" : "Kelime + kısa cümle"}
- Fitzgerald renk kodlaması: ${colorCoding ? "Evet" : "Hayır"}

Bu parametrelere uygun iletişim panosu üret. Tam olarak ${symbolCount} hücre oluştur.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") throw new Error("Beklenmeyen içerik tipi");

    const jsonMatch =
      rawContent.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      rawContent.text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error("Claude yanıtından JSON çıkarılamadı");

    let boardContent: Record<string, unknown>;
    try {
      boardContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Persist metadata for filtering
    boardContent.boardType    = boardType;
    boardContent.symbolCount  = symbolCount;
    boardContent.layout       = layout;
    boardContent.textMode     = textMode;
    boardContent.colorCoding  = colorCoding;

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (boardContent.title as string) ?? "İletişim Panosu",
          content:     boardContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "COMMUNICATION_BOARD",
          category:    "activity",
          difficulty:  "easy",
          ageGroup,
          therapistId: session.user.id,
          studentId:   student?.id ?? null,
        },
      });

      await tx.therapist.update({
        where: { id: session.user.id },
        data: { credits: { decrement: COST } },
      });
      await tx.creditTransaction.create({
        data: {
          therapistId: session.user.id,
          amount:      COST,
          type:        "SPEND",
          description: "İletişim panosu üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, board: boardContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/comm-board] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
