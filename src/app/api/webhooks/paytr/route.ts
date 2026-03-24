import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log("[PayTR webhook]", params);

    return new NextResponse("OK");
  } catch (error) {
    console.error("[PayTR webhook] Hata:", error);
    return new NextResponse("FAILED", { status: 500 });
  }
}
