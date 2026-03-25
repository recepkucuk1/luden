import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PLAN_DEFAULTS = {
  FREE:       { studentLimit: 2,   pdfEnabled: false },
  PRO:        { studentLimit: 200, pdfEnabled: true  },
  ADVANCED:   { studentLimit: -1,  pdfEnabled: true  },
  ENTERPRISE: { studentLimit: -1,  pdfEnabled: true  },
} as const;

const schema = z.object({
  planType: z.enum(["FREE", "PRO", "ADVANCED", "ENTERPRISE"]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const t = await prisma.therapist.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return t?.role === "admin" ? session : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });

  const { planType } = parsed.data;
  const defaults = PLAN_DEFAULTS[planType];

  // Plan kaydını bul
  const plan = await prisma.plan.findFirst({ where: { type: planType } });

  const updated = await prisma.therapist.update({
    where: { id },
    data: {
      planType,
      studentLimit: defaults.studentLimit,
      pdfEnabled:   defaults.pdfEnabled,
    },
    select: { id: true, planType: true, studentLimit: true, pdfEnabled: true },
  });

  // Subscription güncelle veya oluştur
  if (plan) {
    const existing = await prisma.subscription.findFirst({
      where: { therapistId: id, status: "ACTIVE" },
    });
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id, status: "ACTIVE", currentPeriodEnd: periodEnd },
      });
    } else {
      await prisma.subscription.create({
        data: {
          therapistId: id,
          planId: plan.id,
          status: "ACTIVE",
          billingCycle: "YEARLY",
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  return NextResponse.json({ user: updated });
}
