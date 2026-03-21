import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { registerBodySchema, zodError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5);
    if (!allowed) return rateLimitResponse(retryAfter);

    const parsed = registerBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.therapist.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kayıtlı." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const therapist = await prisma.therapist.create({
      data: { name, email, password: hashed, specialty: [] },
    });

    return NextResponse.json({ id: therapist.id, email: therapist.email });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
