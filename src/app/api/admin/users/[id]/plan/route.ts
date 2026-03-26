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
  planType:     z.enum(["FREE", "PRO", "ADVANCED", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("YEARLY"),
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

  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

    const { planType, billingCycle } = parsed.data;
    const defaults = PLAN_DEFAULTS[planType];
    const plan = await prisma.plan.findFirst({ where: { type: planType } });

    const updated = await prisma.therapist.update({
      where: { id },
      data: { planType, studentLimit: defaults.studentLimit, pdfEnabled: defaults.pdfEnabled },
      select: { id: true, planType: true, studentLimit: true, pdfEnabled: true },
    });

    if (plan) {
      const periodEnd = new Date();
      if (billingCycle === "YEARLY") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const existing = await prisma.subscription.findFirst({
        where: { therapistId: id, status: "ACTIVE" },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { planId: plan.id, status: "ACTIVE", billingCycle, currentPeriodEnd: periodEnd },
        });
      } else {
        await prisma.subscription.create({
          data: { therapistId: id, planId: plan.id, status: "ACTIVE", billingCycle, currentPeriodEnd: periodEnd },
        });
      }
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[admin/plan]", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
