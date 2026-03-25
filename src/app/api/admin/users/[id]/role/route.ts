import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const t = await prisma.therapist.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return t?.role === "admin" ? session : null;
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

  const { id } = await params;

  // Admin kendisini düzenleyemez
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz" }, { status: 400 });
  }

  const current = await prisma.therapist.findUnique({ where: { id }, select: { role: true } });
  if (!current) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const newRole = current.role === "admin" ? "user" : "admin";

  const updated = await prisma.therapist.update({
    where: { id },
    data: { role: newRole },
    select: { id: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
