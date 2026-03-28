import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/utils";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Geçersiz tercihler" }, { status: 400 });
    }

    await prisma.therapist.update({
      where: { id: session.user.id },
      data: { preferences },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("PUT /api/profile/preferences", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
