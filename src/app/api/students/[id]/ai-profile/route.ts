import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateStudentProfile } from "@/lib/generateProfile";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { checkCredits, deductCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/plans";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(
      `ai-profile:${session.user.id}`,
      3
    );
    if (!allowed) return rateLimitResponse(retryAfter);

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { id, therapistId: session.user.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    // ── Kredi ön kontrolü (non-atomic) ──
    const creditCheck = await checkCredits(session.user.id, "ai_profile");
    if (!creditCheck.ok) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Mevcut krediniz: ${creditCheck.credits}. AI profil için ${CREDIT_COSTS.ai_profile} kredi gereklidir.` },
        { status: 403 }
      );
    }

    // ── AI çağrısı ──
    await generateStudentProfile(id);

    // ── Kredi düşümü (AI başarılıysa) ──
    const creditResult = await deductCredits(session.user.id, "ai_profile");
    if (!creditResult.ok) {
      // Race condition: AI çalıştı ama kredi düşülemedi — logla, kullanıcıya profili göster
      console.error(`[ai-profile] Kredi düşülemedi (race condition), therapistId=${session.user.id}`);
    }

    const updated = await prisma.student.findUnique({
      where: { id },
      select: { aiProfile: true },
    });

    return NextResponse.json({ aiProfile: updated?.aiProfile });
  } catch (error) {
    console.error("[POST /api/students/[id]/ai-profile]", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
