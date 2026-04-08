"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { AnimatedAuthPanel } from "@/components/auth/AnimatedAuthPanel";
import { PasswordStrengthBar } from "@/components/auth/PasswordStrengthBar";

type TokenStatus = "checking" | "valid" | "invalid" | "expired";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");

  // Sayfa açılır açılmaz token'ı doğrula
  useEffect(() => {
    fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenStatus("valid");
        } else if (data.reason === "expired") {
          setTokenStatus("expired");
        } else {
          setTokenStatus("invalid");
        }
      })
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const passwordsMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;
  const passwordsMatch =
    passwordConfirm.length > 0 && password.length > 0 && password === passwordConfirm;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setError("Bağlantı hatası, tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const isAnyPasswordVisible =
    (password.length > 0 && showPassword) ||
    (passwordConfirm.length > 0 && showPasswordConfirm);
  const combinedPasswordLength =
    password.length > 0 ? password.length : passwordConfirm.length;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <AnimatedAuthPanel
        showPassword={isAnyPasswordVisible}
        passwordLength={combinedPasswordLength}
        heading="Yeni şifre, yeni başlangıç"
        subheading="Hesabına tekrar güvenli erişim için güçlü bir şifre belirle."
      />

      {/* Right Content Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white text-zinc-900">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.svg" alt="LudenLab" width={200} height={72} className="h-14 w-auto mx-auto" />
          </div>

          {/* Token checking */}
          {tokenStatus === "checking" && (
            <div className="text-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Link doğrulanıyor…</p>
            </div>
          )}

          {/* Token invalid/expired */}
          {(tokenStatus === "invalid" || tokenStatus === "expired") && (
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                <X className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">
                {tokenStatus === "expired" ? "Linkin süresi dolmuş" : "Link geçersiz"}
              </h1>
              <p className="text-sm text-zinc-500 mb-6">
                {tokenStatus === "expired"
                  ? "Güvenlik nedeniyle sıfırlama linkleri 30 dakika sonra geçersiz olur."
                  : "Bu link kullanılmış veya hiç oluşturulmamış olabilir."}
              </p>
              <Link
                href="/forgot-password"
                className="inline-block rounded-xl bg-[#FE703A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
              >
                Yeni Link Talep Et
              </Link>
              <p className="mt-6 text-center text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-zinc-400 hover:text-zinc-600">
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </div>
          )}

          {/* Token valid — form */}
          {tokenStatus === "valid" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">Yeni Şifre Belirle</h1>
                <p className="mt-1 text-sm text-zinc-500">En az 8 karakter kullanın.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Yeni Şifre</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="En az 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                      disabled={loading}
                      autoComplete="new-password"
                      className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm" className="text-sm font-medium">Şifre Tekrar</Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      autoComplete="new-password"
                      className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPasswordConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <X className="size-3" /> Şifreler eşleşmiyor
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="size-3" /> Şifreler eşleşiyor
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || passwordsMismatch || password.length < 8}
                  className="w-full h-10 bg-[#023435] hover:bg-[#023435]/90 text-white"
                >
                  {loading ? "Güncelleniyor…" : "Şifreyi Güncelle"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-[#FE703A] hover:underline">
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
