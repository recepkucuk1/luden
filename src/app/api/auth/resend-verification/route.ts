import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";
import { logError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { allowed, retryAfter } = rateLimit(`resend-verify:${ip}`, 3);
    if (!allowed) return rateLimitResponse(retryAfter);

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email gerekli." }, { status: 400 });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, emailVerified: true },
    });

    // emailVerified ise veya kullanıcı yoksa yine de 200 dön (enumeration önlemi)
    if (!therapist || therapist.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const plainToken = crypto.randomUUID();
    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
    const verifyExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.therapist.update({
      where: { id: therapist.id },
      data: { emailVerifyToken: tokenHash, emailVerifyExpires: verifyExpires },
    });

    await sendVerificationEmail(email, plainToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("POST /api/auth/resend-verification", error);
    return NextResponse.json({ error: "Hata oluştu." }, { status: 500 });
  }
}
