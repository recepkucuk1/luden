import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { CREDIT_COSTS } from "@/lib/plans";

const SOCIAL_STORY_COST = 20;

const bodySchema = z.object({
  studentId:      z.string().min(1),
  situation:      z.string().min(1).max(200),
  environment:    z.enum(["Okul", "Ev", "Park", "Market", "Hastane", "Rehabilitasyon merkezi"]),
  length:         z.enum(["short", "medium", "long"]),
  visualSupport:  z.boolean(),
});

const LENGTH_LABEL: Record<string, string> = {
  short:  "Kısa (3-5 cümle)",
  medium: "Orta (6-10 cümle)",
  long:   "Uzun (11-15 cümle)",
};

const SYSTEM_PROMPT = `Sen LudenLab platformunun sosyal hikaye üretici aracısın.
Carol Gray'in sosyal hikaye formatını kullanarak Türkçe sosyal hikayeler üretiyorsun.

Hikaye yapısı kuralları:
- Tanımlayıcı cümleler: Durumu nesnel olarak anlatır (çoğunluk bu olmalı)
- Perspektif cümleleri: Diğer kişilerin düşünce ve duygularını yansıtır
- Yönlendirici cümleler: Çocuğun yapabileceği davranışları önerir ('yapmalısın' DEĞİL, 'deneyebilirim' veya 'yapabilirim' kullan)
- Olumlu cümleler: Beklenen olumlu sonuçları belirtir

Genel ilkeler:
- 1. tekil kişi ile yaz (Ben...)
- Yaşa uygun kelime hazinesi kullan
- Olumlu ve destekleyici dil kullan
- İçsel motivasyon odaklı ol (ödül/puan/ceza ÖNERİSİ YAPMA)
- 'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' terminolojisi kullan
- Her cümleyi ayrı satırda ver
- Başlık çocuğun ilgisini çekecek şekilde olsun

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Hikaye başlığı",
  "sentences": [
    {
      "type": "descriptive",
      "text": "Cümle metni",
      "visualPrompt": "Bu sahneyi anlatan görsel açıklama (istenirse)"
    }
  ],
  "expertNotes": "Uzman için uygulama önerileri (ne zaman okunmalı, nasıl pekiştirilmeli)",
  "homeGuidance": "Veli için kısa rehber (evde nasıl kullanılacağı)"
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`social-story:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, situation, environment, length, visualSupport } = parsed.data;

    // Öğrenci bu terapiste ait mi?
    const student = await prisma.student.findFirst({
      where: { id: studentId, therapistId: session.user.id },
      select: { id: true, name: true, birthDate: true, workArea: true, diagnosis: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 403 });
    }

    // Kredi kontrolü
    const therapist = await prisma.therapist.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    if (!therapist || therapist.credits < SOCIAL_STORY_COST) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut: ${therapist?.credits ?? 0}, Gerekli: ${SOCIAL_STORY_COST}` },
        { status: 403 }
      );
    }

    // Yaş hesapla
    let ageText = "";
    if (student.birthDate) {
      const birth = new Date(student.birthDate);
      const now = new Date();
      const years = now.getFullYear() - birth.getFullYear();
      ageText = `${years} yaşında`;
    }

    const userPrompt = `Öğrenci bilgileri:
- Ad: ${student.name}${ageText ? `, ${ageText}` : ""}
- Çalışma alanı: ${student.workArea}
${student.diagnosis ? `- Tanı: ${student.diagnosis}` : ""}

Sosyal hikaye parametreleri:
- Durum: ${situation}
- Ortam: ${environment}
- Hikaye uzunluğu: ${LENGTH_LABEL[length]}
- Görsel destek açıklamaları: ${visualSupport ? "Evet, her cümle için kısa görsel sahne açıklaması ekle" : "Hayır"}

Bu öğrenci için uygun bir sosyal hikaye yaz.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      throw new Error("Beklenmeyen içerik tipi");
    }

    const jsonMatch =
      rawContent.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      rawContent.text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) throw new Error("Claude yanıtından JSON çıkarılamadı");

    let storyContent: Record<string, unknown>;
    try {
      storyContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Filtreleme için metadata'yı content'e ekle
    storyContent.situation   = situation;
    storyContent.environment = environment;
    storyContent.length      = length;

    // Kaydet + kredi düş (atomik)
    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < SOCIAL_STORY_COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title: (storyContent.title as string) ?? "Sosyal Hikaye",
          content: storyContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType: "SOCIAL_STORY",
          category:   "generator",
          difficulty: "medium",
          ageGroup:   "3-6",
          therapistId: session.user.id,
          studentId:   studentId,
        },
      });

      await tx.therapist.update({
        where: { id: session.user.id },
        data: { credits: { decrement: SOCIAL_STORY_COST } },
      });
      await tx.creditTransaction.create({
        data: {
          therapistId: session.user.id,
          amount:      SOCIAL_STORY_COST,
          type:        "SPEND",
          description: "Sosyal hikaye üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, story: storyContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/social-story] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
