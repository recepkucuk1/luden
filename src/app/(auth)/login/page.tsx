"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { AnimatedAuthPanel } from "@/components/auth/AnimatedAuthPanel";

type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "RATE_LIMIT"
  | "EMAIL_NOT_VERIFIED"
  | "SUSPENDED"
  | "UNKNOWN";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const verifiedSuccess = searchParams.get("verified") === "1";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorCode, setErrorCode] = useState<LoginErrorCode | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorCode(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const code = (result.code ?? "").toUpperCase();
      if (code === "RATE_LIMIT" || code === "EMAIL_NOT_VERIFIED" || code === "SUSPENDED" || code === "INVALID_CREDENTIALS") {
        setErrorCode(code);
      } else {
        setErrorCode("UNKNOWN");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <AnimatedAuthPanel
        showPassword={showPassword}
        passwordLength={password.length}
        heading="Tekrar hoş geldin"
        subheading="Öğrencilerine ait çalışmalara ve raporlara bir adım uzaktasın."
      />

      {/* Right Login Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white text-zinc-900">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.svg" alt="Luden" width={200} height={72} className="h-14 w-auto mx-auto" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Giriş Yap</h1>
            <p className="mt-1 text-sm text-zinc-500">Hesabınla devam et</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ad@klinik.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
                <Link href="/forgot-password" className="text-xs text-zinc-400 hover:text-[#FE703A] transition-colors">
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {verifiedSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                Email adresiniz doğrulandı. Giriş yapabilirsiniz.
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
              </div>
            )}

            {errorCode === "INVALID_CREDENTIALS" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                Email veya şifre hatalı.
              </div>
            )}

            {errorCode === "RATE_LIMIT" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                Çok fazla başarısız deneme. Lütfen 15 dakika sonra tekrar deneyin.
              </div>
            )}

            {errorCode === "EMAIL_NOT_VERIFIED" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                Email adresiniz henüz doğrulanmamış.{" "}
                <Link
                  href={`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="font-medium underline underline-offset-2 hover:text-amber-900"
                >
                  Doğrulama linkini tekrar gönder
                </Link>
              </div>
            )}

            {errorCode === "SUSPENDED" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                Hesabınız askıya alınmış. Destek ekibiyle iletişime geçin.
              </div>
            )}

            {errorCode === "UNKNOWN" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                Bir hata oluştu. Lütfen tekrar deneyin.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-[#023435] hover:bg-[#023435]/90 text-white"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-zinc-500 mt-6">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-medium text-[#FE703A] hover:underline">
              Kayıt ol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
