import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { emailVerifyToken: token },
      select: { id: true, emailVerified: true, emailVerifyExpires: true },
    });

    if (!therapist) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş doğrulama linki." },
        { status: 400 }
      );
    }

    if (therapist.emailVerified) {
      return NextResponse.json({ success: true });
    }

    if (therapist.emailVerifyExpires && therapist.emailVerifyExpires < new Date()) {
      return NextResponse.json(
        { error: "Doğrulama linkinin süresi dolmuş. Yeni link talep edin." },
        { status: 400 }
      );
    }

    await prisma.therapist.update({
      where: { id: therapist.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email doğrulama hatası:", error);
    return NextResponse.json({ error: "Doğrulama sırasında hata oluştu." }, { status: 500 });
  }
}
