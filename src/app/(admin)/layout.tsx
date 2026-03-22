import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const therapist = await prisma.therapist.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (therapist?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      {children}
    </div>
  );
}
