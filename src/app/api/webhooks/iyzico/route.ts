import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { grantCredits } from "@/lib/credits";

/**
 * iyzico X-IYZ-SIGNATURE-V3 imza doğrulaması.
 *
 * İmza: HMAC-SHA256(secretKey, merchantId + secretKey + iyziEventType
 *                              + subscriptionReferenceCode + orderReferenceCode
 *                              + customerReferenceCode)
 * Çıktı: HEX (küçük harf)
 * Kaynak: https://docs.iyzico.com/ek-servisler/webhook#abonelik-bildirimleri
 */
function verifyIyzicoSignature(
  headerSig: string | null,
  fields: {
    iyziEventType: string;
    subscriptionReferenceCode: string;
    orderReferenceCode: string;
    customerReferenceCode: string;
  },
): boolean {
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const merchantId = process.env.IYZICO_MERCHANT_ID;

  if (!secretKey || !merchantId) {
    console.error("[iyzico webhook] IYZICO_SECRET_KEY veya IYZICO_MERCHANT_ID eksik");
    return false;
  }
  if (!headerSig) return false;

  const data =
    merchantId +
    secretKey +
    fields.iyziEventType +
    fields.subscriptionReferenceCode +
    fields.orderReferenceCode +
    fields.customerReferenceCode;

  const expected = crypto.createHmac("sha256", secretKey).update(data, "utf8").digest("hex");
  const provided = headerSig.toLowerCase();

  // timingSafeEqual throws on length mismatch — short-circuit safely.
  if (expected.length !== provided.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

/**
 * iyzico Webhook handler
 *
 * Desteklenen eventler:
 * - subscription.order.success
 * - subscription.order.failure
 * - subscription.cancelled
 * - subscription.expired
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const {
      iyziEventType,
      iyziReferenceCode, // Bu webhook event delivery'nin benzersiz ID'si
      subscriptionReferenceCode,
    } = event;

    if (!iyziEventType || !iyziReferenceCode || !subscriptionReferenceCode) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // 1. İmza doğrulama — payload alanlarından türetilir, ayrı secret gerekmez
    const sig = req.headers.get("x-iyz-signature-v3");
    if (
      !verifyIyzicoSignature(sig, {
        iyziEventType,
        subscriptionReferenceCode,
        orderReferenceCode: event.orderReferenceCode ?? "",
        customerReferenceCode: event.customerReferenceCode ?? "",
      })
    ) {
      console.warn("[iyzico webhook] Geçersiz imza");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Idempotency — aynı event iki kez işlenmesin
    const existingDelivery = await prisma.webhookDelivery.findUnique({
      where: {
        provider_externalId: {
          provider: "iyzico",
          externalId: iyziReferenceCode,
        },
      },
    });

    if (existingDelivery) {
      console.log(`[iyzico webhook] Event ${iyziReferenceCode} already processed.`);
      return NextResponse.json({ ok: true, message: "Already processed" });
    }

    // 3. DB'deki subscription kaydını bul
    const subscription = await prisma.subscription.findUnique({
      where: { iyzicoSubscriptionRef: subscriptionReferenceCode },
      include: {
        plan: true,
        therapist: true,
      },
    });

    if (!subscription) {
      console.warn(`[iyzico webhook] Sub Ref ${subscriptionReferenceCode} not found in DB`);
      return NextResponse.json({ ok: true, message: "Subscription not tracked in this system" });
    }

    // 4. Olayı işle — WebhookDelivery idempotency çifte işlemeyi engeller
    await prisma.$transaction(async (tx) => {
      // Delivery kaydı — çifte işlemeyi engeller
      await tx.webhookDelivery.create({
        data: {
          provider: "iyzico",
          externalId: iyziReferenceCode,
          payload: event as any,
          status: "processed",
          processedAt: new Date(),
        },
      });

      if (iyziEventType === "subscription.order.success") {
        const newPeriodEnd = new Date(
          Date.now() + (subscription.billingCycle === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000,
        );

        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: newPeriodEnd,
          },
        });

        // Kredi grant'ı yalnızca webhook'ta yapılır (ilk ödeme + yenilemeler).
        // Bu WebhookDelivery idempotency'si sayesinde iki kez çalışmaz.
        if (subscription.plan.creditAmount > 0) {
          await grantCredits(
            subscription.therapist.id,
            subscription.plan.creditAmount,
            `Abonelik Ödemesi (${subscription.plan.type})`,
            tx,
          );
        }
      } else if (
        iyziEventType === "subscription.order.failure" ||
        iyziEventType === "subscription.unpaid"
      ) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            // Enum'da UNPAID yok; PENDING "yeniden deneme bekleniyor" anlamında kullanılır
            status: "PENDING",
          },
        });

        await tx.therapist.update({
          where: { id: subscription.therapist.id },
          data: {
            planType: "FREE",
            studentLimit: 2,
            pdfEnabled: false,
          },
        });
      } else if (iyziEventType === "subscription.cancelled") {
        // iyzico has confirmed cancellation. With deferred-cancel architecture
        // this typically arrives just after the daily cron has called iyzico
        // cancel. Don't regress an already-EXPIRED row back to CANCELLED.
        if (subscription.status !== "EXPIRED") {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "CANCELLED",
              cancelledAt: subscription.cancelledAt ?? new Date(),
            },
          });
        }
      } else if (iyziEventType === "subscription.expired") {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "EXPIRED",
            cancelledAt: subscription.cancelledAt ?? new Date(),
          },
        });

        await tx.therapist.update({
          where: { id: subscription.therapist.id },
          data: {
            planType: "FREE",
            studentLimit: 2,
            pdfEnabled: false,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[iyzico Webhook Error]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
