"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { CardGeneratorForm } from "@/components/cards/CardGeneratorForm";
import { CardPreview } from "@/components/cards/CardPreview";
import type { GeneratedCard } from "@/lib/prompts";

export default function Home() {
  const { data: session } = useSession();
  const [card, setCard] = useState<GeneratedCard | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
              TM
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900">TerapiMat</h1>
              <p className="text-xs text-zinc-400">AI Destekli Egzersiz Kartı Üreticisi</p>
            </div>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-800">{session.user.name}</p>
                <p className="text-xs text-zinc-400">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">

          {/* Sol: Form */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Egzersiz Kartı Oluştur</h2>
              <p className="text-sm text-zinc-500">Parametreleri seç, AI egzersiz kartını üretsin.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <CardGeneratorForm
                onCardGenerated={setCard}
                onLoading={setLoading}
              />
            </div>
          </div>

          {/* Sağ: Önizleme */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Kart Önizleme</h2>
              <p className="text-sm text-zinc-500">
                {card ? "Üretilen egzersiz kartı aşağıda görüntüleniyor." : "Kart üretildiğinde burada görünecek."}
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="text-center space-y-3">
                  <div className="mx-auto h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <p className="text-sm text-zinc-500">Claude egzersiz kartı hazırlıyor…</p>
                </div>
              </div>
            ) : card ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <CardPreview card={card} />
              </div>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="text-center space-y-2 px-8">
                  <div className="text-4xl">🗂️</div>
                  <p className="text-sm font-medium text-zinc-500">Henüz kart üretilmedi</p>
                  <p className="text-xs text-zinc-400">
                    Sol taraftan parametreleri seçip "Kart Üret" butonuna bas.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
