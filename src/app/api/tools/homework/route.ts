import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const HOMEWORK_COST = 15;

const bodySchema = z.object({
  studentId:    z.string().min(1),
  targetArea:   z.string().min(1).max(300),
  duration:     z.enum(["10", "15", "20"]),
  parentLevel:  z.enum(["basic", "detailed"]),
  materialType: z.enum(["exercise", "observation", "daily_activity"]),
  extraNote:    z.string().max(500).optional(),
});

const SYSTEM_PROMPT = `Sen LudenLab platformunun ev ödevi materyali üretici aracısın.
Dil-konuşma-işitme uzmanlarının öğrencileri için velilere yönelik ev çalışma materyalleri üretiyorsun.

Temel ilkeler:
- Veli dostu dil kullan (teknik terim kullanma veya kullanırsan parantez içinde açıkla)
- Adım adım, numaralı talimatlar ver
- Her adım kısa ve net olsun
- Süre bilgisine uy (belirtilen dakika içinde tamamlanabilir olsun)
- İçsel motivasyon odaklı ol (ödül/puan/çıkartma sistemi önerme)
- 'hasta' yerine 'öğrenci' veya çocuğun adı, 'terapist' yerine 'uzman' de
- Veliye emir kipi yerine öneri kipi kullan ('yapın' yerine 'yapabilirsiniz')
- Yaşa uygun, eğlenceli ve doğal aktiviteler öner

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Materyal başlığı",
  "materialType": "exercise|observation|daily_activity",
  "duration": "10 dakika",
  "targetArea": "Çalışma alanı",
  "introduction": "Veliye kısa giriş açıklaması (bu çalışma ne için, neden önemli)",
  "materials": ["Gerekli malzemeler listesi (varsa)"],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Adım açıklaması",
      "tip": "Bu adımla ilgili ipucu (opsiyonel)"
    }
  ],
  "watchFor": "Dikkat edin kutusu — veli neye dikkat etmeli, ne gözlemlemeli",
  "celebration": "Kutlama anı — başarıyı nasıl fark edip kutlayacağınız (içsel motivasyon odaklı, dışsal ödül değil)",
  "frequency": "Önerilen tekrar sıklığı (günde 1 kez, haftada 3 kez vb.)",
  "expertNotes": "Uzman için not (bu materyali veliye verirken dikkat edilecekler)",
  "adaptations": "Kolay ve zor versiyonları için kısa öneriler"
}`;

const PARENT_LEVEL_LABEL: Record<string, string> = {
  basic:    "Temel (basit anlatım, teknik terim yok)",
  detailed: "Detaylı (daha fazla açıklama, bazı teknik bilgi)",
};

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  exercise:       "Ev egzersizi (adım adım yapılandırılmış aktivite)",
  observation:    "Gözlem formu (velinin çocuğu gözlemleyip not alacağı form)",
  daily_activity: "Günlük konuşma aktivitesi (günlük rutinlere entegre edilecek aktivite)",
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`homework:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, targetArea, duration, parentLevel, materialType, extraNote } = parsed.data;

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
    if (!therapist || therapist.credits < HOMEWORK_COST) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut: ${therapist?.credits ?? 0}, Gerekli: ${HOMEWORK_COST}` },
        { status: 403 }
      );
    }

    let ageText = "";
    if (student.birthDate) {
      const birth = new Date(student.birthDate);
      const years = new Date().getFullYear() - birth.getFullYear();
      ageText = `${years} yaşında`;
    }

    const userPrompt = `Öğrenci bilgileri:
- Ad: ${student.name}${ageText ? `, ${ageText}` : ""}
- Çalışma alanı: ${student.workArea}
${student.diagnosis ? `- Tanı: ${student.diagnosis}` : ""}

Materyal parametreleri:
- Hedef çalışma alanı: ${targetArea}
- Süre: ${duration} dakika
- Veli bilgi düzeyi: ${PARENT_LEVEL_LABEL[parentLevel]}
- Materyal türü: ${MATERIAL_TYPE_LABEL[materialType]}
${extraNote ? `\nUzman ek notu: ${extraNote}` : ""}

Bu öğrenci için uygun ev ödevi materyali üret.`;

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

    let hwContent: Record<string, unknown>;
    try {
      hwContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Filtreleme metadata
    hwContent.targetArea   = targetArea;
    hwContent.materialType = materialType;
    hwContent.duration     = `${duration} dakika`;

    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < HOMEWORK_COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (hwContent.title as string) ?? "Ev Ödevi Materyali",
          content:     hwContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "HOMEWORK_MATERIAL",
          category:    "generator",
          difficulty:  "medium",
          ageGroup:    "3-6",
          therapistId: session.user.id,
          studentId:   studentId,
        },
      });

      await tx.therapist.update({
        where: { id: session.user.id },
        data: { credits: { decrement: HOMEWORK_COST } },
      });
      await tx.creditTransaction.create({
        data: {
          therapistId: session.user.id,
          amount:      HOMEWORK_COST,
          type:        "SPEND",
          description: "Ev ödevi materyali üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, homework: hwContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/homework] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
