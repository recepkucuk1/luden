import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/utils";
import { z } from "zod";

const updateSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  date:         z.string().optional(),
  startTime:    z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note:         z.string().nullable().optional(),
  isRecurring:  z.boolean().optional(),
  recurringDay: z.number().int().min(0).max(6).nullable().optional(),
  status:       z.enum(["PLANNED", "COMPLETED", "CANCELLED"]).optional(),
});

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

    const lesson = await prisma.lesson.findFirst({
      where: { id, therapistId: session.user.id },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Ders bulunamadı" }, { status: 404 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 }
      );
    }
    const { date, ...rest } = parsed.data;

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
      },
      include: {
        student: { select: { id: true, name: true, workArea: true } },
      },
    });

    return NextResponse.json({ lesson: updated });
  } catch (error) {
    logError("PUT /api/lessons/[id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
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

    const lesson = await prisma.lesson.findFirst({
      where: { id, therapistId: session.user.id },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Ders bulunamadı" }, { status: 404 });
    }

    await prisma.lesson.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/lessons/[id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
