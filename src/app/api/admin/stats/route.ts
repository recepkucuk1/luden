import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const therapist = await prisma.therapist.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (therapist?.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const [totalUsers, totalStudents, totalCards] = await Promise.all([
      prisma.therapist.count(),
      prisma.student.count(),
      prisma.card.count(),
    ]);
    return NextResponse.json({ totalUsers, totalStudents, totalCards });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
