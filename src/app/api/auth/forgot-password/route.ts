import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { allowed, retryAfter } = rateLimit(`forgot-password:${ip}`, 5);
  if (!allowed) return rateLimitResponse(retryAfter);

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

  // Her zaman aynı response — email var/yok bilgisini sızdırma
  const successResponse = NextResponse.json({ success: true });

  if (!email) return successResponse;

  const therapist = await prisma.therapist.findUnique({ where: { email } });
  if (!therapist) return successResponse;

  // Varsa eski token'ları sil
  await prisma.passwordResetToken.deleteMany({ where: { userId: therapist.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

  await prisma.passwordResetToken.create({
    data: { token, userId: therapist.id, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password/${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  return successResponse;
}
