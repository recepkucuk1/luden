import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;

  const [users, planCounts, cardGroups] = await Promise.all([
    prisma.therapist.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        role: true,
        planType: true,
        credits: true,
        studentLimit: true,
        suspended: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { students: true, cards: true, lessons: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { currentPeriodEnd: true, billingCycle: true },
        },
      },
    }),
    prisma.therapist.groupBy({
      by: ["planType"],
      _count: { _all: true },
    }),
    prisma.card.groupBy({
      by: ["therapistId", "toolType"],
      _count: { _all: true },
    })
  ]);

  const mergedUsers = users.map((u) => {
    const stats: Record<string, number> = {};
    cardGroups
      .filter((g) => g.therapistId === u.id)
      .forEach((g) => {
        stats[g.toolType] = g._count._all;
      });
    return { ...u, cardStats: stats };
  });

  return NextResponse.json({ users: mergedUsers, planCounts });
}

export async function DELETE(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;
  const { session } = gate;

  const { allowed, retryAfter } = rateLimit(`admin:users:delete:${session.user.id}`, 5);
  if (!allowed) return rateLimitResponse(retryAfter);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  // Admin kendisini silemez
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
  }

  await prisma.therapist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
