import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
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

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Bu link geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama isteği gönderin." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.therapist.update({
      where: { id: resetToken.userId },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ success: true });
}
