import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;

  // Ay başı (UTC) — "bu ay" maliyet aggregate'i için sınır.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [users, planCounts, cardGroups, monthlyUsage] = await Promise.all([
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
    }),
    // Bu ay için therapist başına toplam USD maliyet ve çağrı sayısı.
    // Decimal sum'ı JS number'a çeviriyoruz — tek kart başı maliyet küçük
    // olduğu için floating point kayıpları anlamsız (admin görüntüleme amaçlı).
    prisma.apiUsageLog.groupBy({
      by: ["therapistId"],
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true },
      _count: { _all: true },
    }),
  ]);

  const usageByTherapist = new Map<string, { usd: number; calls: number }>();
  for (const g of monthlyUsage) {
    usageByTherapist.set(g.therapistId, {
      usd: Number(g._sum.costUsd ?? 0),
      calls: g._count._all,
    });
  }

  const mergedUsers = users.map((u) => {
    const stats: Record<string, number> = {};
    cardGroups
      .filter((g) => g.therapistId === u.id)
      .forEach((g) => {
        stats[g.toolType] = g._count._all;
      });
    const usage = usageByTherapist.get(u.id);
    return {
      ...u,
      cardStats: stats,
      monthlyUsageUsd: usage?.usd ?? 0,
      monthlyApiCalls: usage?.calls ?? 0,
    };
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
  const confirm = searchParams.get("confirm");
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }
  if (confirm !== "true") {
    return NextResponse.json(
      { error: "Silme işlemi onay gerektirir (confirm=true)." },
      { status: 400 },
    );
  }

  // Admin kendisini silemez
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
  }

  const target = await prisma.therapist.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, planType: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  // Son admin'in silinmesini engelle — yetkisiz kalmış sistem kilitlenir.
  if (target.role === "admin") {
    const adminCount = await prisma.therapist.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Son admin kullanıcısı silinemez." },
        { status: 400 },
      );
    }
  }

  await prisma.therapist.delete({ where: { id } });

  await recordAudit({
    actorId: session.user.id,
    action: "user.delete",
    targetType: "therapist",
    targetId: id,
    diff: { deleted: target },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ success: true });
}
