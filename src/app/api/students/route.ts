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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: { therapistId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        cards: { select: { id: true, createdAt: true } },
      },
    });

    return NextResponse.json({
      students: students.map((s) => {
        const sorted = [...s.cards].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
          ...s,
          _count: { cards: s.cards.length },
          latestCardAt: sorted[0]?.createdAt ?? null,
        };
      }),
    });
  } catch (error) {
    logError("GET /api/students", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthDate, workArea, diagnosis, notes } = body;

    if (!name || !workArea) {
      return NextResponse.json(
        { error: "Ad Soyad ve çalışma alanı zorunludur." },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        workArea,
        diagnosis: diagnosis || null,
        notes: notes || null,
        therapistId: session.user.id,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    logError("POST /api/students", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
