"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

export interface PricingPlan {
  name: string;
  price: number | null;
  yearlyPrice: number | null;
  period: string;
  yearlyPeriod?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string | null;
  isPopular: boolean;
  customPriceLabel?: string;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
  creditNote?: string;
}

export function Pricing({
  plans,
  title = "Şeffaf fiyatlandırma",
  description = "İhtiyacınıza uygun planı seçin. İstediğiniz zaman geçiş yapın.",
  creditNote,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#FE703A", "#F4B2A6", "#023435", "#F4AE10"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-3">
        <Label className="text-sm font-medium text-zinc-700">Aylık</Label>
        <Switch
          ref={switchRef as React.RefObject<HTMLButtonElement>}
          checked={!isMonthly}
          onCheckedChange={handleToggle}
        />
        <Label className="text-sm font-medium text-zinc-700">
          Yıllık{" "}
          <span className="font-semibold text-[#FE703A]">(%15 indirim)</span>
        </Label>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    scale: index === 0 || index === 3 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-white p-6",
              plan.isPopular ? "border-2 border-[#FE703A]" : "border-zinc-200",
              !plan.isPopular && "lg:mt-5",
              index === 0 && "origin-right",
              index === 3 && "origin-left"
            )}
          >
            {plan.isPopular && (
              <div className="absolute right-0 top-0 flex items-center rounded-bl-xl rounded-tr-xl bg-[#FE703A] px-2 py-0.5">
                <Star className="h-4 w-4 fill-white text-white" />
                <span className="ml-1 text-sm font-semibold text-white">Popüler</span>
              </div>
            )}

            <div className="flex flex-1 flex-col">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {plan.name}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                {plan.customPriceLabel ? (
                  <span className="text-4xl font-bold text-zinc-900">
                    {plan.customPriceLabel}
                  </span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-zinc-900">
                      <NumberFlow
                        value={isMonthly ? (plan.price ?? 0) : (plan.yearlyPrice ?? 0)}
                        format={{
                          style: "currency",
                          currency: "TRY",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                          currencyDisplay: "narrowSymbol",
                        }}
                        transformTiming={{ duration: 500, easing: "ease-out" }}
                        willChange
                      />
                    </span>
                    {plan.period && (
                      <span className="text-sm font-medium text-zinc-400">
                        / {isMonthly ? plan.period : (plan.yearlyPeriod ?? plan.period)}
                      </span>
                    )}
                  </>
                )}
              </div>

              {!plan.customPriceLabel && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {isMonthly ? "aylık faturalandırılır" : "yıllık faturalandırılır"}
                </p>
              )}

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#FE703A]" />
                    <span className="text-sm text-zinc-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="my-6 border-zinc-100" />

              {plan.href ? (
                <Link
                  href={`${plan.href}${plan.href.includes("?") ? "&" : "?"}cycle=${isMonthly ? "monthly" : "yearly"}`}
                  className={cn(
                    "block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200",
                    plan.isPopular
                      ? "bg-[#FE703A] text-white hover:bg-[#FE703A]/90"
                      : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {plan.buttonText}
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
                >
                  {plan.buttonText}
                </button>
              )}

              <p className="mt-4 text-center text-xs text-zinc-400">
                {plan.description}
              </p>

              {creditNote && (
                <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-400">
                  <span className="font-medium text-zinc-500">Kredi nedir?</span>{" "}
                  {creditNote}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
