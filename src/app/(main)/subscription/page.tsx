"use client";

import { Pricing } from "@/components/ui/pricing";
import { PLAN_CONFIG } from "@/lib/plans";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's current plan
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.therapist) {
          setCurrentPlan(data.therapist.planType);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </main>
    );
  }

  const plans = [
    {
      name: "FREE",
      price: PLAN_CONFIG.FREE.monthlyPrice / 100,
      yearlyPrice: PLAN_CONFIG.FREE.yearlyPrice / 100,
      period: "ay",
      yearlyPeriod: "yıl",
      features: [
        "2 öğrenciye kadar kayıt",
        "40 ücretsiz aylık kredi",
        "Temel özelliklere erişim",
      ],
      description: "Platformu ücretsiz test edin",
      buttonText: currentPlan === "FREE" ? "Mevcut Planınız" : "Ücretsiz Başla",
      href: null,
      isPopular: false,
    },
    {
      name: "PRO",
      price: PLAN_CONFIG.PRO.monthlyPrice / 100,
      yearlyPrice: PLAN_CONFIG.PRO.yearlyPrice / 100,
      period: "ay",
      yearlyPeriod: "yıl",
      features: [
        "200 öğrenciye kadar kayıt",
        "2000 kredi / yenileme",
        "Gelişmiş AI Analizleri",
        "PDF çıktı alma",
      ],
      description: "Bireysel çalışan uzmanlar için",
      buttonText: currentPlan === "PRO" ? "Mevcut Planınız" : "Pro'ya Geç",
      href: currentPlan === "PRO" ? null : "/subscription/checkout?planType=PRO",
      isPopular: true,
    },
    {
      name: "ADVANCED",
      price: PLAN_CONFIG.ADVANCED.monthlyPrice / 100,
      yearlyPrice: PLAN_CONFIG.ADVANCED.yearlyPrice / 100,
      period: "ay",
      yearlyPeriod: "yıl",
      features: [
        "Sınırsız öğrenci kaydı",
        "10000 kredi / yenileme",
        "Tüm premium özellikler",
        "Öncelikli destek",
      ],
      description: "Büyük merkezler ve yoğun klinik uzmanlar için",
      buttonText: currentPlan === "ADVANCED" ? "Mevcut Planınız" : "Advanced'a Geç",
      href: currentPlan === "ADVANCED" ? null : "/subscription/checkout?planType=ADVANCED",
      isPopular: false,
    },
    {
      name: "ENTERPRISE",
      price: null,
      yearlyPrice: null,
      period: "ay",
      features: [
        "Sınırsız öğrenci",
        "Sınırsız kredi kullanımı",
        "Kuruma özel entegrasyon",
        "7/24 Özel Destek Uzmanı",
      ],
      description: "Büyük kurumlar için tam donanımlı paket.",
      buttonText: "İletişime Geçin",
      href: "mailto:merhaba@ludenlab.com",
      isPopular: false,
      customPriceLabel: "Özel",
    },
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <Pricing 
        plans={plans} 
        title="Gücünüzü Zirveye Taşıyın"
        description={
          currentPlan
            ? `Şu anki planınız: ${currentPlan}. İhtiyacınıza uygun plana geçiş yapın.`
            : "İhtiyacınıza uygun planı seçin. Yıllık alımlarda indirim avantajını kaçırmayın."
        }
      />
    </div>
  );
}
