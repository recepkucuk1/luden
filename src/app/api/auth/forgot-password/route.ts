import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { allowed, retryAfter } = rateLimit(`forgot-password:${ip}`, 5);
    if (!allowed) return rateLimitResponse(retryAfter);

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    // Her zaman success dön — email var/yok bilgisini sızdırma
    if (!email) return NextResponse.json({ success: true });

    const therapist = await prisma.therapist.findUnique({ where: { email } });
    if (!therapist) return NextResponse.json({ success: true });

    // Varsa eski token'ları sil
    await prisma.passwordResetToken.deleteMany({ where: { userId: therapist.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    await prisma.passwordResetToken.create({
      data: { token: tokenHash, userId: therapist.id, expiresAt },
    });

    const resetUrl = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailErr) {
      console.error("[forgot-password] Email gönderilemedi:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] Beklenmeyen hata:", error);
    return NextResponse.json({ error: "Bir hata oluştu, tekrar deneyin." }, { status: 500 });
  }
}
