"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface ProgressRecord {
  goalId: string;
  status: string;
  notes: string | null;
}

type GoalState = { status: string; notes: string; dirty: boolean };

const STATUS_OPTIONS = [
  {
    value: "not_started",
    label: "Başlanmadı",
    icon: "⚪",
    cls: "border-zinc-200 text-zinc-400 hover:border-zinc-300 data-[active=true]:bg-zinc-100 data-[active=true]:border-zinc-400 data-[active=true]:text-zinc-700",
  },
  {
    value: "in_progress",
    label: "Devam Ediyor",
    icon: "🔵",
    cls: "border-blue-200 text-blue-400 hover:border-blue-300 data-[active=true]:bg-blue-100 data-[active=true]:border-blue-500 data-[active=true]:text-blue-800",
  },
  {
    value: "completed",
    label: "Tamamlandı",
    icon: "✅",
    cls: "border-emerald-200 text-emerald-400 hover:border-emerald-300 data-[active=true]:bg-emerald-100 data-[active=true]:border-emerald-500 data-[active=true]:text-emerald-800",
  },
] as const;

function GoalStatusButtons({
  goalId,
  status,
  onSet,
}: {
  goalId: string;
  status: string;
  onSet: (goalId: string, status: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-active={status === opt.value}
          onClick={() => onSet(goalId, opt.value)}
          title={opt.label}
          className={cn(
            "rounded-lg border px-2 py-1 text-xs font-medium transition-all",
            opt.cls
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

export function ProgressTab({ studentId }: { studentId: string }) {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [progressMap, setProgressMap] = useState<Record<string, GoalState>>({});
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/curriculum").then((r) => r.json()),
      fetch(`/api/students/${studentId}/progress`).then((r) => r.json()),
    ])
      .then(([cData, pData]) => {
        const curriculaList: Curriculum[] = cData.curricula ?? [];
        const progressList: ProgressRecord[] = pData.progress ?? [];

        setCurricula(curriculaList);
        if (curriculaList.length > 0) {
          setSelectedCurriculumId(curriculaList[0].id);
        }

        const map: Record<string, GoalState> = {};
        for (const p of progressList) {
          map[p.goalId] = { status: p.status, notes: p.notes ?? "", dirty: false };
        }
        setProgressMap(map);
      })
      .catch(() => toast.error("Veriler yüklenemedi"))
      .finally(() => setLoading(false));
  }, [studentId]);

  const selectedCurriculum = curricula.find((c) => c.id === selectedCurriculumId);
  const mainGoals = selectedCurriculum?.goals.filter((g) => g.isMainGoal) ?? [];

  function getSubGoals(mainGoal: CurriculumGoal): CurriculumGoal[] {
    if (!selectedCurriculum) return [];
    const prefix = mainGoal.code.replace(".0", ".");
    return selectedCurriculum.goals.filter(
      (g) => !g.isMainGoal && g.code.startsWith(prefix)
    );
  }

  function setStatus(goalId: string, status: string) {
    setProgressMap((prev) => ({
      ...prev,
      [goalId]: {
        status,
        notes: prev[goalId]?.notes ?? "",
        dirty: true,
      },
    }));
  }

  function setNotes(goalId: string, notes: string) {
    setProgressMap((prev) => ({
      ...prev,
      [goalId]: {
        status: prev[goalId]?.status ?? "not_started",
        notes,
        dirty: true,
      },
    }));
  }

  function toggleNote(goalId: string) {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  }

  const dirtyEntries = Object.entries(progressMap).filter(([, v]) => v.dirty);

  async function handleSave() {
    if (dirtyEntries.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirtyEntries.map(([goalId, v]) => ({
            goalId,
            status: v.status,
            notes: v.notes || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProgressMap((prev) => {
        const next = { ...prev };
        for (const [id] of dirtyEntries) {
          if (next[id]) next[id] = { ...next[id], dirty: false };
        }
        return next;
      });
      toast.success(`${data.saved} hedef güncellendi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  // İlerleme özeti (seçili müfredat)
  const allGoalsInCurriculum = selectedCurriculum?.goals ?? [];
  const completedCount = allGoalsInCurriculum.filter(
    (g) => progressMap[g.id]?.status === "completed"
  ).length;
  const inProgressCount = allGoalsInCurriculum.filter(
    (g) => progressMap[g.id]?.status === "in_progress"
  ).length;
  const totalCount = allGoalsInCurriculum.length;

  return (
    <div className="space-y-4">
      {/* Müfredat Seçici */}
      <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1 w-fit">
        {curricula.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCurriculumId(c.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-medium transition-all",
              selectedCurriculumId === c.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* İlerleme Özeti */}
      {totalCount > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">
                <span className="font-semibold text-emerald-600">{completedCount}</span>
                {" "}tamamlandı ·{" "}
                <span className="font-semibold text-blue-600">{inProgressCount}</span>
                {" "}devam ediyor ·{" "}
                <span className="text-zinc-400">{totalCount - completedCount - inProgressCount} başlanmadı</span>
              </span>
              <span className="text-xs font-semibold text-zinc-700">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
                <div
                  className="bg-blue-400 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hedef Listesi */}
      {selectedCurriculum && (
        <div className="space-y-3">
          {mainGoals.map((main) => {
            const subGoals = getSubGoals(main);
            const mainState = progressMap[main.id];
            const subCompletedCount = subGoals.filter(
              (s) => progressMap[s.id]?.status === "completed"
            ).length;

            return (
              <div
                key={main.id}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden"
              >
                {/* Ana Hedef Satırı */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-zinc-400 shrink-0 w-6">
                      {main.code}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 leading-snug">
                      {main.title}
                    </span>
                    {subGoals.length > 0 && (
                      <span className="text-[10px] text-zinc-400 shrink-0 ml-1">
                        {subCompletedCount}/{subGoals.length}
                      </span>
                    )}
                  </div>
                  <GoalStatusButtons
                    goalId={main.id}
                    status={mainState?.status ?? "not_started"}
                    onSet={setStatus}
                  />
                </div>

                {/* Alt Hedef Satırları */}
                {subGoals.map((sub, idx) => {
                  const subState = progressMap[sub.id];
                  const noteOpen = openNotes.has(sub.id);
                  const hasNote = !!subState?.notes;

                  return (
                    <div
                      key={sub.id}
                      className={cn(
                        "px-4 py-3",
                        idx < subGoals.length - 1 && "border-b border-zinc-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-zinc-300 shrink-0 w-6">{sub.code}</span>
                          <span className="text-sm text-zinc-700 leading-snug">{sub.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleNote(sub.id)}
                            title="Not ekle"
                            className={cn(
                              "rounded p-1 text-sm transition-colors",
                              noteOpen || hasNote
                                ? "text-blue-500"
                                : "text-zinc-200 hover:text-zinc-400"
                            )}
                          >
                            📝
                          </button>
                          <GoalStatusButtons
                            goalId={sub.id}
                            status={subState?.status ?? "not_started"}
                            onSet={setStatus}
                          />
                        </div>
                      </div>

                      {(noteOpen || hasNote) && (
                        <textarea
                          value={subState?.notes ?? ""}
                          onChange={(e) => setNotes(sub.id, e.target.value)}
                          placeholder="Not ekle…"
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Kaydet */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <span className="text-xs text-zinc-400">
          {dirtyEntries.length > 0
            ? `${dirtyEntries.length} değişiklik kaydedilmedi`
            : "Tüm değişiklikler kaydedildi"}
        </span>
        <Button
          onClick={handleSave}
          disabled={dirtyEntries.length === 0 || saving}
          size="sm"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
