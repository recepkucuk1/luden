"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GeneratedCard } from "@/lib/prompts";

const schema = z.object({
  category: z.enum(["speech", "language", "hearing"]),
  ageGroup: z.enum(["3-6", "7-12", "13-18", "adult"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  focusArea: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CardGeneratorFormProps {
  onCardGenerated: (card: GeneratedCard) => void;
  onLoading: (loading: boolean) => void;
}

const CATEGORIES = [
  { value: "speech", label: "Konuşma", icon: "🗣️", desc: "Artikülasyon, ses, akıcılık" },
  { value: "language", label: "Dil", icon: "📚", desc: "Anlama, üretme, kelime hazinesi" },
  { value: "hearing", label: "İşitme", icon: "👂", desc: "İşitsel hafıza, iletişim" },
] as const;

const AGE_GROUPS = [
  { value: "3-6", label: "3–6 yaş" },
  { value: "7-12", label: "7–12 yaş" },
  { value: "13-18", label: "13–18 yaş" },
  { value: "adult", label: "Yetişkin" },
] as const;

const DIFFICULTIES = [
  { value: "easy", label: "Kolay", color: "text-emerald-600 border-emerald-200 bg-emerald-50 data-[selected=true]:bg-emerald-100 data-[selected=true]:border-emerald-500" },
  { value: "medium", label: "Orta", color: "text-amber-600 border-amber-200 bg-amber-50 data-[selected=true]:bg-amber-100 data-[selected=true]:border-amber-500" },
  { value: "hard", label: "Zor", color: "text-red-600 border-red-200 bg-red-50 data-[selected=true]:bg-red-100 data-[selected=true]:border-red-500" },
] as const;

export function CardGeneratorForm({ onCardGenerated, onLoading }: CardGeneratorFormProps) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "speech",
      ageGroup: "7-12",
      difficulty: "easy",
    },
  });

  const watchedCategory = watch("category");
  const watchedAgeGroup = watch("ageGroup");
  const watchedDifficulty = watch("difficulty");

  async function onSubmit(values: FormValues) {
    setError(null);
    onLoading(true);
    try {
      const res = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      onCardGenerated(data.card);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kart üretilirken hata oluştu.");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Kategori */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700">Terapi Kategorisi</Label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setValue("category", cat.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all",
                watchedCategory === cat.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-semibold text-zinc-800">{cat.label}</span>
              <span className="text-[10px] text-zinc-400 leading-tight">{cat.desc}</span>
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
      </div>

      {/* Yaş Grubu */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700">Yaş Grubu</Label>
        <div className="grid grid-cols-4 gap-2">
          {AGE_GROUPS.map((age) => (
            <button
              key={age.value}
              type="button"
              onClick={() => setValue("ageGroup", age.value)}
              className={cn(
                "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                watchedAgeGroup === age.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              )}
            >
              {age.label}
            </button>
          ))}
        </div>
        {errors.ageGroup && <p className="text-xs text-red-500">{errors.ageGroup.message}</p>}
      </div>

      {/* Zorluk */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700">Zorluk Seviyesi</Label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              data-selected={watchedDifficulty === d.value}
              onClick={() => setValue("difficulty", d.value)}
              className={cn(
                "rounded-lg border-2 py-2 text-sm font-semibold transition-all",
                d.color
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        {errors.difficulty && <p className="text-xs text-red-500">{errors.difficulty.message}</p>}
      </div>

      {/* Hedef Beceri */}
      <div className="space-y-2">
        <Label htmlFor="focusArea" className="text-sm font-semibold text-zinc-700">
          Hedef Beceri <span className="text-zinc-400 font-normal">(isteğe bağlı)</span>
        </Label>
        <Textarea
          id="focusArea"
          {...register("focusArea")}
          placeholder="Örn: /s/ sesi üretimi, akıcı konuşma, kelime çağrışımı..."
          className="resize-none text-sm"
          rows={3}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-semibold"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Kart üretiliyor…
          </span>
        ) : (
          "✨ Kart Üret"
        )}
      </Button>
    </form>
  );
}
