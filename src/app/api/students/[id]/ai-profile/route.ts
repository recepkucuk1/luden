import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateStudentProfile } from "@/lib/generateProfile";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { id, therapistId: session.user.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    await generateStudentProfile(id);

    const updated = await prisma.student.findUnique({
      where: { id },
      select: { aiProfile: true },
    });

    return NextResponse.json({ aiProfile: updated?.aiProfile });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/students/[id]/ai-profile]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
