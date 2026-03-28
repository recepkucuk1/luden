import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const COST = 15;

const bodySchema = z.object({
  studentId:  z.string().optional(),
  matchType:  z.enum(["definition", "image_desc", "synonym", "antonym", "category", "sentence"]),
  pairCount:  z.enum(["6", "8", "10", "12"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  theme:      z.string().max(100).optional(),
  goalTitle:  z.string().max(300).optional(),
});

const SYSTEM_PROMPT = `Sen LudenLab platformunun kelime eşleştirme oyunu üretici aracısın.
Dil gelişimi alanında kullanılmak üzere yazdırılabilir eşleştirme kartları üretiyorsun.

Kurallar:
- Tüm kelimeler gerçek, yaygın Türkçe kelimeler olsun
- Yaşa ve zorluk seviyesine uygun kelimeler seç
- Kolay: sık kullanılan, somut kelimeler (masa, kedi, elma)
- Orta: daha az sık, bazıları soyut (heyecan, mevsim, mesafe)
- Zor: soyut kavramlar, çok anlamlı kelimeler, deyimler
- Her çift net ve tartışmasız eşleşmeli
- Tema seçildiyse kelimeler o temadan olsun
- Eşleştirme türüne göre:
  - definition (Kelime-Tanım): kısa ve net tanımlar (1 cümle)
  - image_desc (Kelime-Resim Açıklaması): görsel olarak tarif eden kısa açıklama
  - synonym (Eş Anlamlı): gerçek eş anlamlı kelime çiftleri
  - antonym (Zıt Anlamlı): gerçek zıt anlamlı kelime çiftleri
  - category (Kategori): kelime + ait olduğu kategori
  - sentence (Cümle Tamamlama): boşluklu cümle + doğru kelime
- 'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' de

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Oyun başlığı",
  "matchType": "synonym|antonym|definition|image_desc|category|sentence",
  "difficulty": "easy|medium|hard",
  "pairs": [
    {
      "id": 1,
      "cardA": "Kelime veya cümle (sol kart)",
      "cardB": "Eşleşen tanım/kelime/açıklama (sağ kart)",
      "hint": "Opsiyonel ipucu (zor eşleşmeler için, kısa)"
    }
  ],
  "instructions": "Oyun nasıl oynanır (uzman/veli için kısa açıklama)",
  "expertNotes": "Uzman için kullanım önerileri",
  "adaptations": "Kolaylaştırma ve zorlaştırma önerileri"
}`;

const MATCH_TYPE_LABEL: Record<string, string> = {
  definition: "Kelime — Tanım",
  image_desc: "Kelime — Resim Açıklaması",
  synonym:    "Eş Anlamlı",
  antonym:    "Zıt Anlamlı",
  category:   "Kategori Eşleştirme",
  sentence:   "Cümle Tamamlama",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy:   "Kolay",
  medium: "Orta",
  hard:   "Zor",
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`matching-game:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, matchType, pairCount, difficulty, theme, goalTitle } = parsed.data;

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
    if (student?.birthDate) {
      const years = new Date().getFullYear() - new Date(student.birthDate).getFullYear();
      ageText = `, ${years} yaşında`;
    }

    // Derive ageGroup for Card field
    let ageGroup = "7-12";
    if (student?.birthDate) {
      const years = new Date().getFullYear() - new Date(student.birthDate).getFullYear();
      if (years <= 6)       ageGroup = "3-6";
      else if (years <= 12) ageGroup = "7-12";
      else if (years <= 18) ageGroup = "13-18";
      else                  ageGroup = "adult";
    }

    const studentBlock = student
      ? `Öğrenci bilgileri:\n- Ad: ${student.name}${ageText}\n- Çalışma alanı: ${student.workArea}${student.diagnosis ? `\n- Tanı: ${student.diagnosis}` : ""}\n\n`
      : "";

    const userPrompt = `${studentBlock}Parametreler:
- Eşleştirme türü: ${MATCH_TYPE_LABEL[matchType]}
- Çift sayısı: ${pairCount} çift
- Zorluk: ${DIFFICULTY_LABEL[difficulty]}
- Tema: ${theme || "Karışık (tema yok)"}
${goalTitle ? `- Müfredat hedefi: ${goalTitle}` : ""}

Bu parametrelere uygun eşleştirme kartı seti üret.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
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

    let gameContent: Record<string, unknown>;
    try {
      gameContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Metadata for filtering
    gameContent.theme     = theme ?? "";
    gameContent.pairCount = parseInt(pairCount);

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (gameContent.title as string) ?? "Kelime Eşleştirme",
          content:     gameContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "MATCHING_GAME",
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
          description: "Kelime eşleştirme oyunu üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, game: gameContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/matching-game] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
