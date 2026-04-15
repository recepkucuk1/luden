"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const getReasonMessage = () => {
    switch (reason) {
      case "missing_token":
        return "Ödeme işlemi sırasında doğrulama anahtarı alınamadı.";
      case "user_not_found":
        return "Ödeme hesabı bulunamadı. Lütfen giriş yaptığınızı doğrulayın.";
      case "plan_not_found":
        return "Seçilen abonelik planı artık geçerli değil.";
      case "internal_error":
        return "Sistemde bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
      default:
        // Try decoding if iyzico sent something specific in URL
        return reason ? decodeURIComponent(reason) : "Ödeme başarısız oldu veya iyzico işlemi reddetti.";
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-red-100 bg-white p-10 shadow-sm max-w-md w-full relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">İşlem Tamamlanamadı</h1>
          <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
            {getReasonMessage()}
          </p>

          <Link href="/subscription" className="w-full">
            <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              Tekrar Dene
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  );
}
