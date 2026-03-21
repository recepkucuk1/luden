import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, specialty: true },
    });

    if (!therapist) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ therapist });
  } catch (error) {
    logError("GET /api/profile", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { name, specialty } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Ad Soyad zorunludur." }, { status: 400 });
    }

    const therapist = await prisma.therapist.update({
      where: { id: session.user.id },
      data: { name: name.trim(), specialty: Array.isArray(specialty) ? specialty : [] },
      select: { id: true, name: true, email: true, specialty: true },
    });

    return NextResponse.json({ therapist });
  } catch (error) {
    logError("PUT /api/profile", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
