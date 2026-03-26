import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { buildCardPrompt } from "@/lib/prompts";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { cardGenerateBodySchema, zodError } from "@/lib/validation";
import { checkCredits, deductCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(
      `cards:generate:${session.user.id}`,
      2
    );
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = cardGenerateBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const { category, difficulty, ageGroup, focusArea, studentId, curriculumGoalIds = [] } = parsed.data;

    // ── Kredi ön kontrolü (hızlı, non-atomic) ──
    const creditCheck = await checkCredits(session.user.id, "card_generate");
    if (!creditCheck.ok) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut krediniz: ${creditCheck.credits}. Kart oluşturmak için ${CREDIT_COSTS.card_generate} kredi gereklidir.` },
        { status: 403 }
      );
    }

    // ── IDOR kontrolü: öğrenci bu terapiste ait mi? ──
    if (studentId) {
      const studentOwner = await prisma.student.findFirst({
        where: { id: studentId, therapistId: session.user.id },
        select: { id: true },
      });
      if (!studentOwner) {
        return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 403 });
      }
    }

    // Seçilen tüm müfredat hedeflerini DB'den al ve prompt metnini oluştur
    let curriculumGoalText: string | undefined;
    if (curriculumGoalIds.length > 0) {
      const goals = await prisma.curriculumGoal.findMany({
        where: { id: { in: curriculumGoalIds } },
        include: { curriculum: { select: { code: true, title: true } } },
      });
      if (goals.length > 0) {
        const lines = goals.map(
          (g: { code: string; title: string; curriculum: { title: string } }) =>
            `- ${g.code}: ${g.title} (${g.curriculum.title})`
        );
        curriculumGoalText = lines.join("\n");
      }
    }

    const prompt = buildCardPrompt({ category, difficulty, ageGroup, focusArea, curriculumGoalText });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      throw new Error(`Beklenmeyen içerik tipi: ${rawContent.type}`);
    }

    if (message.stop_reason === "max_tokens") {
      console.error("Claude yanıtı token limitinde kesildi.");
      throw new Error("Yanıt çok uzun, token limiti aşıldı. Lütfen tekrar deneyin.");
    }

    const jsonMatch =
      rawContent.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      rawContent.text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error("Claude yanıtı (JSON bulunamadı):\n", rawContent.text);
      throw new Error("Claude yanıtından JSON çıkarılamadı");
    }

    let cardContent: Record<string, unknown>;
    try {
      cardContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse hatası. Ham JSON:\n", jsonMatch[1] ?? jsonMatch[0]);
      throw parseErr;
    }

    const card = { ...cardContent, category, difficulty, ageGroup };

    // ── Kart kaydet + Krediyi atomik düş (AI başarılıysa) ──
    const dbCard = await prisma.$transaction(async (tx) => {
      const therapist = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!therapist || therapist.credits < CREDIT_COSTS.card_generate) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      const created = await tx.card.create({
        data: {
          title: (cardContent.title as string) ?? "Öğrenme Kartı",
          content: cardContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          category,
          difficulty,
          ageGroup,
          therapistId: session.user.id,
          studentId: studentId ?? null,
          curriculumGoalIds: curriculumGoalIds,
        },
      });
      await tx.therapist.update({ where: { id: session.user.id }, data: { credits: { decrement: CREDIT_COSTS.card_generate } } });
      await tx.creditTransaction.create({ data: { therapistId: session.user.id, amount: CREDIT_COSTS.card_generate, type: "SPEND", description: "Öğrenme kartı üretimi" } });
      return created;
    });

    return NextResponse.json({ success: true, card, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi. Kart oluşturulamadı." }, { status: 403 });
    }
    console.error("[/api/cards/generate] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
