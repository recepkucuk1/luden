"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardPreview } from "@/components/cards/CardPreview";
import { AssignStudentsModal } from "@/components/cards/AssignStudentsModal";
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
  _count: { assignments: number };
  curriculumGoal: {
    id: string;
    code: string;
    title: string;
    isMainGoal: boolean;
    curriculum: { code: string; title: string };
  } | null;
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
  const [assignedCount, setAssignedCount] = useState(0);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cards/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setCard(data.card);
        setAssignedCount(data.card._count?.assignments ?? 0);
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
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-zinc-500">Kart bulunamadı.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#FE703A] hover:underline"
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
    <>
      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 bg-white px-6 py-2.5">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm">
          {card.student ? (
            <>
              <Link href="/students" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                Öğrenciler
              </Link>
              <span className="text-zinc-300">/</span>
              <Link
                href={`/students/${card.student.id}`}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {card.student.name}
              </Link>
            </>
          ) : (
            <Link href="/" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              Kart Üret
            </Link>
          )}
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-700 font-medium truncate max-w-[200px]">{card.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Müfredat Hedefi */}
        {card.curriculumGoal && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <span className="text-purple-500 text-sm mt-0.5">🎯</span>
            <div>
              <p className="text-xs font-semibold text-purple-700 mb-0.5">
                {card.curriculumGoal.curriculum.code} {card.curriculumGoal.curriculum.title}
              </p>
              <p className="text-xs text-purple-600">
                {card.curriculumGoal.code} — {card.curriculumGoal.title}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CardPreview card={generatedCard} />
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-zinc-400">
            {new Date(card.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {card.student && ` · ${card.student.name}`}
          </p>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            Öğrenciye Ata
            {assignedCount > 0 && (
              <span className="rounded-full bg-[#023435]/10 text-[#023435] px-1.5 py-0.5 text-[10px] font-semibold">
                {assignedCount}
              </span>
            )}
          </button>
        </div>
      </main>

      {showAssign && (
        <AssignStudentsModal
          cardId={card.id}
          cardTitle={card.title}
          onClose={() => setShowAssign(false)}
          onSaved={(count) => setAssignedCount(count)}
        />
      )}
    </>
  );
}
