import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const therapistId = session.user.id;

    const [allCards, recentCardsRaw, recentStudentsRaw, totalStudents] = await Promise.all([
      prisma.card.findMany({
        where: { therapistId },
        select: { category: true },
      }),
      prisma.card.findMany({
        where: { therapistId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          createdAt: true,
          student: { select: { id: true, name: true } },
        },
      }),
      prisma.student.findMany({
        where: { therapistId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { cards: { select: { id: true } } },
      }),
      prisma.student.count({ where: { therapistId } }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const card of allCards) {
      byCategory[card.category] = (byCategory[card.category] ?? 0) + 1;
    }

    const recentStudents = recentStudentsRaw.map((s) => ({
      id: s.id,
      name: s.name,
      workArea: s.workArea,
      createdAt: s.createdAt,
      cardCount: s.cards.length,
    }));

    return NextResponse.json({
      stats: { students: totalStudents, cards: allCards.length, byCategory },
      recentCards: recentCardsRaw,
      recentStudents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/dashboard] HATA:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
