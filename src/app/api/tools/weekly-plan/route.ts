import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const COST = 20;

const bodySchema = z.object({
  studentId:       z.string().min(1, "Öğrenci seçin"),
  weekStart:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih girin"),
  sessionsPerWeek: z.number().int().min(2).max(5),
  sessionDuration: z.enum(["20", "30", "40", "45", "60"]),
  focusAreas:      z.array(z.string()).min(1, "En az bir odak alanı seçin"),
  planApproach:    z.enum(["ai", "guided"]),
  extraNote:       z.string().max(500).optional(),
});

const SYSTEM_PROMPT = `Sen LudenLab platformunun haftalık çalışma planı üretici aracısın.
Dil-konuşma-işitme uzmanları için öğrenci bazlı haftalık ders planları oluşturuyorsun.

Plan yapısı:
- Her ders günü için ayrı plan
- Her ders içinde: ısınma aktivitesi, ana çalışma, kapanış
- Müfredat hedefleriyle uyumlu
- Önceki çalışmalara referans ver (bağlam verilmişse)
- Progressive difficulty: hafta ilerledikçe zorluk kademeli artsın
- Çeşitlilik: her gün farklı aktivite türleri kullan

İlkeler:
- İçsel motivasyon odaklı (ödül/puan önerme)
- Yaşa uygun aktiviteler
- 'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' de
- Her aktivite için tahmini süre belirt
- Gerekli materyalleri listele

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Haftalık Plan — [Öğrenci Adı] — [Tarih Aralığı]",
  "weekRange": "28 Mart - 3 Nisan 2026",
  "studentSummary": "Öğrenci hakkında kısa bağlam özeti",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Pazartesi",
      "date": "28 Mart 2026",
      "duration": "45 dakika",
      "focusArea": "Odak alanı",
      "objective": "Bu dersin hedefi",
      "warmup": {
        "activity": "Isınma aktivitesi açıklaması",
        "duration": "5 dakika",
        "materials": ["Gerekli materyal"]
      },
      "mainWork": {
        "activity": "Ana çalışma açıklaması",
        "duration": "30 dakika",
        "steps": ["Adım 1", "Adım 2"],
        "materials": ["Gerekli materyal"],
        "targetGoals": ["İlgili müfredat hedefi"]
      },
      "closing": {
        "activity": "Kapanış aktivitesi",
        "duration": "10 dakika"
      },
      "notes": "Ders için özel notlar veya null"
    }
  ],
  "weeklyGoal": "Bu haftanın genel hedefi",
  "materialsNeeded": ["Hafta boyunca gerekli tüm materyaller"],
  "parentCommunication": "Veliye bu hafta hakkında iletilecek bilgi",
  "expertNotes": "Uzman için haftalık değerlendirme notları",
  "nextWeekSuggestion": "Gelecek hafta için ön öneri"
}`;

function getWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

function getDayDates(weekStart: string, count: number): { name: string; date: string }[] {
  const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    result.push({
      name: DAY_NAMES[i] ?? `Gün ${i + 1}`,
      date: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    });
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`weekly-plan:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, weekStart, sessionsPerWeek, sessionDuration, focusAreas, planApproach, extraNote } = parsed.data;

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

    // Fetch student + last 5 cards + last session summary
    const student = await prisma.student.findFirst({
      where: { id: studentId, therapistId: session.user.id },
      select: { id: true, name: true, birthDate: true, workArea: true, diagnosis: true, curriculumIds: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    // Last 5 cards
    const recentCards = await prisma.card.findMany({
      where: { studentId: student.id, therapistId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, toolType: true, createdAt: true },
    });

    // Last session summary
    const lastSummary = await prisma.card.findFirst({
      where: { studentId: student.id, therapistId: session.user.id, toolType: "SESSION_SUMMARY" },
      orderBy: { createdAt: "desc" },
      select: { content: true, createdAt: true },
    });

    // Curriculum titles for assigned IDs
    let curriculumTitles: string[] = [];
    if (student.curriculumIds.length > 0) {
      const curricula = await prisma.curriculum.findMany({
        where: { id: { in: student.curriculumIds } },
        select: { title: true },
      });
      curriculumTitles = curricula.map((c) => c.title);
    }

    let ageText = "";
    let ageGroup = "7-12";
    if (student.birthDate) {
      const years = new Date().getFullYear() - new Date(student.birthDate).getFullYear();
      ageText = `${years} yaşında, `;
      if (years <= 6)       ageGroup = "3-6";
      else if (years <= 12) ageGroup = "7-12";
      else if (years <= 18) ageGroup = "13-18";
      else                  ageGroup = "adult";
    }

    const weekRange = getWeekRange(weekStart);
    const dayDates  = getDayDates(weekStart, sessionsPerWeek);

    const recentCardsBlock = recentCards.length > 0
      ? `Son çalışmalar:\n${recentCards.map((c) => `- ${c.title} (${c.toolType ?? "kart"}, ${new Date(c.createdAt).toLocaleDateString("tr-TR")})`).join("\n")}\n\n`
      : "";

    const lastSummaryBlock = (() => {
      if (!lastSummary?.content) return "";
      const c = lastSummary.content as Record<string, unknown>;
      const parts = [
        c.overallPerformance ? `Genel performans: ${c.overallPerformance}` : "",
        c.sessionNotes       ? `Notlar: ${c.sessionNotes}` : "",
        c.nextSessionGoals   ? `Sonraki hedefler: ${c.nextSessionGoals}` : "",
      ].filter(Boolean);
      if (parts.length === 0) return "";
      return `Son oturum özeti (${new Date(lastSummary.createdAt).toLocaleDateString("tr-TR")}):\n${parts.join("\n")}\n\n`;
    })();

    const userPrompt = `Öğrenci bilgileri:
- Ad: ${student.name}
- ${ageText}Çalışma alanı: ${student.workArea}${student.diagnosis ? `\n- Tanı: ${student.diagnosis}` : ""}
${curriculumTitles.length > 0 ? `- Atanmış müfredat modülleri: ${curriculumTitles.join(", ")}` : ""}

${recentCardsBlock}${lastSummaryBlock}Haftalık plan parametreleri:
- Hafta: ${weekRange}
- Ders günleri ve tarihleri: ${dayDates.map((d) => `${d.name} ${d.date}`).join(", ")}
- Ders süresi: ${sessionDuration} dakika
- Odak alanları: ${focusAreas.join(", ")}
- Planlama yaklaşımı: ${planApproach === "ai" ? "Öğrenci profiline ve geçmişe göre AI otomatik önersin" : "Seçilen odak alanlarına göre yönlendirilmiş plan"}
${extraNote ? `\nEk notlar: ${extraNote}` : ""}

Bu parametrelere uygun haftalık çalışma planı oluştur. Tam olarak ${sessionsPerWeek} ders günü içersin.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") throw new Error("Beklenmeyen içerik tipi");

    const jsonMatch =
      rawContent.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      rawContent.text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error("Claude yanıtından JSON çıkarılamadı");

    let planContent: Record<string, unknown>;
    try {
      planContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Persist metadata
    planContent.weekStart       = weekStart;
    planContent.sessionsPerWeek = sessionsPerWeek;
    planContent.sessionDuration = sessionDuration;
    planContent.focusAreas      = focusAreas;

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (planContent.title as string) ?? `Haftalık Plan — ${student.name}`,
          content:     planContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "WEEKLY_PLAN",
          category:    "organizer",
          difficulty:  "medium",
          ageGroup,
          therapistId: session.user.id,
          studentId:   student.id,
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
          description: "Haftalık çalışma planı üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, plan: planContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/weekly-plan] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
