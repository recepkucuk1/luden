import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: cardId } = await params;

    const card = await prisma.card.findFirst({
      where: { id: cardId, therapistId: session.user.id },
    });
    if (!card) {
      return NextResponse.json({ error: "Kart bulunamadı" }, { status: 404 });
    }

    const assignments = await prisma.cardAssignment.findMany({
      where: { cardId },
      select: { studentId: true },
    });

    return NextResponse.json({
      assignedStudentIds: assignments.map((a) => a.studentId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/cards/[id]/assignments] HATA:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: cardId } = await params;

    const card = await prisma.card.findFirst({
      where: { id: cardId, therapistId: session.user.id },
    });
    if (!card) {
      return NextResponse.json({ error: "Kart bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const { studentIds } = body as { studentIds: string[] };

    if (!Array.isArray(studentIds)) {
      return NextResponse.json({ error: "studentIds bir dizi olmalıdır" }, { status: 400 });
    }

    // Verify all students belong to this therapist
    if (studentIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds }, therapistId: session.user.id },
        select: { id: true },
      });
      if (students.length !== studentIds.length) {
        return NextResponse.json({ error: "Geçersiz öğrenci ID'si" }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.cardAssignment.deleteMany({ where: { cardId } }),
      prisma.cardAssignment.createMany({
        data: studentIds.map((studentId) => ({ cardId, studentId })),
      }),
    ]);

    return NextResponse.json({ assignedCount: studentIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PUT /api/cards/[id]/assignments] HATA:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
