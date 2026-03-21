import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logError } from "@/lib/utils";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { allowed, retryAfter } = rateLimit(`profile:password:${session.user.id}`, 3);
    if (!allowed) return rateLimitResponse(retryAfter);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mevcut şifre ve yeni şifre zorunludur." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Yeni şifre en az 8 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: session.user.id },
    });

    if (!therapist) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, therapist.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mevcut şifre yanlış." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.therapist.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("PUT /api/profile/password", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
