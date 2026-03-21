import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeBadges, toDateStr, calculateStreak, type BadgeStats } from "@/lib/badges";
import { logError } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    const therapistId = session.user.id;

    const [totalStudents, totalCards, completedProgress, workedStudents] = await Promise.all([
      prisma.student.count({ where: { therapistId } }),
      prisma.card.count({ where: { therapistId } }),
      prisma.studentProgress.findMany({
        where: { therapistId, status: "completed" },
        select: { studentId: true, updatedAt: true },
      }),
      prisma.studentProgress.findMany({
        where: { therapistId },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ]);

    const activeDays = new Set(completedProgress.map((p) => toDateStr(p.updatedAt)));
    const currentStreak = calculateStreak(activeDays);

    const stats: BadgeStats = {
      totalStudents,
      totalCompletedGoals: completedProgress.length,
      totalCards,
      currentStreak,
      uniqueStudentsWorked: workedStudents.length,
    };

    return NextResponse.json({ badges: computeBadges(stats), stats });
  } catch (error) {
    logError("GET /api/stats/badges", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
