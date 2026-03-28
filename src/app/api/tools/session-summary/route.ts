import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const SESSION_COST = 10;

const GoalEntrySchema = z.object({
  goalId:    z.string(),
  goalTitle: z.string().min(1).max(500),
  accuracy:  z.number().min(0).max(100),
  cueLevel:  z.string().min(1),
});

const bodySchema = z.object({
  studentId:          z.string().min(1),
  sessionDate:        z.string().min(1),
  duration:           z.enum(["20", "30", "40", "45", "60"]),
  sessionType:        z.enum(["individual", "group", "assessment", "parent_meeting"]),
  goals:              z.array(GoalEntrySchema).min(1),
  overallPerformance: z.enum(["above_target", "on_target", "progressing", "needs_support", "not_assessed"]),
  behaviorNotes:      z.string().max(1000).optional(),
  nextSessionNotes:   z.string().max(1000).optional(),
});

const SYSTEM_PROMPT = `Sen LudenLab platformunun oturum özeti üretici aracısın.
Dil-konuşma-işitme uzmanlarının oturum sonrası profesyonel ve yapılandırılmış oturum raporları oluşturmasına yardımcı oluyorsun.

İlkeler:
- Profesyonel ve nesnel dil kullan
- Ölçülebilir veriler vurgula (yüzdeler, ipucu düzeyleri)
- 'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' de
- Olumlu ve yapıcı ton (güçlü yönleri de belirt)
- Gizlilik: veliye iletilecek kısımda sadece genel bilgi, detaylı klinik bilgiyi uzman notunda tut

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Oturum Özeti — [Öğrenci Adı] — [Tarih]",
  "sessionInfo": {
    "date": "Tarih (Türkçe uzun format, ör: 28 Mart 2026)",
    "duration": "Süre (ör: 45 dakika)",
    "type": "Oturum türü",
    "student": "Öğrenci adı ve yaşı"
  },
  "goalPerformance": [
    {
      "goal": "Hedef açıklaması",
      "accuracy": "Yüzde (ör: %75)",
      "cueLevel": "İpucu düzeyi",
      "analysis": "Bu hedefe dair 1-3 cümle analiz ve gözlem",
      "recommendation": "Bu hedef için sonraki adım önerisi"
    }
  ],
  "overallAssessment": "Oturumun genel değerlendirmesi (2-4 cümle)",
  "behaviorNotes": "Davranış ve katılım gözlemleri",
  "nextSessionPlan": "Bir sonraki oturum için plan ve öneriler",
  "parentNote": "Veliye iletilecek kısa anlaşılır özet (teknik terim yok, 3-5 cümle)",
  "expertNotes": "Sadece uzmanın göreceği klinik notlar ve öneriler"
}`;

const SESSION_TYPE_LABEL: Record<string, string> = {
  individual:     "Bireysel Oturum",
  group:          "Grup Oturumu",
  assessment:     "Değerlendirme Oturumu",
  parent_meeting: "Veli Görüşmesi",
};

const PERFORMANCE_LABEL: Record<string, string> = {
  above_target:  "Beklenenin Üstünde",
  on_target:     "Hedefle Uyumlu",
  progressing:   "Gelişim Gösteriyor",
  needs_support: "Ek Destek Gerekiyor",
  not_assessed:  "Değerlendirme Yapılamadı",
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`session-summary:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, sessionDate, duration, sessionType, goals, overallPerformance, behaviorNotes, nextSessionNotes } = parsed.data;

    const student = await prisma.student.findFirst({
      where: { id: studentId, therapistId: session.user.id },
      select: { id: true, name: true, birthDate: true, workArea: true, diagnosis: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 403 });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    if (!therapist || therapist.credits < SESSION_COST) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut: ${therapist?.credits ?? 0}, Gerekli: ${SESSION_COST}` },
        { status: 403 }
      );
    }

    let ageText = "";
    if (student.birthDate) {
      const years = new Date().getFullYear() - new Date(student.birthDate).getFullYear();
      ageText = `, ${years} yaşında`;
    }

    const dateDisplay = new Date(sessionDate).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const goalsText = goals
      .map((g, i) =>
        `${i + 1}. ${g.goalTitle}\n   - Doğruluk: %${g.accuracy}\n   - İpucu düzeyi: ${g.cueLevel}`
      )
      .join("\n");

    const userPrompt = `Öğrenci bilgileri:
- Ad: ${student.name}${ageText}
- Çalışma alanı: ${student.workArea}
${student.diagnosis ? `- Tanı: ${student.diagnosis}` : ""}

Oturum bilgileri:
- Tarih: ${dateDisplay}
- Süre: ${duration} dakika
- Tür: ${SESSION_TYPE_LABEL[sessionType]}
- Genel performans değerlendirmesi: ${PERFORMANCE_LABEL[overallPerformance]}

Çalışılan hedefler ve performans verileri:
${goalsText}
${behaviorNotes ? `\nDavranış ve katılım gözlemi: ${behaviorNotes}` : ""}
${nextSessionNotes ? `\nSonraki oturum için notlar: ${nextSessionNotes}` : ""}

Yukarıdaki verilerle kapsamlı ve profesyonel bir oturum özeti oluştur.`;

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

    let summaryContent: Record<string, unknown>;
    try {
      summaryContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Metadata for filtering
    summaryContent.sessionType        = sessionType;
    summaryContent.overallPerformance = overallPerformance;
    summaryContent.sessionDate        = sessionDate;

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < SESSION_COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (summaryContent.title as string) ?? `Oturum Özeti — ${student.name}`,
          content:     summaryContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "SESSION_SUMMARY",
          category:    "organizer",
          difficulty:  "medium",
          ageGroup:    "3-6",
          therapistId: session.user.id,
          studentId,
        },
      });

      await tx.therapist.update({
        where: { id: session.user.id },
        data: { credits: { decrement: SESSION_COST } },
      });
      await tx.creditTransaction.create({
        data: {
          therapistId: session.user.id,
          amount:      SESSION_COST,
          type:        "SPEND",
          description: "Oturum özeti oluşturma",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, summary: summaryContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/session-summary] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
