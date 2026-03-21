"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GeneratedCard } from "@/lib/prompts";
import {
  WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
  AGE_LABEL,
} from "@/lib/constants";
import { InlineMd } from "@/components/Md";

// @react-pdf/renderer SSR uyumlu değil — client-side only
const CardPDFDocument = dynamic(
  () => import("./CardPDFDocument").then((m) => m.CardPDFDocument),
  { ssr: false }
);

interface CardPreviewProps {
  card: GeneratedCard;
}

async function downloadPDF(card: GeneratedCard) {
  const { pdf } = await import("@react-pdf/renderer");
  const { CardPDFDocument } = await import("./CardPDFDocument");
  const blob = await pdf(<CardPDFDocument card={card} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${card.title.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CardPreview({ card }: CardPreviewProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const loadingToast = toast.loading("PDF hazırlanıyor…");
    try {
      await downloadPDF(card);
      toast.success("PDF indirildi", { id: loadingToast });
    } catch (err) {
      console.error("[PDF] oluşturma hatası:", err);
      toast.error("PDF oluşturulamadı, tekrar deneyin", { id: loadingToast });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Başlık ve Rozetler */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={WORK_AREA_COLOR[card.category]}>{WORK_AREA_LABEL[card.category]}</Badge>
            <Badge className={DIFFICULTY_COLOR[card.difficulty]}>{DIFFICULTY_LABEL[card.difficulty]}</Badge>
            <Badge className="bg-zinc-100 text-zinc-600">{AGE_LABEL[card.ageGroup]}</Badge>
            {card.duration && (
              <Badge className="bg-zinc-100 text-zinc-600">⏱ {card.duration}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 gap-1.5 text-xs"
          >
            {downloading ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Hazırlanıyor…
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF İndir
              </>
            )}
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900">{card.title}</h2>
        <p className="text-zinc-600 text-sm leading-relaxed"><InlineMd text={card.objective} /></p>
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
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FE703A]/10 text-xs font-bold text-[#FE703A]">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed"><InlineMd text={step.replace(/^Adım \d+:\s*/, "")} /></span>
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
                <p className="text-xs text-zinc-600 leading-relaxed"><InlineMd text={ex.description} /></p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Uzman Notları */}
      {card.therapistNotes && (
        <Card className="border-amber-100 bg-amber-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
              📝 Uzman Notları
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-amber-800 leading-relaxed"><InlineMd text={card.therapistNotes} /></p>
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
                  <InlineMd text={pi} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ev Egzersizi */}
      {card.homeExercise && (
        <Card className="border-[#023435]/15 bg-[#023435]/5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-[#023435] uppercase tracking-wide">
              🏠 Ev Egzersizi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-[#023435] leading-relaxed"><InlineMd text={card.homeExercise} /></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
