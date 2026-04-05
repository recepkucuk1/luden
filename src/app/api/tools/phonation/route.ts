import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, MODEL } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const COST = 15;

const bodySchema = z.object({
  studentId:    z.string().optional(),
  targetSounds: z.array(z.string()).min(1, "En az bir hedef ses seçin"),
  activityType: z.enum(["sound_hunt", "bingo", "snakes_ladders", "word_chain", "sound_maze"]),
  difficulty:   z.enum(["easy", "medium", "hard"]),
  itemCount:    z.number().int().min(8).max(25),
  theme:        z.string().max(100).optional(),
});

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  sound_hunt:     "Ses Avı",
  bingo:          "Tombala",
  snakes_ladders: "Yılan Merdiven",
  word_chain:     "Kelime Zinciri",
  sound_maze:     "Ses Labirenti",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Kolay", medium: "Orta", hard: "Zor",
};

const SYSTEM_PROMPT = `Sen LudenLab platformunun sesletim aktivitesi üretici aracısın.
Konuşma sesi çalışmaları için oyunlaştırılmış, yazdırılabilir aktiviteler üretiyorsun.

Aktivite türlerine göre kurallar:

SES AVI (sound_hunt):
- Bir sahne/ortam tanımla (örn: 'Çiftlik', 'Mutfak', 'Park')
- O sahnedeki nesneleri listele (hedef sesi içerenler + içermeyenler karışık)
- Çocuk hedef sesli olanları bulacak
- objects dizisini doldur, scene alanını yaz
- grid alanını BOŞ bırak

TOMBALA (bingo):
- itemCount'a göre grid boyutunu belirle: 9→3x3, 16→4x4, 25→5x5
- Tüm kelimeler hedef sesi içermeli
- grid alanını doldur (rows, cols, cells), her hücrede word ver
- scene, objects, wordChain BOŞ bırak

YILAN MERDİVEN (snakes_ladders):
- itemCount kadar kare, her karede hedef sesli bir kelime
- Bazı karelere isLadder:true (kelimeyi doğru söylersen yukarı), isSnake:true (yeniden dene) ekle
- grid alanını doldur (rows=itemCount/5, cols=5)
- scene, objects, wordChain BOŞ bırak

KELİME ZİNCİRİ (word_chain):
- Her kelimenin son sesi/hecesiyle başlayan yeni kelime zinciri
- Tüm kelimeler hedef sesi içermeli
- wordChain dizisini doldur
- grid, scene, objects BOŞ bırak

SES LABİRENTİ (sound_maze):
- Grid tabanlı basit labirent
- Doğru yol: hedef sesi içeren kelimeler (hasTargetSound: true)
- Yanlış yollar: hedef sesi içermeyen kelimeler (hasTargetSound: false)
- grid alanını doldur
- scene, objects, wordChain BOŞ bırak

Genel kurallar:
- Yaşa uygun, gerçek Türkçe kelimeler kullan
- Eğlenceli ve motive edici içerik
- 'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' de

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Aktivite başlığı",
  "activityType": "sound_hunt|bingo|snakes_ladders|word_chain|sound_maze",
  "targetSounds": ["/s/"],
  "difficulty": "easy|medium|hard",
  "theme": "tema veya null",
  "grid": {
    "rows": 3,
    "cols": 3,
    "cells": [
      {
        "position": 1,
        "word": "kelime",
        "hasTargetSound": true,
        "isLadder": false,
        "isSnake": false,
        "instruction": null
      }
    ]
  },
  "scene": "Sahne açıklaması veya null",
  "objects": [
    {
      "name": "nesne adı",
      "hasTargetSound": true,
      "description": "kısa görsel açıklama"
    }
  ],
  "wordChain": [
    {
      "order": 1,
      "word": "kelime",
      "connection": "bağlantı açıklaması"
    }
  ],
  "instructions": "Oyun nasıl oynanır",
  "expertNotes": "Uzman önerileri",
  "adaptations": "Kolaylaştırma/zorlaştırma önerileri"
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`phonation:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, targetSounds, activityType, difficulty, itemCount, theme } = parsed.data;

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

    const studentBlock = student
      ? `Öğrenci bilgileri:\n- Ad: ${student.name}${ageText}\n- Çalışma alanı: ${student.workArea}${student.diagnosis ? `\n- Tanı: ${student.diagnosis}` : ""}\n\n`
      : "";

    const userPrompt = `${studentBlock}Parametreler:
- Aktivite türü: ${ACTIVITY_TYPE_LABEL[activityType]}
- Hedef ses(ler): ${targetSounds.join(", ")}
- Zorluk: ${DIFFICULTY_LABEL[difficulty]}
- Öğe sayısı: ${itemCount}
- Tema: ${theme || "Karışık (tema yok)"}

Bu parametrelere uygun sesletim aktivitesi üret.`;

    const message = await anthropic.messages.create({
      model: MODEL,
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

    let activityContent: Record<string, unknown>;
    try {
      activityContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Metadata for filtering
    activityContent.activityType  = activityType;
    activityContent.targetSounds  = targetSounds;
    activityContent.difficulty    = difficulty;
    activityContent.theme         = theme ?? "";

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (activityContent.title as string) ?? "Sesletim Aktivitesi",
          content:     activityContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "PHONATION_ACTIVITY",
          category:    "activity",
          difficulty,
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
          description: "Sesletim aktivitesi üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, activity: activityContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/phonation] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
