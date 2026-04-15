import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-zinc-100 bg-white p-10 shadow-sm max-w-md w-full relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#107996]/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#FE703A]/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Tebrikler!</h1>
          <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
            Aboneliğiniz başarıyla aktif edildi. Yeni planınızın tüm özelliklerine anında erişebilirsiniz. Kredileriniz hesabınıza yüklendi.
          </p>

          <Link href="/dashboard" className="w-full">
            <Button className="w-full bg-[#023435] hover:bg-[#04595B]">
              Panele Dön
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
