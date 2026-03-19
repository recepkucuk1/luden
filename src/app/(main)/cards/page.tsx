"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
import {
  WORK_AREA_COLOR,
  WORK_AREA_LABEL,
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
} from "@/lib/constants";

interface CardItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  ageGroup: string;
  createdAt: string;
  student: { id: string; name: string } | null;
  _count: { assignments: number };
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningCard, setAssigningCard] = useState<CardItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cards");
        const data = await res.json();
        if (res.ok) setCards(data.cards ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSaved(cardId: string, assignedCount: number) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, _count: { assignments: assignedCount } } : c
      )
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-zinc-100 bg-white px-6 py-2.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-700">Kart Kütüphanesi</h1>
          <Link href="/">
            <Button size="sm">✨ Kart Üret</Button>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-sm font-medium text-zinc-500 mb-1">Henüz kart oluşturulmadı</p>
            <p className="text-xs text-zinc-400 mb-4">
              Öğrencileriniz için kart üretmeye başlayın.
            </p>
            <Link href="/">
              <Button size="sm">✨ Kart Üret</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="group rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <Link href={`/cards/${card.id}`} className="block p-4 flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge
                      className={WORK_AREA_COLOR[card.category] ?? "bg-zinc-100 text-zinc-600"}
                      style={{ fontSize: "10px" }}
                    >
                      {WORK_AREA_LABEL[card.category] ?? card.category}
                    </Badge>
                    <Badge
                      className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-zinc-100 text-zinc-600"}
                      style={{ fontSize: "10px" }}
                    >
                      {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                    </Badge>
                    <Badge className="bg-zinc-100 text-zinc-600" style={{ fontSize: "10px" }}>
                      {card.ageGroup}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm mb-1 line-clamp-2">
                    {card.title}
                  </h3>
                  <div className="mt-2 space-y-0.5">
                    {card.student && (
                      <p className="text-xs text-zinc-400">
                        Üretildi: {card.student.name}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">
                      {card._count.assignments > 0
                        ? `${card._count.assignments} öğrenciye atandı`
                        : "Henüz atanmadı"}
                    </p>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setAssigningCard(card)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                  >
                    Öğrenciye Ata
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {assigningCard && (
        <AssignStudentsModal
          cardId={assigningCard.id}
          cardTitle={assigningCard.title}
          onClose={() => setAssigningCard(null)}
          onSaved={(count) => handleSaved(assigningCard.id, count)}
        />
      )}
    </>
  );
}
