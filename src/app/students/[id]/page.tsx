"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedCard } from "@/lib/prompts";
import {
  CATEGORY_LABEL as WORK_AREA_LABEL,
  WORK_AREA_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
  calcAge,
} from "@/lib/constants";

interface StudentCard {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  ageGroup: string;
  content: GeneratedCard;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  birthDate: string | null;
  workArea: string;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  cards: StudentCard[];
}


export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmCardId, setConfirmCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  async function deleteCard(cardId: string) {
    setDeletingCardId(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      setStudent((prev) =>
        prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== cardId) } : prev
      );
    } catch (err) {
      console.error("Kart silinemedi:", err);
    } finally {
      setDeletingCardId(null);
      setConfirmCardId(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setStudent(data.student);
      } catch (err) {
        console.error("Öğrenci yüklenemedi:", err);
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

  if (notFound || !student) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-500">Öğrenci bulunamadı.</p>
        <Button variant="outline" onClick={() => router.push("/students")}>
          Öğrencilere Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
              TM
            </div>
            <span className="text-base font-bold text-zinc-900">TerapiMat</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href="/students" className="text-sm text-zinc-500 hover:text-zinc-700">
            Öğrenciler
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-700">{student.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Öğrenci Bilgileri */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xl">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={WORK_AREA_COLOR[student.workArea] ?? "bg-zinc-100 text-zinc-600"}>
                    {WORK_AREA_LABEL[student.workArea] ?? student.workArea}
                  </Badge>
                  {student.birthDate && (
                    <span className="text-sm text-zinc-500">{calcAge(student.birthDate)}</span>
                  )}
                  {student.diagnosis && (
                    <span className="text-sm text-zinc-500">· {student.diagnosis}</span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}>
              <Button size="sm" className="shrink-0">
                ✨ Kart Üret
              </Button>
            </Link>
          </div>

          {student.notes && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Notlar</p>
              <p className="text-sm text-zinc-600">{student.notes}</p>
            </div>
          )}
        </div>

        {/* Öğrenme Kartları */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Öğrenme Kartları
              <span className="ml-2 text-sm font-normal text-zinc-400">({student.cards.length})</span>
            </h2>
          </div>

          {student.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 text-center">
              <div className="text-4xl mb-3">🗂️</div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Henüz kart üretilmedi</p>
              <p className="text-xs text-zinc-400 mb-4">
                Bu öğrenci için öğrenme kartı oluşturmak için &quot;Kart Üret&quot; butonuna tıkla.
              </p>
              <Link href={`/?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&workArea=${student.workArea}${student.birthDate ? `&birthDate=${encodeURIComponent(student.birthDate)}` : ""}`}>
                <Button size="sm">✨ Kart Üret</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {student.cards.map((card) => (
                <div
                  key={card.id}
                  className="group relative rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
                >
                  <Link href={`/cards/${card.id}`} className="block p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
                      <Badge className={WORK_AREA_COLOR[card.category] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                        {WORK_AREA_LABEL[card.category] ?? card.category}
                      </Badge>
                      <Badge className={DIFFICULTY_COLOR[card.difficulty] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                        {DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty}
                      </Badge>
                      <Badge className="bg-zinc-100 text-zinc-600" style={{ fontSize: "10px" }}>
                        {card.ageGroup}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-zinc-900 text-sm mb-1">{card.title}</h3>
                    {(card.content as GeneratedCard).objective && (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {(card.content as GeneratedCard).objective}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-zinc-400">
                        {new Date(card.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                      <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Detay →
                      </span>
                    </div>
                  </Link>

                  {/* Sil butonu */}
                  <button
                    onClick={() => setConfirmCardId(card.id)}
                    className="absolute top-3 right-3 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Sil
                  </button>

                  {/* Onay dialogu */}
                  {confirmCardId === card.id && (
                    <div className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                      <p className="text-sm font-medium text-zinc-700 text-center">
                        Bu kartı silmek istediğinize emin misiniz?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmCardId(null)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => deleteCard(card.id)}
                          disabled={deletingCardId === card.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          {deletingCardId === card.id ? "Siliniyor…" : "Evet, Sil"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
