import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { registerBodySchema, zodError } from "@/lib/validation";
import { logError } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5);
    if (!allowed) return rateLimitResponse(retryAfter);

    const body = await request.json();

    // hCaptcha doğrulaması (development ortamında atlanır)
    if (process.env.NODE_ENV !== "development") {
      const captchaToken = body.captchaToken as string | undefined;
      if (!captchaToken) {
        return NextResponse.json({ error: "CAPTCHA doğrulaması gerekli." }, { status: 400 });
      }
      const hcRes = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `response=${captchaToken}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
      });
      const hcData = await hcRes.json();
      if (!hcData.success) {
        return NextResponse.json(
          { error: "CAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin." },
          { status: 400 }
        );
      }
    }

    const parsed = registerBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.therapist.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Bu email adresi zaten kayıtlı." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const plainToken = crypto.randomUUID();
    const emailVerifyToken = crypto.createHash("sha256").update(plainToken).digest("hex");
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

    await prisma.$transaction(async (tx) => {
      const newTherapist = await tx.therapist.create({
        data: {
          name,
          email,
          password: hashed,
          specialty: [],
          emailVerified: false,
          emailVerifyToken,
          emailVerifyExpires,
        },
      });
      await tx.creditTransaction.create({
        data: { therapistId: newTherapist.id, amount: 40, type: "EARN", description: "Kayıt bonusu" },
      });
    });

    // Email gönderimi transaction dışında — başarısız olsa da kayıt geçerli
    try {
      await sendVerificationEmail(email, plainToken);
    } catch (emailErr) {
      logError("POST /api/auth/register — sendVerificationEmail", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("POST /api/auth/register", error);
    return NextResponse.json({ error: "Kayıt sırasında bir hata oluştu." }, { status: 500 });
  }
}
