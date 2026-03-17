"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedCard } from "@/lib/prompts";

const CATEGORY_LABEL: Record<string, string> = {
  speech: "Konuşma Terapisi",
  language: "Dil Terapisi",
  hearing: "İşitme Terapisi",
};

const CATEGORY_COLOR: Record<string, string> = {
  speech: "bg-blue-100 text-blue-700",
  language: "bg-purple-100 text-purple-700",
  hearing: "bg-teal-100 text-teal-700",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const AGE_LABEL: Record<string, string> = {
  "3-6": "3–6 yaş",
  "7-12": "7–12 yaş",
  "13-18": "13–18 yaş",
  adult: "Yetişkin",
};

interface CardPreviewProps {
  card: GeneratedCard;
}

export function CardPreview({ card }: CardPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Başlık ve Rozetler */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={CATEGORY_COLOR[card.category]}>{CATEGORY_LABEL[card.category]}</Badge>
          <Badge className={DIFFICULTY_COLOR[card.difficulty]}>{DIFFICULTY_LABEL[card.difficulty]}</Badge>
          <Badge className="bg-zinc-100 text-zinc-600">{AGE_LABEL[card.ageGroup]}</Badge>
          {card.duration && (
            <Badge className="bg-zinc-100 text-zinc-600">⏱ {card.duration}</Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">{card.title}</h2>
        <p className="text-zinc-600 text-sm leading-relaxed">{card.objective}</p>
      </div>

      {/* Materyaller */}
      {card.materials?.length > 0 && (
        <Card className="border-zinc-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              📦 Materyaller
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {card.materials.map((m, i) => (
                <span key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                  {m}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uygulama Adımları */}
      {card.instructions?.length > 0 && (
        <Card className="border-zinc-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              📋 Uygulama Adımları
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ol className="space-y-2">
              {card.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step.replace(/^Adım \d+:\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Egzersizler */}
      {card.exercises?.length > 0 && (
        <Card className="border-zinc-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              🏃 Egzersizler
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {card.exercises.map((ex, i) => (
              <div key={i} className="rounded-lg bg-zinc-50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">{ex.name}</span>
                  <span className="text-xs text-zinc-400 bg-white border border-zinc-200 rounded-full px-2 py-0.5">
                    {ex.repetitions}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">{ex.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Terapist Notları */}
      {card.therapistNotes && (
        <Card className="border-amber-100 bg-amber-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
              📝 Terapist Notları
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-amber-800 leading-relaxed">{card.therapistNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* İlerleme Göstergeleri */}
      {card.progressIndicators?.length > 0 && (
        <Card className="border-zinc-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              📈 İlerleme Göstergeleri
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-1">
              {card.progressIndicators.map((pi, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {pi}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ev Egzersizi */}
      {card.homeExercise && (
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              🏠 Ev Egzersizi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-blue-800 leading-relaxed">{card.homeExercise}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
