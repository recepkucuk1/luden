"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src="/logo.svg" alt="LudenLab" width={200} height={72} className="h-16 w-auto mx-auto mb-6" />
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
                autoComplete="new-password"
                className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
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
                autoComplete="new-password"
                className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPasswordConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
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
      </div>
    </div>
  );
}
