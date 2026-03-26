import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  amount: z.number().int().min(1).max(100000),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const t = await prisma.therapist.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return t?.role === "admin" ? session : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz miktar" }, { status: 400 });

    const { amount } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const therapist = await tx.therapist.update({
        where: { id },
        data: { credits: { increment: amount } },
        select: { id: true, credits: true },
      });
      await tx.creditTransaction.create({
        data: { therapistId: id, amount, type: "EARN", description: "Admin tarafından eklendi" },
      });
      return therapist;
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[admin/credits]", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
