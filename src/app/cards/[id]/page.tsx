"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardPreview } from "@/components/cards/CardPreview";
import type { GeneratedCard } from "@/lib/prompts";

interface CardRecord {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  ageGroup: string;
  content: GeneratedCard;
  createdAt: string;
  student: { id: string; name: string } | null;
}

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<CardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cards/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setCard(data.card);
      } catch (err) {
        console.error("Kart yüklenemedi:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-500">Kart bulunamadı.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          Geri dön
        </button>
      </div>
    );
  }

  const generatedCard: GeneratedCard = {
    ...(card.content as GeneratedCard),
    category: card.category as GeneratedCard["category"],
    difficulty: card.difficulty as GeneratedCard["difficulty"],
    ageGroup: card.ageGroup as GeneratedCard["ageGroup"],
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
              TM
            </div>
            <span className="text-base font-bold text-zinc-900">TerapiMat</span>
          </Link>
          <span className="text-zinc-300">/</span>
          {card.student ? (
            <>
              <Link href="/students" className="text-sm text-zinc-500 hover:text-zinc-700">
                Öğrenciler
              </Link>
              <span className="text-zinc-300">/</span>
              <Link
                href={`/students/${card.student.id}`}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                {card.student.name}
              </Link>
              <span className="text-zinc-300">/</span>
            </>
          ) : (
            <>
              <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
                Ana Sayfa
              </Link>
              <span className="text-zinc-300">/</span>
            </>
          )}
          <span className="text-sm font-medium text-zinc-700 truncate max-w-[160px]">
            {card.title}
          </span>
          </div>
          <Link
            href="/profile"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
          >
            Profil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CardPreview card={generatedCard} />
        </div>
        <p className="text-xs text-zinc-400 text-center mt-4">
          {new Date(card.createdAt).toLocaleDateString("tr-TR", {
            day: "numeric", month: "long", year: "numeric",
          })}
          {card.student && ` · ${card.student.name}`}
        </p>
      </main>
    </div>
  );
}
