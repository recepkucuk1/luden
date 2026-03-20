import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateStudentProfile } from "@/lib/generateProfile";
import { logError } from "@/lib/utils";

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
        progress: { select: { status: true } },
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
          progressSummary: {
            completed: s.progress.filter((p) => p.status === "completed").length,
            total: s.progress.length,
          },
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
    const { name, birthDate, workArea, diagnosis, notes, curriculumIds } = body;

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
        curriculumIds: Array.isArray(curriculumIds) ? curriculumIds : [],
      },
    });

    // Response gönderildikten sonra profil üret (after = Next.js post-response hook)
    after(async () => {
      try {
        await generateStudentProfile(student.id);
      } catch (err) {
        console.error("[generateStudentProfile] after() hatası:", err);
      }
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    logError("POST /api/students", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
