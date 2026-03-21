"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Doğrulama token'ı bulunamadı.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Doğrulama başarısız oldu.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
      });
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200 shadow-sm p-8 text-center">
        <Link href="/" className="inline-block mb-6">
          <Image src="/logo.svg" alt="Luden" width={100} height={36} className="h-8 w-auto mx-auto" />
        </Link>

        {status === "loading" && (
          <>
            <div className="h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-zinc-600">Email doğrulanıyor…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 mb-2">Email Doğrulandı!</h1>
            <p className="text-sm text-zinc-500 mb-6">Artık giriş yapabilirsiniz. Yönlendiriliyorsunuz…</p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-[#FE703A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#FE703A]/90 transition-colors"
            >
              Giriş Yap
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 mb-2">Doğrulama Başarısız</h1>
            <p className="text-sm text-zinc-500 mb-6">{message}</p>
            <Link href="/register" className="text-sm font-medium text-[#FE703A] hover:underline">
              Tekrar kayıt ol
            </Link>
          </>
        )}
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
