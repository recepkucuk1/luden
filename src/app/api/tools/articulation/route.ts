import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { anthropic, MODEL } from "@/lib/anthropic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const ARTICULATION_COST = 15;

const bodySchema = z.object({
  studentId:   z.string().min(1),
  targetSounds: z.array(z.string()).min(1, "En az bir hedef ses seçin"),
  positions:   z.array(z.enum(["initial", "medial", "final"])).min(1),
  level:       z.enum(["isolated", "syllable", "word", "sentence", "contextual"]),
  itemCount:   z.number().int().min(5).max(30),
  theme:       z.string().optional(),
});

const LEVEL_LABEL: Record<string, string> = {
  isolated:   "İzole Ses",
  syllable:   "Hece Düzeyi",
  word:       "Kelime Düzeyi",
  sentence:   "Cümle Düzeyi",
  contextual: "Bağlam İçi",
};

const POSITION_LABEL: Record<string, string> = {
  initial: "Başta",
  medial:  "Ortada",
  final:   "Sonda",
};

const SYSTEM_PROMPT = `Sen LudenLab platformunun artikülasyon alıştırma üretici aracısın.
Konuşma sesi bozuklukları için hedef ses bazlı alıştırma materyalleri üretiyorsun.

Kurallar:
- Tüm kelimeler gerçek, yaygın kullanılan Türkçe kelimeler olmalı
- Uydurma veya nadir kelimeler KULLANMA
- Hedef ses belirtilen pozisyonda (başta/ortada/sonda) MUTLAKA bulunmalı
- Kelimeler öğrencinin yaş grubuna uygun olmalı
- Tema seçildiyse kelimeler o temadan olmalı
- Her kelime için hece sayısını belirt
- Hece düzeyinde: hedef sesi içeren hece kombinasyonları üret (açık ve kapalı heceler)
- Kelime düzeyinde: hedef kelimeyi ve hece ayrımını ver
- Cümle düzeyinde: her kelimeyi içeren kısa, doğal bir cümle yaz
- Bağlam düzeyinde: hedef sesi sık içeren 3-4 cümlelik bir paragraf yaz
- İzole ses düzeyinde: sesin farklı uzunluk ve tonlamalarla tekrar önerileri

İçsel motivasyon ilkesi: Ödül/puan/çıkartma sistemi önerme.
'hasta' yerine 'öğrenci', 'terapist' yerine 'uzman' de.

Yanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:
{
  "title": "Alıştırma başlığı",
  "targetSounds": ["/s/"],
  "positions": ["initial"],
  "level": "word",
  "items": [
    {
      "word": "sandal",
      "syllableCount": 2,
      "syllableBreak": "san-dal",
      "position": "initial",
      "targetSound": "/s/",
      "sentence": "Göl kenarında kırmızı bir sandal var.",
      "visualPrompt": "sandal görseli"
    }
  ],
  "expertNotes": "Çalışma önerileri ve dikkat edilecek noktalar",
  "cueTypes": ["Görsel (ayna karşısında)", "Dokunsal (çene altı desteği)", "İşitsel (uzman modeli)"],
  "homeGuidance": "Evde tekrar için veli rehberi"
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`articulation:${session.user.id}`, 2);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { studentId, targetSounds, positions, level, itemCount, theme } = parsed.data;

    // IDOR kontrolü
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
    if (!therapist || therapist.credits < ARTICULATION_COST) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut: ${therapist?.credits ?? 0}, Gerekli: ${ARTICULATION_COST}` },
        { status: 403 }
      );
    }

    // Yaş hesapla
    let ageText = "";
    if (student.birthDate) {
      const birth = new Date(student.birthDate);
      const years = new Date().getFullYear() - birth.getFullYear();
      ageText = `${years} yaşında`;
    }

    const positionLabels = positions.map((p) => POSITION_LABEL[p]).join(", ");
    const userPrompt = `Öğrenci bilgileri:
- Ad: ${student.name}${ageText ? `, ${ageText}` : ""}
- Çalışma alanı: ${student.workArea}
${student.diagnosis ? `- Tanı: ${student.diagnosis}` : ""}

Alıştırma parametreleri:
- Hedef ses(ler): ${targetSounds.join(", ")}
- Ses pozisyonu: ${positionLabels}
- Alıştırma seviyesi: ${LEVEL_LABEL[level]}
- Kelime/öğe sayısı: ${itemCount}
${theme && theme !== "none" ? `- Tema: ${theme}` : "- Tema: Karışık (tema yok)"}

Bu öğrenci için uygun artikülasyon alıştırma materyali üret.`;

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

    let drillContent: Record<string, unknown>;
    try {
      drillContent = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    } catch {
      throw new Error("JSON parse hatası");
    }

    // Filtreleme için tema metadata'sını content'e ekle
    if (theme && theme !== "none") drillContent.theme = theme;

    // Kaydet + kredi düş (atomik)
    const dbCard = await prisma.$transaction(async (tx) => {
      const fresh = await tx.therapist.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
      });
      if (!fresh || fresh.credits < ARTICULATION_COST) throw new Error("INSUFFICIENT_CREDITS");

      const created = await tx.card.create({
        data: {
          title:       (drillContent.title as string) ?? "Artikülasyon Alıştırması",
          content:     drillContent as Parameters<typeof prisma.card.create>[0]["data"]["content"],
          toolType:    "ARTICULATION_DRILL",
          category:    "generator",
          difficulty:  "medium",
          ageGroup:    "3-6",
          therapistId: session.user.id,
          studentId:   studentId,
        },
      });

      await tx.therapist.update({
        where: { id: session.user.id },
        data: { credits: { decrement: ARTICULATION_COST } },
      });
      await tx.creditTransaction.create({
        data: {
          therapistId: session.user.id,
          amount:      ARTICULATION_COST,
          type:        "SPEND",
          description: "Artikülasyon alıştırması üretimi",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, drill: drillContent, cardId: dbCard.id });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Yetersiz kredi." }, { status: 403 });
    }
    console.error("[/api/tools/articulation] HATA:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
