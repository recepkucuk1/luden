"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const passwordConfirm = form.get("passwordConfirm") as string;

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Kayıt sırasında hata oluştu.");
      setLoading(false);
      return;
    }

    // Kayıt başarılı — otomatik giriş yap
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Kayıt başarılı fakat giriş yapılamadı. Lütfen giriş sayfasına gidin.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel — masaüstü */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between bg-[#023435] p-12">
        <Image src="/logo.png" alt="Luden" width={600} height={221} className="h-9 w-auto brightness-0 invert" />
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Uzmanlar için akıllı platform</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            AI destekli öğrenme kartları, ilerleme takibi ve müfredat yönetimi ile daha etkili terapi seansları.
          </p>
          <div className="flex gap-2">
            <div className="h-2 w-12 rounded-full bg-[#F4B2A6]" />
            <div className="h-2 w-6 rounded-full bg-[#FE703A]" />
            <div className="h-2 w-3 rounded-full bg-white/30" />
          </div>
        </div>
        <p className="text-xs text-white/40">© 2025 Luden Vox</p>
      </div>

      {/* Sağ panel */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.png" alt="Luden" width={600} height={221} className="h-8 w-auto mx-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Hesap Oluştur</h1>
            <p className="mt-1 text-sm text-zinc-500">TerapiMat&apos;a ücretsiz kaydol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Ad Soyad</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. Ayşe Yılmaz"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ad@klinik.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="En az 8 karakter"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-sm font-medium">Şifre Tekrar</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-[#FE703A] hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
