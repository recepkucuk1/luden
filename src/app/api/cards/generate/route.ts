import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { buildCardPrompt, CardGenerationParams } from "@/lib/prompts";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

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

    const body: CardGenerationParams & { studentId?: string; curriculumGoalIds?: string[] } =
      await request.json();
    const { category, difficulty, ageGroup, studentId, curriculumGoalIds = [] } = body;

    if (!category || !difficulty || !ageGroup) {
      return NextResponse.json(
        { error: "category, difficulty ve ageGroup alanları zorunludur." },
        { status: 400 }
      );
    }

    // Seçilen tüm müfredat hedeflerini DB'den al ve prompt metnini oluştur
    let curriculumGoalText: string | undefined;
    const firstGoalId = curriculumGoalIds[0] ?? null;
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

    const prompt = buildCardPrompt({ ...body, curriculumGoalText });

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

    const dbCard = await prisma.card.create({
      data: {
        title: (cardContent.title as string) ?? "Öğrenme Kartı",
        content: cardContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
        category,
        difficulty,
        ageGroup,
        therapistId: session.user.id,
        studentId: studentId ?? null,
        curriculumGoalId: firstGoalId,
      },
    });

    return NextResponse.json({ success: true, card, cardId: dbCard.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[/api/cards/generate] HATA:", message);
    if (stack) console.error(stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
