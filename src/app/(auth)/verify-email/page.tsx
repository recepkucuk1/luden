"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type State = "pending" | "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = useState<State>(token ? "verifying" : "pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // Token varsa hemen doğrulama API'sini çağır
  useEffect(() => {
    if (!token) return;
    setState("verifying");
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setState("success");
          setTimeout(() => router.push("/login?verified=1"), 2500);
        } else {
          setState("error");
          setErrorMsg(data.error ?? "Doğrulama başarısız.");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("Sunucuya bağlanılamadı.");
      });
  }, [token, router]);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResending(false);
      setResendDone(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="Luden" width={160} height={58} className="h-12 w-auto mx-auto" />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center space-y-4">
          {/* PENDING — after register */}
          {state === "pending" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-[#023435]/8 flex items-center justify-center text-2xl">
                ✉️
              </div>
              <h1 className="text-xl font-bold text-zinc-900">Email adresinizi doğrulayın</h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {email ? (
                  <><strong className="text-zinc-700">{email}</strong> adresine bir doğrulama linki gönderdik.</>
                ) : (
                  "Email adresinize bir doğrulama linki gönderdik."
                )}
                {" "}Linke tıklayarak hesabınızı aktifleştirin.
              </p>
              <p className="text-xs text-zinc-400">Link 1 saat süreyle geçerlidir.</p>

              {email && (
                <div className="pt-2">
                  {resendDone ? (
                    <p className="text-sm text-[#023435] font-medium">Yeni link gönderildi ✓</p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="text-sm text-[#023435]/60 hover:text-[#023435] underline underline-offset-2 transition-colors disabled:opacity-40"
                    >
                      {resending ? "Gönderiliyor…" : "Linki tekrar gönder"}
                    </button>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100">
                <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          )}

          {/* VERIFYING */}
          {state === "verifying" && (
            <>
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
              <p className="text-sm text-zinc-500">Doğrulanıyor…</p>
            </>
          )}

          {/* SUCCESS */}
          {state === "success" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
                ✅
              </div>
              <h1 className="text-xl font-bold text-zinc-900">Email doğrulandı!</h1>
              <p className="text-sm text-zinc-500">Hesabınız aktif. Giriş sayfasına yönlendiriliyorsunuz…</p>
            </>
          )}

          {/* ERROR */}
          {state === "error" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <h1 className="text-xl font-bold text-zinc-900">Doğrulama başarısız</h1>
              <p className="text-sm text-zinc-500">{errorMsg}</p>
              <div className="pt-4 border-t border-zinc-100 space-y-2">
                {email && (
                  <button
                    onClick={handleResend}
                    disabled={resending || resendDone}
                    className="block w-full rounded-lg bg-[#023435] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#023435]/90 transition-colors disabled:opacity-50"
                  >
                    {resendDone ? "Yeni link gönderildi ✓" : resending ? "Gönderiliyor…" : "Yeni doğrulama linki gönder"}
                  </button>
                )}
                <Link
                  href="/login"
                  className="block text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
