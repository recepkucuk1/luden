"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendSent(false);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    setEmailForResend(email);

    const result = await signIn("credentials", {
      email,
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error === "email_not_verified") {
      setError("email_not_verified");
      setLoading(false);
    } else if (result?.error) {
      setError("Email veya şifre hatalı.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForResend }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel — masaüstü */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between bg-[#023435] p-12">
        <Image src="/logo.svg" alt="Luden" width={120} height={44} className="h-9 w-auto brightness-0 invert" />
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Dil ve Konuşma Uzmanları için AI</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Öğrenci takibi, müfredat planlama ve kişiselleştirilmiş öğrenme kartları — hepsi tek platformda.
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
            <h1 className="text-2xl font-bold text-zinc-900">Giriş Yap</h1>
            <p className="mt-1 text-sm text-zinc-500">Hesabınla devam et</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error === "email_not_verified" ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                <p className="text-sm font-semibold text-amber-800">Email adresinizi doğrulayın</p>
                <p className="text-xs text-amber-600 mt-0.5 mb-2">
                  Giriş yapmadan önce email adresinizi doğrulamanız gerekiyor.
                </p>
                {resendSent ? (
                  <p className="text-xs text-green-600 font-medium">✓ Doğrulama emaili gönderildi!</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-60"
                  >
                    {resendLoading ? "Gönderiliyor…" : "Doğrulama emailini tekrar gönder →"}
                  </button>
                )}
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-medium text-[#FE703A] hover:underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
