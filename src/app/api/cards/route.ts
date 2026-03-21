import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const cards = await prisma.card.findMany({
      where: { therapistId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        ageGroup: true,
        createdAt: true,
        curriculumGoalIds: true,
        student: { select: { id: true, name: true } },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    logError("GET /api/cards", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
