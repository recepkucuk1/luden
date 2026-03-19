"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
type AgeGroup = "3-6" | "7-12" | "13-18" | "adult";

function calcAgeGroup(birthDate: string): AgeGroup {
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  if (age < 7)  return "3-6";
  if (age < 13) return "7-12";
  if (age < 19) return "13-18";
  return "adult";
}

// ─── Curriculum types ─────────────────────────────────────────────────────────
interface CurriculumGoal {
  id: string;
  code: string;
  title: string;
  isMainGoal: boolean;
}

interface Curriculum {
  id: string;
  code: string;
  area: string;
  title: string;
  goals: CurriculumGoal[];
}

// ─── Form props ───────────────────────────────────────────────────────────────
interface CardGeneratorFormProps {
  onCardGenerated: (card: GeneratedCard) => void;
  onLoading: (loading: boolean) => void;
  studentId?: string;
  studentName?: string;
  studentBirthDate?: string;
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

const SELECT_CLS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

export function CardGeneratorForm({
  onCardGenerated,
  onLoading,
  studentId,
  studentName,
  studentBirthDate,
}: CardGeneratorFormProps) {
  const [error, setError] = useState<string | null>(null);

  // ─── Curriculum state ──────────────────────────────────────────────────────
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [selectedMainGoalId, setSelectedMainGoalId] = useState("");
  const [selectedSubGoalIds, setSelectedSubGoalIds] = useState<string[]>([]); // çoklu seçim

  const AREA_LABELS: Record<string, string> = {
    speech: "Akıcılık Bozukluğu",
    language: "Dil",
    acquired_language: "Edinilmiş Dil",
    speech_sound: "Konuşma Sesi",
    motor_speech: "Motor Konuşma",
    resonance: "Rezonans",
    voice: "Ses",
    hearing: "İşitme Eğitimi",
    hearing_language: "Dil Eğitimi (İşitme)",
    hearing_social: "Sosyal İletişim",
    hearing_learning: "Öğrenmeye Destek",
    hearing_literacy: "Okuma ve Yazma",
    hearing_early_math: "Erken Matematik",
    hearing_math: "Matematik",
  };

  const curriculaByArea = curricula.reduce<Record<string, Curriculum[]>>((acc, c) => {
    if (!acc[c.area]) acc[c.area] = [];
    acc[c.area].push(c);
    return acc;
  }, {});

  useEffect(() => {
    fetch("/api/curriculum")
      .then((r) => r.json())
      .then((d) => setCurricula(d.curricula ?? []))
      .catch(() => {/* sessiz */});
  }, []);

  const selectedCurriculum = curricula.find((c) => c.id === selectedCurriculumId);
  const mainGoals = selectedCurriculum?.goals.filter((g) => g.isMainGoal) ?? [];
  const selectedMainGoal = mainGoals.find((g) => g.id === selectedMainGoalId);

  // Alt hedefler: seçili ana hedefin altındakiler
  const filteredSubGoals = selectedMainGoal
    ? (selectedCurriculum?.goals.filter(
        (g) => !g.isMainGoal && g.code.startsWith(selectedMainGoal.code.replace(".0", "."))
      ) ?? [])
    : [];

  function toggleSubGoal(id: string) {
    setSelectedSubGoalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function resetCurriculum() {
    setSelectedCurriculumId("");
    setSelectedMainGoalId("");
    setSelectedSubGoalIds([]);
  }

  // ─── React Hook Form ───────────────────────────────────────────────────────
  const autoAgeGroup = studentBirthDate ? calcAgeGroup(studentBirthDate) : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "speech",
      ageGroup: autoAgeGroup ?? "7-12",
      difficulty: "easy",
    },
  });

  useEffect(() => {
    if (autoAgeGroup) setValue("ageGroup", autoAgeGroup);
  }, [autoAgeGroup, setValue]);

  const watchedCategory = watch("category");
  const watchedAgeGroup = watch("ageGroup");
  const watchedDifficulty = watch("difficulty");

  // Hangi kategori hangi curriculum area'larını görebilir
  const CATEGORY_AREA_FILTER: Record<string, string[] | null> = {
    speech:   ["speech", "speech_sound", "motor_speech", "resonance", "voice"],
    language: ["language", "acquired_language"],
    hearing:  ["hearing", "hearing_language", "hearing_social", "hearing_learning", "hearing_literacy", "hearing_early_math", "hearing_math"],
  };
  const allowedAreas = CATEGORY_AREA_FILTER[watchedCategory] ?? null;
  const filteredCurriculaByArea = Object.fromEntries(
    Object.entries(curriculaByArea).filter(([area]) =>
      !allowedAreas || allowedAreas.includes(area)
    )
  );

  // Kategori değişince müfredat seçimini sıfırla
  useEffect(() => {
    resetCurriculum();
  }, [watchedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    setError(null);
    onLoading(true);
    const loadingToast = toast.loading("Kart üretiliyor…");
    try {
      const res = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          studentId,
          // Alt hedef seçildiyse array, yoksa ana hedef tek eleman, yoksa boş
          curriculumGoalIds: selectedSubGoalIds.length > 0
            ? selectedSubGoalIds
            : selectedMainGoalId
            ? [selectedMainGoalId]
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      toast.success("Öğrenme kartı oluşturuldu", { id: loadingToast });
      onCardGenerated(data.card);
    } catch (err) {
      toast.error("Bir hata oluştu, tekrar deneyin", { id: loadingToast });
      setError(err instanceof Error ? err.message : "Kart üretilirken hata oluştu.");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Seçili Öğrenci */}
      {studentId && studentName && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-blue-600 text-sm">👤</span>
          <span className="text-sm text-blue-700 font-medium">{studentName}</span>
          <span className="text-xs text-blue-500 ml-auto">için kart üretiliyor</span>
        </div>
      )}

      {/* Kategori */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-zinc-700">Eğitim Kategorisi</Label>
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
        {autoAgeGroup ? (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="text-sm text-zinc-700 font-medium">
              {AGE_GROUPS.find((a) => a.value === autoAgeGroup)?.label}
            </span>
            <span className="text-xs text-zinc-400 ml-auto">öğrenciden otomatik</span>
          </div>
        ) : (
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
        )}
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

      {/* Müfredat Hedefi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-zinc-700">
            Müfredat Hedefi{" "}
            <span className="text-zinc-400 font-normal">(isteğe bağlı)</span>
          </Label>
          {selectedCurriculumId && (
            <button
              type="button"
              onClick={resetCurriculum}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Alan seçimi */}
        <select
          value={selectedCurriculumId}
          onChange={(e) => {
            setSelectedCurriculumId(e.target.value);
            setSelectedMainGoalId("");
            setSelectedSubGoalIds([]);
          }}
          className={SELECT_CLS}
        >
          <option value="">— Modül seç —</option>
          {Object.entries(filteredCurriculaByArea).map(([area, list]) => (
            <optgroup key={area} label={AREA_LABELS[area] ?? area}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Ana hedef */}
        {selectedCurriculumId && (
          <select
            value={selectedMainGoalId}
            onChange={(e) => {
              setSelectedMainGoalId(e.target.value);
              setSelectedSubGoalIds([]);
            }}
            className={SELECT_CLS}
          >
            <option value="">— Ana hedef seç —</option>
            {mainGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.code} {g.title}
              </option>
            ))}
          </select>
        )}

        {/* Alt hedef — checkbox listesi */}
        {selectedMainGoalId && filteredSubGoals.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 divide-y divide-zinc-100">
            {filteredSubGoals.map((g) => {
              const checked = selectedSubGoalIds.includes(g.id);
              return (
                <label
                  key={g.id}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                    checked ? "bg-blue-50" : "hover:bg-white"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubGoal(g.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-blue-600"
                  />
                  <span className="text-xs text-zinc-400 shrink-0 w-10 tabular-nums pt-px">
                    {g.code}
                  </span>
                  <span className="text-xs text-zinc-700 leading-relaxed">{g.title}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Seçim özeti */}
        {(selectedSubGoalIds.length > 0 || selectedMainGoalId) && (
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
            <span className="text-blue-500 text-xs mt-0.5">🎯</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              {selectedSubGoalIds.length > 0
                ? `${selectedSubGoalIds.length} alt hedef seçildi`
                : mainGoals.find((g) => g.id === selectedMainGoalId)?.title}
            </p>
          </div>
        )}
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
