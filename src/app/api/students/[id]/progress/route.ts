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

    const { id: studentId } = await params;

    const student = await prisma.student.findFirst({
      where: { id: studentId, therapistId: session.user.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    const progress = await prisma.studentProgress.findMany({
      where: { studentId, therapistId: session.user.id },
      select: { goalId: true, status: true, notes: true, updatedAt: true },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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

    const { id: studentId } = await params;

    const student = await prisma.student.findFirst({
      where: { id: studentId, therapistId: session.user.id },
    });
    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const updates: { goalId: string; status: string; notes?: string | null }[] =
      body.updates ?? [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates dizisi boş" }, { status: 400 });
    }

    const therapistId = session.user.id;

    await prisma.$transaction(
      updates.map((u) =>
        prisma.studentProgress.upsert({
          where: { studentId_goalId: { studentId, goalId: u.goalId } },
          create: {
            studentId,
            goalId: u.goalId,
            status: u.status,
            notes: u.notes ?? null,
            therapistId,
          },
          update: {
            status: u.status,
            notes: u.notes ?? null,
          },
        })
      )
    );

    return NextResponse.json({ saved: updates.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
