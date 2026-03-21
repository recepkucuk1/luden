import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const card = await prisma.card.findFirst({
      where: { id, therapistId: session.user.id },
      include: {
        student: { select: { id: true, name: true } },
        _count: { select: { assignments: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Kart bulunamadı" }, { status: 404 });
    }

    let curriculumGoals: Array<{
      id: string;
      code: string;
      title: string;
      isMainGoal: boolean;
      curriculum: { code: string; title: string };
    }> = [];
    if (card.curriculumGoalIds.length > 0) {
      curriculumGoals = await prisma.curriculumGoal.findMany({
        where: { id: { in: card.curriculumGoalIds } },
        select: {
          id: true,
          code: true,
          title: true,
          isMainGoal: true,
          curriculum: { select: { code: true, title: true } },
        },
      });
    }

    return NextResponse.json({ card: { ...card, curriculumGoals } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/cards/[id]] HATA:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`cards:delete:${session.user.id}`, 10);
    if (!allowed) return rateLimitResponse(retryAfter);

    const { id } = await params;

    const card = await prisma.card.findFirst({
      where: { id, therapistId: session.user.id },
    });

    if (!card) {
      return NextResponse.json({ error: "Kart bulunamadı" }, { status: 404 });
    }

    await prisma.card.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[DELETE /api/cards/[id]] HATA:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
