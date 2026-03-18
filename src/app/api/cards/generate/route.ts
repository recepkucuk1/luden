import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { buildCardPrompt, CardGenerationParams } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body: CardGenerationParams = await request.json();
    const { category, difficulty, ageGroup } = body;

    if (!category || !difficulty || !ageGroup) {
      return NextResponse.json(
        { error: "category, difficulty ve ageGroup alanları zorunludur." },
        { status: 400 }
      );
    }

    const prompt = buildCardPrompt(body);

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
      console.error("Claude yanıtı token limitinde kesildi. Ham yanıt:\n", rawContent.text);
      throw new Error("Yanıt çok uzun, token limiti aşıldı. Lütfen tekrar deneyin.");
    }

    // Claude bazen ```json ... ``` bloğu içinde döndürür, her iki durumu da yakala
    const jsonMatch = rawContent.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      ?? rawContent.text.match(/(\{[\s\S]*\})/);

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

    return NextResponse.json({
      success: true,
      card: { ...cardContent, category, difficulty, ageGroup },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[/api/cards/generate] HATA:", message);
    if (stack) console.error(stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
