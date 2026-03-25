import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const therapist = await prisma.therapist.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (therapist?.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const [users, planCounts] = await Promise.all([
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
        _count: { select: { students: true, cards: true } },
      },
    }),
    prisma.therapist.groupBy({
      by: ["planType"],
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({ users, planCounts });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

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
