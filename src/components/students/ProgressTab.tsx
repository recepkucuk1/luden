"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AREA_LABELS } from "@/lib/constants";

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

type GoalProgress = { status: string; notes: string };
type ProgressMap = Record<string, GoalProgress>;

const STATUS_OPTIONS = [
  {
    value: "not_started",
    label: "Başlanmadı",
    icon: "⚪",
    activeCls: "bg-zinc-100 border-zinc-400 text-zinc-700",
    inactiveCls: "border-zinc-200 text-zinc-300 hover:border-zinc-400 hover:text-zinc-500",
  },
  {
    value: "in_progress",
    label: "Devam Ediyor",
    icon: "🔵",
    activeCls: "bg-blue-100 border-blue-500 text-blue-800",
    inactiveCls: "border-blue-100 text-blue-200 hover:border-blue-300 hover:text-blue-400",
  },
  {
    value: "completed",
    label: "Tamamlandı",
    icon: "✅",
    activeCls: "bg-emerald-100 border-emerald-500 text-emerald-800",
    inactiveCls: "border-emerald-100 text-emerald-200 hover:border-emerald-300 hover:text-emerald-400",
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
          onClick={() => onSet(goalId, opt.value)}
          title={opt.label}
          className={cn(
            "rounded-lg border px-2 py-1 text-xs font-medium transition-all",
            status === opt.value ? opt.activeCls : opt.inactiveCls
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

export function ProgressTab({
  studentId,
  curriculumIds,
  onEditClick,
}: {
  studentId: string;
  curriculumIds: string[];
  onEditClick?: () => void;
}) {
  const [allCurricula, setAllCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");

  const [localProgress, setLocalProgress] = useState<ProgressMap>({});
  const [savedProgress, setSavedProgress] = useState<ProgressMap>({});

  const [openMainGoals, setOpenMainGoals] = useState<Set<string>>(new Set());
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sadece öğrenciye atanmış modüller
  const curricula = useMemo(
    () => allCurricula.filter((c) => curriculumIds.includes(c.id)),
    [allCurricula, curriculumIds]
  );

  // curriculumIds değişince (düzenleme sonrası) seçimi güncelle
  useEffect(() => {
    if (curricula.length > 0 && !curricula.find((c) => c.id === selectedCurriculumId)) {
      setSelectedCurriculumId(curricula[0].id);
    } else if (curricula.length === 0) {
      setSelectedCurriculumId("");
    }
  }, [curricula]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      fetch("/api/curriculum").then((r) => r.json()),
      fetch(`/api/students/${studentId}/progress`).then((r) => r.json()),
    ])
      .then(([cData, pData]) => {
        setAllCurricula(cData.curricula ?? []);

        const progressList: { goalId: string; status: string; notes: string | null }[] =
          pData.progress ?? [];
        const map: ProgressMap = {};
        for (const p of progressList) {
          map[p.goalId] = { status: p.status, notes: p.notes ?? "" };
        }
        setLocalProgress(map);
        setSavedProgress(map);
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

  function setGoalStatus(goalId: string, status: string) {
    setLocalProgress((prev) => ({
      ...prev,
      [goalId]: { status, notes: prev[goalId]?.notes ?? "" },
    }));
  }

  function setGoalNotes(goalId: string, notes: string) {
    setLocalProgress((prev) => ({
      ...prev,
      [goalId]: { status: prev[goalId]?.status ?? "not_started", notes },
    }));
  }

  function toggleMainGoal(id: string) {
    setOpenMainGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleNote(goalId: string) {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId); else next.add(goalId);
      return next;
    });
  }

  const dirtyEntries = Object.entries(localProgress).filter(([id, v]) => {
    const saved = savedProgress[id];
    return !saved || saved.status !== v.status || saved.notes !== v.notes;
  });

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
      setSavedProgress((prev) => {
        const next = { ...prev };
        for (const [id, v] of dirtyEntries) next[id] = { ...v };
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

  // Boş state — modül atanmamış
  if (curriculumIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16 px-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-medium text-zinc-600 mb-1">
          Bu öğrenci için henüz çalışma modülü seçilmemiştir.
        </p>
        <p className="text-xs text-zinc-400 mb-5">
          Öğrenci profilini düzenleyerek modül ekleyebilirsiniz.
        </p>
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Öğrenciyi Düzenle → Modül Ekle
          </button>
        )}
      </div>
    );
  }

  // Curricula gruplama (area bazlı, dropdown için)
  const curriculaByArea = curricula.reduce<Record<string, Curriculum[]>>((acc, c) => {
    if (!acc[c.area]) acc[c.area] = [];
    acc[c.area].push(c);
    return acc;
  }, {});

  const allGoals = selectedCurriculum?.goals ?? [];
  const completedCount = allGoals.filter((g) => localProgress[g.id]?.status === "completed").length;
  const inProgressCount = allGoals.filter((g) => localProgress[g.id]?.status === "in_progress").length;
  const totalCount = allGoals.length;

  return (
    <div className="space-y-4">
      {/* Modül Dropdown */}
      {curricula.length > 1 && (
        <select
          value={selectedCurriculumId}
          onChange={(e) => setSelectedCurriculumId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(curriculaByArea).map(([area, list]) => (
            <optgroup key={area} label={AREA_LABELS[area] ?? area}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}

      {/* Tek modül varsa başlık olarak göster */}
      {curricula.length === 1 && selectedCurriculum && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-700">{selectedCurriculum.title}</p>
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Modülü Değiştir
            </button>
          )}
        </div>
      )}

      {/* İlerleme Özeti */}
      {totalCount > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-emerald-600">{completedCount}</span>
              {" "}tamamlandı ·{" "}
              <span className="font-semibold text-blue-600">{inProgressCount}</span>
              {" "}devam ediyor ·{" "}
              <span className="text-zinc-400">
                {totalCount - completedCount - inProgressCount} başlanmadı
              </span>
            </span>
            <span className="text-xs font-semibold text-zinc-700">
              {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
              <div
                className="bg-blue-400 transition-all duration-500"
                style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ana Hedef Listesi */}
      {selectedCurriculum && (
        <div className="space-y-2">
          {mainGoals.map((main) => {
            const subGoals = getSubGoals(main);
            const isOpen = openMainGoals.has(main.id);
            const subCompleted = subGoals.filter(
              (s) => localProgress[s.id]?.status === "completed"
            ).length;
            const subInProgress = subGoals.filter(
              (s) => localProgress[s.id]?.status === "in_progress"
            ).length;

            return (
              <div
                key={main.id}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleMainGoal(main.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                >
                  <span className="text-zinc-400 shrink-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 shrink-0 w-8">
                    {main.code}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-zinc-900 leading-snug">
                    {main.title}
                  </span>
                  {subGoals.length > 0 && (
                    <span className="text-[11px] text-zinc-400 shrink-0 tabular-nums">
                      {subCompleted}/{subGoals.length}
                      {subInProgress > 0 && (
                        <span className="ml-1 text-blue-400">· {subInProgress} sürmekte</span>
                      )}
                    </span>
                  )}
                </button>

                {isOpen && subGoals.length > 0 && (
                  <div className="divide-y divide-zinc-50">
                    {subGoals.map((sub) => {
                      const currentStatus = localProgress[sub.id]?.status ?? "not_started";
                      const currentNotes = localProgress[sub.id]?.notes ?? "";
                      const noteOpen = openNotes.has(sub.id);
                      const hasNote = currentNotes.length > 0;

                      return (
                        <div key={sub.id} className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-300 shrink-0 w-8 tabular-nums">
                              {sub.code}
                            </span>
                            <span className="flex-1 text-sm text-zinc-700 leading-snug">
                              {sub.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleNote(sub.id)}
                                title="Not ekle"
                                className={cn(
                                  "rounded p-1 transition-colors",
                                  noteOpen || hasNote
                                    ? "text-blue-500"
                                    : "text-zinc-200 hover:text-zinc-400"
                                )}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <GoalStatusButtons
                                goalId={sub.id}
                                status={currentStatus}
                                onSet={setGoalStatus}
                              />
                            </div>
                          </div>

                          {(noteOpen || hasNote) && (
                            <textarea
                              value={currentNotes}
                              onChange={(e) => setGoalNotes(sub.id, e.target.value)}
                              placeholder="Not ekle…"
                              rows={2}
                              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isOpen && subGoals.length === 0 && (
                  <p className="px-4 py-3 text-xs text-zinc-400">Alt hedef bulunmuyor.</p>
                )}
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
