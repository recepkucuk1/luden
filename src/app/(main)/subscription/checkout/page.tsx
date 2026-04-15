"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planType = searchParams.get("planType");
  const cycle = searchParams.get("cycle"); // "monthly" | "yearly"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!planType || !cycle) {
      setError("Geçersiz plan veya ödeme periyodu.");
      setLoading(false);
      return;
    }

    async function initializeCheckout() {
      try {
        const res = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType, cycle }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Ödeme sistemi başlatılamadı.");
        }

        if (data.checkoutFormContent && formWrapperRef.current) {
          formWrapperRef.current.innerHTML = data.checkoutFormContent;

          // Next.js strips and does not execute script tags inserted via innerHTML.
          // Manually re-execute the script tags supplied by iyzico.
          const scripts = formWrapperRef.current.querySelectorAll("script");
          scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            const scriptText = document.createTextNode(oldScript.innerHTML);
            newScript.appendChild(scriptText);
            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(newScript, oldScript);
            }
          });
        } else {
          throw new Error("Ödeme formu alınamadı.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Bilinmeyen bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    initializeCheckout();
  }, [planType, cycle]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-6 text-center shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400">Ödeme Hatası</h2>
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => router.push("/subscription")}
            className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            ← Planlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">Güvenli Ödeme</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Abone planınızı tamamlamak için ödeme bilgilerinizi giriniz.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-[#023435] dark:text-white" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Ödeme formu yükleniyor...</p>
          </div>
        )}

        {/* iyzico injects DOM elements exactly here */}
        <div ref={formWrapperRef} id="iyzico-wrapper" className="w-full" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
