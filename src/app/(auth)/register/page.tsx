"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

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

    if (!captchaToken) {
      setError("Lütfen CAPTCHA doğrulamasını tamamlayın.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, captchaToken }),
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Kayıt sırasında hata oluştu.");
      setLoading(false);
      return;
    }

    setSuccessEmail(email);
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Emailinizi kontrol edin</h2>
          <p className="text-sm text-zinc-500 mb-1">
            Doğrulama linki şu adrese gönderildi:
          </p>
          <p className="text-sm font-semibold text-zinc-700 mb-6">{successEmail}</p>
          <p className="text-xs text-zinc-400 mb-6">
            Linke tıklayarak hesabınızı aktifleştirin. Email gelmezse spam klasörünü kontrol edin.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Giriş Sayfasına Git
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel — masaüstü */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between bg-[#023435] p-12">
        <Image src="/logo.svg" alt="Luden" width={120} height={44} className="h-9 w-auto brightness-0 invert" />
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
            <Image src="/logo.svg" alt="Luden" width={120} height={44} className="h-8 w-auto mx-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Hesap Oluştur</h1>
            <p className="mt-1 text-sm text-zinc-500">Luden&apos;a ücretsiz kaydol</p>
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

            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "10000000-ffff-ffff-ffff-000000000001"}
              onVerify={setCaptchaToken}
              ref={captchaRef}
              theme="light"
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || !captchaToken} className="w-full h-10">
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
