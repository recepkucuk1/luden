"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CardGeneratorForm } from "@/components/cards/CardGeneratorForm";
import { CardPreview } from "@/components/cards/CardPreview";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
import type { GeneratedCard } from "@/lib/prompts";

const LOADING_MSGS = [
  "Kelimeler uçuşuyor, kartınız şekilleniyor... 🦋",
  "Nöronlar ateşleniyor, hedefler hizalanıyor... 🧠",
  "Dil büyüsü yapılıyor, biraz sabır... ✨",
  "Öğrenme kartı pişiyor, fırından çıkmak üzere... 🍞",
  "Sesler, heceler, kelimeler bir araya geliyor... 🎵",
  "Uzman terapist moduna geçildi... 🎯",
  "Müfredat hedefleri karta işleniyor... 📚",
  "Beyin fırtınası devam ediyor... ⚡",
  "Kartınız özenle hazırlanıyor... 🌱",
  "Dil yolculuğunuz başlamak üzere... 🚀",
  "Kelime hazinesi kontrol ediliyor... 🔍",
  "Artikülasyon egzersizleri tasarlanıyor... 👄",
  "İşitsel bellekle dans ediliyor... 👂",
  "Terapi sihri devreye giriyor... 🪄",
  "Her hece bir adım, her adım bir zafer... 🏆",
  "Öğrenme maceranız kurgulanıyor... 🗺️",
];

function LoadingMessages() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LOADING_MSGS.length));
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % LOADING_MSGS.length);
        setVisible(true);
      }, 300);
    }, 2600);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex h-12 items-center justify-center">
      <p
        className="text-sm text-zinc-500 transition-opacity duration-300 max-w-xs text-center"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {LOADING_MSGS[index]}
      </p>
    </div>
  );
}

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
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-4rem)] md:h-[calc(100vh-0px)] flex flex-col">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] flex-1 min-h-0">
        {/* Sol: Form */}
        <div className="flex flex-col h-full min-h-0">
          <div className="mb-4 shrink-0">
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm flex-1 overflow-y-auto no-scrollbar">
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
        <div className="flex flex-col h-full min-h-0">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-semibold text-zinc-900">Kart Önizleme</h2>
            <p className="text-sm text-zinc-500">
              {card ? "Üretilen öğrenme kartı aşağıda görüntüleniyor." : "Kart üretildiğinde burada görünecek."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col min-h-0">
            {loading ? (
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="text-center space-y-4 px-8">
                  <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
                  <LoadingMessages />
                </div>
              </div>
            ) : card ? (
              <div className="flex flex-col min-h-0 gap-4 flex-1">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm overflow-y-auto no-scrollbar flex-1">
                  <CardPreview card={card} />
                </div>
                {/* Sonraki adım CTA'ları */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shrink-0">
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
              <div className="flex flex-1 min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
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
