"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Mail } from "lucide-react";
import { AnimatedAuthPanel } from "@/components/auth/AnimatedAuthPanel";

type Status = "pending" | "loading" | "success" | "error" | "signing-in";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  // Token yoksa pending (inbox kontrol ekranı); token varsa doğrulama başlat
  const [status, setStatus] = useState<Status>(token ? "loading" : "pending");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailFromUrl ?? "");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // URL'den email geldiyse input'u kitle — kayıt sonrası doğru adres
  const emailLocked = Boolean(emailFromUrl);

  async function handleResend() {
    if (!resendEmail) return;
    setResendLoading(true);
    setResendError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResendError(data.error || "Bir hata oluştu, tekrar deneyin.");
        return;
      }
      setResendSent(true);
    } catch {
      setResendError("Bağlantı hatası, tekrar deneyin.");
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (cancelled) return;

        if (!data.success) {
          setStatus("error");
          setMessage(data.error ?? "Doğrulama başarısız oldu.");
          return;
        }

        // Daha önce doğrulanmış — auto-login token yok, sadece login'e yönlendir
        if (data.alreadyVerified) {
          setStatus("success");
          return;
        }

        // Auto-login token geldiyse doğrudan giriş yap
        if (data.autoLoginToken) {
          setStatus("signing-in");
          const result = await signIn("credentials", {
            autoLoginToken: data.autoLoginToken,
            redirect: false,
          });

          if (cancelled) return;

          if (result?.error) {
            // Auto-login başarısız — yine de verify başarılı, manuel login'e yönlendir
            setStatus("success");
            return;
          }

          router.push("/dashboard");
          router.refresh();
          return;
        }

        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <AnimatedAuthPanel
        showPassword={false}
        passwordLength={0}
        heading="Son bir adım kaldı"
        subheading="Email adresini doğrulayıp hesabını aktifleştirelim."
      />

      {/* Right Content Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white text-zinc-900">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.svg" alt="Luden" width={200} height={72} className="h-14 w-auto mx-auto" />
          </div>

          {/* PENDING — kayıt sonrası inbox kontrol ekranı */}
          {status === "pending" && (
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#023435]/10 mx-auto mb-4">
                <Mail className="h-7 w-7 text-[#023435]" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Email adresini doğrula</h1>
              <p className="text-sm text-zinc-500 mb-2 leading-relaxed">
                {emailFromUrl ? (
                  <>
                    <strong className="text-zinc-700">{emailFromUrl}</strong> adresine bir doğrulama linki gönderdik.
                  </>
                ) : (
                  "Email adresine bir doğrulama linki gönderdik."
                )}{" "}
                Linke tıklayarak hesabını aktifleştir.
              </p>
              <p className="text-xs text-zinc-400 mb-6">Link 24 saat süreyle geçerlidir.</p>

              {/* Resend form */}
              <div className="space-y-3 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="resendEmail" className="text-sm font-medium">Email</Label>
                  <Input
                    id="resendEmail"
                    type="email"
                    placeholder="ad@klinik.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    readOnly={emailLocked}
                    className={`h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900 ${
                      emailLocked ? "bg-zinc-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {resendSent ? (
                  <p className="flex items-center justify-center gap-1 text-sm text-green-600 font-medium">
                    <Check className="size-4" /> Yeni link gönderildi
                  </p>
                ) : (
                  <>
                    {resendError && (
                      <p className="text-sm text-red-600 text-center">{resendError}</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading || !resendEmail}
                      className="w-full h-10 bg-[#023435] hover:bg-[#023435]/90 text-white"
                    >
                      {resendLoading ? "Gönderiliyor…" : "Linki tekrar gönder"}
                    </Button>
                  </>
                )}
              </div>

              <p className="mt-6 text-xs text-zinc-400">
                Email gelmezse spam klasörünü kontrol edin.
              </p>
              <p className="mt-4 text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-[#FE703A] hover:underline">
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </div>
          )}

          {/* LOADING — doğrulama başlatıldı */}
          {status === "loading" && (
            <div className="text-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-600">Email doğrulanıyor…</p>
            </div>
          )}

          {/* SIGNING-IN — verify ok, auto-login çalışıyor */}
          {status === "signing-in" && (
            <div className="text-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-[#023435]/20 border-t-[#023435] animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-600">Giriş yapılıyor…</p>
              <p className="mt-1 text-xs text-zinc-400">Seni yönlendiriyoruz.</p>
            </div>
          )}

          {/* SUCCESS — auto-login olmadı/başarısız, manuel login'e yönlendir */}
          {status === "success" && (
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Email doğrulandı!</h1>
              <p className="text-sm text-zinc-500 mb-6">
                Hesabın aktif. Artık giriş yapabilirsin.
              </p>
              <Link
                href="/login?verified=1"
                className="inline-block rounded-xl bg-[#FE703A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          )}

          {/* ERROR — token geçersiz/süresi dolmuş */}
          {status === "error" && (
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                <X className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Doğrulama başarısız</h1>
              <p className="text-sm text-zinc-500 mb-6">{message}</p>

              {resendSent ? (
                <p className="flex items-center justify-center gap-1 text-sm text-green-600 font-medium mb-4">
                  <Check className="size-4" /> Yeni doğrulama emaili gönderildi
                </p>
              ) : (
                <div className="space-y-3 text-left mb-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="resendEmailError" className="text-sm font-medium">Email</Label>
                    <Input
                      id="resendEmailError"
                      type="email"
                      placeholder="ad@klinik.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      readOnly={emailLocked}
                      className={`h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900 ${
                        emailLocked ? "bg-zinc-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  {resendError && (
                    <p className="text-sm text-red-600">{resendError}</p>
                  )}
                  <Button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || !resendEmail}
                    className="w-full h-10 bg-[#FE703A] hover:bg-[#FE703A]/90 text-white"
                  >
                    {resendLoading ? "Gönderiliyor…" : "Yeni doğrulama emaili gönder"}
                  </Button>
                </div>
              )}

              <p className="text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-zinc-400 hover:text-zinc-600">
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
