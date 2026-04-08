import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { logError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { allowed, retryAfter } = rateLimit(`reset-password:${ip}`, 10);
    if (!allowed) return rateLimitResponse(retryAfter);

    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Şifre en fazla 128 karakter olabilir." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Bu link geçersiz. Lütfen tekrar şifre sıfırlama isteği gönderin." },
        { status: 400 }
      );
    }
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Bu linkin süresi dolmuş. Lütfen yeni bir sıfırlama isteği gönderin." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.therapist.update({
        where: { id: resetToken.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.delete({ where: { token: tokenHash } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[reset-password]", error);
    return NextResponse.json({ error: "Bir hata oluştu, tekrar deneyin." }, { status: 500 });
  }
}
