import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/utils";

export async function GET(
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
      include: {
        cards: { orderBy: { createdAt: "desc" } },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            card: { select: { id: true, title: true, category: true, difficulty: true, ageGroup: true, createdAt: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    logError("GET /api/students/[id]", error);
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

    const { id } = await params;

    const existing = await prisma.student.findFirst({
      where: { id, therapistId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const { name, birthDate, workArea, diagnosis, notes, curriculumIds } = body;

    if (!name?.trim() || !workArea) {
      return NextResponse.json(
        { error: "Ad Soyad ve çalışma alanı zorunludur." },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        name: name.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        workArea,
        diagnosis: diagnosis || null,
        notes: notes || null,
        curriculumIds: Array.isArray(curriculumIds) ? curriculumIds : undefined,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    logError("PUT /api/students/[id]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/students/[id]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
