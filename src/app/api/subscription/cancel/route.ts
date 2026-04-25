import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cancelSubscription } from "@/lib/iyzico";

/**
 * Cancel the current user's active subscription.
 *
 * Period-end cancellation: we tell iyzico to stop recurring billing, set
 * `cancelledAt` and `status = CANCELLED` on the Subscription, but keep the
 * Therapist on their paid plan until `currentPeriodEnd`. The webhook only
 * downgrades to FREE on `subscription.expired`. As a backup, the next
 * /api/profile fetch (or any plan-aware request) can downgrade lazily —
 * see TODO at end of file.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Find the user's most recent ACTIVE subscription.
    const subscription = await prisma.subscription.findFirst({
      where: {
        therapistId: session.user.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Aktif aboneliğiniz bulunamadı." },
        { status: 404 },
      );
    }

    if (!subscription.iyzicoSubscriptionRef) {
      console.error(
        "[cancel] Subscription has no iyzicoSubscriptionRef:",
        subscription.id,
      );
      return NextResponse.json(
        { error: "Abonelik referansı eksik. Destek ile iletişime geçin." },
        { status: 500 },
      );
    }

    // 2. Tell iyzico to stop recurring billing.
    const result = await cancelSubscription(subscription.iyzicoSubscriptionRef);

    if (result.status !== "success") {
      console.error("[cancel] iyzico cancel failed:", result);
      return NextResponse.json(
        {
          error:
            result.errorMessage ?? "iyzico iptali başarısız oldu. Daha sonra tekrar deneyin.",
        },
        { status: 502 },
      );
    }

    // 3. Mark cancelled in DB. DO NOT touch Therapist.planType — user keeps
    //    access until currentPeriodEnd. Webhook (subscription.expired) or a
    //    backup cron downgrades them later.
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      cancelledAt: updated.cancelledAt,
      currentPeriodEnd: updated.currentPeriodEnd,
      message: `Aboneliğiniz iptal edildi. ${updated.currentPeriodEnd.toLocaleDateString(
        "tr-TR",
      )} tarihine kadar PRO özelliklerini kullanmaya devam edebilirsiniz.`,
    });
  } catch (error) {
    console.error("[cancel] error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası. Daha sonra tekrar deneyin." },
      { status: 500 },
    );
  }
}
