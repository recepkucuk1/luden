"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Bir hata oluştu.");
      } else {
        setSent(true);
      }
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
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-zinc-900">Şifremi Unuttum</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Email adresinizi girin, sıfırlama linki gönderelim.
              </p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#023435]/10 mx-auto mb-4">
                <svg className="h-7 w-7 text-[#023435]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-900">E-postanızı kontrol edin</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Eğer <strong className="text-zinc-700">{email}</strong> ile kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Email gelmezse spam klasörünü kontrol edin.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ad@klinik.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
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
              {loading ? "Gönderiliyor…" : "Sıfırlama Linki Gönder"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-[#FE703A] hover:underline">
            ← Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
