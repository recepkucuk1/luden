import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function logError(tag: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`\n[${tag}] ${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
    const extra = error as unknown as Record<string, unknown>;
    if (extra.code) console.error(`  Prisma code: ${extra.code}`);
    if (extra.meta) console.error(`  Prisma meta:`, extra.meta);
  } else {
    console.error(`\n[${tag}]`, error);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[GET /api/students/[id]] istek alındı");
  try {
    const session = await auth();
    console.log("[GET /api/students/[id]] session:", session?.user?.id ?? "YOK");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[GET /api/students/[id]] id:", id);

    const student = await prisma.patient.findFirst({
      where: { id, therapistId: session.user.id },
      include: {
        cards: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    console.log("[GET /api/students/[id]] öğrenci bulundu:", student.name);
    return NextResponse.json({ student });
  } catch (error) {
    logError("GET /api/students/[id]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[DELETE /api/students/[id]] istek alındı");
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.patient.findFirst({
      where: { id, therapistId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    await prisma.patient.delete({ where: { id } });
    console.log("[DELETE /api/students/[id]] silindi:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("DELETE /api/students/[id]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
