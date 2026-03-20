"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CardGeneratorForm } from "@/components/cards/CardGeneratorForm";
import { CardPreview } from "@/components/cards/CardPreview";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
import type { GeneratedCard } from "@/lib/prompts";

function HomeContent() {
  const searchParams = useSearchParams();
  const [card, setCard] = useState<GeneratedCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedCardId, setGeneratedCardId] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const studentId = searchParams.get("studentId") ?? undefined;
  const studentName = searchParams.get("studentName") ?? undefined;
  const studentBirthDate = searchParams.get("birthDate") ?? undefined;

  useEffect(() => {
    setCard(null);
    setGeneratedCardId(null);
  }, [studentId]);

  function handleCardGenerated(c: GeneratedCard) {
    setCard(c);
  }

  function handleNewCard() {
    setCard(null);
    setGeneratedCardId(null);
    setFormKey((k) => k + 1);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        {/* Sol: Form */}
        <div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">Öğrenme Kartı Oluştur</h2>
              {studentName && (
                <Link
                  href="/students"
                  className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                >
                  öğrencilere dön
                </Link>
              )}
            </div>
            <p className="text-sm text-zinc-500">Parametreleri seç, AI öğrenme kartını üretsin.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <CardGeneratorForm
              key={formKey}
              onCardGenerated={handleCardGenerated}
              onLoading={setLoading}
              onCardIdGenerated={setGeneratedCardId}
              studentId={studentId}
              studentName={studentName}
              studentBirthDate={studentBirthDate}
            />
          </div>
        </div>

        {/* Sağ: Önizleme */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Kart Önizleme</h2>
            <p className="text-sm text-zinc-500">
              {card ? "Üretilen öğrenme kartı aşağıda görüntüleniyor." : "Kart üretildiğinde burada görünecek."}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="text-center space-y-3">
                <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
                <p className="text-sm text-zinc-500">Claude öğrenme kartı hazırlıyor…</p>
              </div>
            </div>
          ) : card ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <CardPreview card={card} />
              </div>
              {/* Sonraki adım CTA'ları */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 mb-3">Sonraki adım</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/cards"
                    className="flex-1 min-w-[140px] rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-center"
                  >
                    Kart Kütüphanesi
                  </Link>
                  {generatedCardId && (
                    <button
                      onClick={() => setShowAssign(true)}
                      className="flex-1 min-w-[140px] rounded-lg bg-[#FE703A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#FE703A]/90 transition-colors"
                    >
                      Öğrenciye Ata
                    </button>
                  )}
                  <button
                    onClick={handleNewCard}
                    className="flex-1 min-w-[140px] rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                  >
                    Yeni Kart Üret
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
              <div className="text-center space-y-2 px-8">
                <div className="text-4xl">🗂️</div>
                <p className="text-sm font-medium text-zinc-500">Henüz kart üretilmedi</p>
                <p className="text-xs text-zinc-400">
                  Sol taraftan parametreleri seçip &quot;Kart Üret&quot; butonuna bas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssign && generatedCardId && card && (
        <AssignStudentsModal
          cardId={generatedCardId}
          cardTitle={card.title as string}
          onClose={() => setShowAssign(false)}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
