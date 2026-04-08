import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { buildCardPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { cardGenerateBodySchema, zodError } from "@/lib/validation";
import { checkCredits, deductCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/plans";
import { requireAuth, requireStudentOwnership } from "@/lib/auth-helpers";
import { extractJson, logError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const gate = await requireAuth();
  if (gate instanceof NextResponse) return gate;
  const { session } = gate;

  const { allowed, retryAfter } = rateLimit(`cards:generate:${session.user.id}`, 2);
  if (!allowed) return rateLimitResponse(retryAfter);

  try {
    const parsed = cardGenerateBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const { category, difficulty, ageGroup, focusArea, studentId, curriculumGoalIds = [] } = parsed.data;

    // Hızlı kredi ön kontrolü — UX için, gerçek kilit transaction içinde.
    const creditCheck = await checkCredits(session.user.id, "card_generate");
    if (!creditCheck.ok) {
      return NextResponse.json(
        {
          error: `Yetersiz kredi. Mevcut krediniz: ${creditCheck.credits}. Kart oluşturmak için ${CREDIT_COSTS.card_generate} kredi gereklidir.`,
        },
        { status: 403 },
      );
    }

    if (studentId) {
      const ownership = await requireStudentOwnership(studentId, session.user.id);
      if (ownership instanceof NextResponse) return ownership;
    }

    // Seçilen tüm müfredat hedeflerini DB'den al ve prompt metnini oluştur
    let curriculumGoalText: string | undefined;
    if (curriculumGoalIds.length > 0) {
      const goals = await prisma.curriculumGoal.findMany({
        where: { id: { in: curriculumGoalIds } },
        include: { curriculum: { select: { code: true, title: true } } },
      });
      if (goals.length > 0) {
        curriculumGoalText = goals
          .map((g) => `- ${g.code}: ${g.title} (${g.curriculum.title})`)
          .join("\n");
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
      throw new Error("Yanıt çok uzun, token limiti aşıldı. Lütfen tekrar deneyin.");
    }

    const cardContent = extractJson(rawContent.text);
    const card = { ...cardContent, category, difficulty, ageGroup };

    // Kart kaydet + krediyi atomik düş — deductCredits'e tx geçiyoruz ki
    // create fail ederse debit de geri alınsın.
    const dbCard = await prisma.$transaction(async (tx) => {
      const deduction = await deductCredits(session.user.id, "card_generate", tx);
      if (!deduction.ok) throw new Error("INSUFFICIENT_CREDITS");

      return tx.card.create({
        data: {
          title: (cardContent.title as string) ?? "Öğrenme Kartı",
          content: cardContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          category,
          difficulty,
          ageGroup,
          therapistId: session.user.id,
          studentId: studentId ?? null,
          curriculumGoalIds,
        },
      });
    });

    return NextResponse.json({ success: true, card, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi. Kart oluşturulamadı." }, { status: 403 });
    }
    logError("POST /api/cards/generate", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
