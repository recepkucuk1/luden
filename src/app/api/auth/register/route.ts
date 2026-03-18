import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "İsim, email ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Şifre en az 8 karakter olmalıdır." },
        { status: 400 }
      );
    }

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
