"use client";

import { Home, ChevronRight, Lightbulb, BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeeklyPlanWarmup {
  activity: string;
  duration: string;
  materials?: string[];
}

export interface WeeklyPlanMainWork {
  activity: string;
  duration: string;
  steps?: string[];
  materials?: string[];
  targetGoals?: string[];
}

export interface WeeklyPlanClosing {
  activity: string;
  duration: string;
}

export interface WeeklyPlanDay {
  dayNumber: number;
  dayName: string;
  date: string;
  duration: string;
  focusArea: string;
  objective: string;
  warmup: WeeklyPlanWarmup;
  mainWork: WeeklyPlanMainWork;
  closing: WeeklyPlanClosing;
  notes?: string | null;
}

export interface WeeklyPlanContent {
  title: string;
  weekRange: string;
  studentSummary?: string;
  days: WeeklyPlanDay[];
  weeklyGoal?: string;
  materialsNeeded?: string[];
  parentCommunication?: string;
  expertNotes?: string;
  nextWeekSuggestion?: string;
  sessionsPerWeek?: number;
  sessionDuration?: string;
  focusAreas?: string[];
}

const FOCUS_COLORS: Record<string, string> = {
  "Artikülasyon":         "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  "Dil gelişimi":         "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  "Akıcı konuşma":        "bg-purple-50 text-purple-700 border-purple-200",
  "Pragmatik dil":        "bg-pink-50 text-pink-700 border-pink-200",
  "İşitsel algı":         "bg-amber-50 text-amber-700 border-amber-200",
  "Oral motor":           "bg-green-50 text-green-700 border-green-200",
};

function focusBadgeClass(area: string) {
  for (const [key, cls] of Object.entries(FOCUS_COLORS)) {
    if (area.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "bg-[#023435]/10 text-[#023435] dark:text-foreground border-[#023435]/20";
}

function DayCard({ day }: { day: WeeklyPlanDay }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      {/* Day header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#023435]">
        <div>
          <p className="text-sm font-bold text-white">{day.dayName}</p>
          <p className="text-xs text-white/60">{day.date}</p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">
          {day.duration}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Focus + Objective */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", focusBadgeClass(day.focusArea))}>
            {day.focusArea}
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-800 leading-snug">{day.objective}</p>

        {/* Warmup */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🌅</span>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Isınma</p>
            <span className="ml-auto text-[10px] text-blue-500">{day.warmup.duration}</span>
          </div>
          <p className="text-sm text-blue-900 leading-relaxed">{day.warmup.activity}</p>
          {day.warmup.materials && day.warmup.materials.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {day.warmup.materials.map((m, i) => (
                <span key={i} className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">{m}</span>
              ))}
            </div>
          )}
        </div>

        {/* Main work */}
        <div className="rounded-xl border border-zinc-200 bg-white border-l-4 border-l-[#107996] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📚</span>
            <p className="text-xs font-semibold text-[#107996] uppercase tracking-wide">Ana Çalışma</p>
            <span className="ml-auto text-[10px] text-zinc-400">{day.mainWork.duration}</span>
          </div>
          <p className="text-sm text-zinc-800 leading-relaxed mb-3">{day.mainWork.activity}</p>
          {day.mainWork.steps && day.mainWork.steps.length > 0 && (
            <ol className="space-y-1 mb-3">
              {day.mainWork.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-600">
                  <span className="shrink-0 font-semibold text-[#107996]">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
          {day.mainWork.targetGoals && day.mainWork.targetGoals.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {day.mainWork.targetGoals.map((g, i) => (
                <span key={i} className="rounded-full bg-[#023435]/5 border border-[#023435]/10 px-2 py-0.5 text-[10px] text-[#023435] dark:text-foreground">🎯 {g}</span>
              ))}
            </div>
          )}
          {day.mainWork.materials && day.mainWork.materials.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {day.mainWork.materials.map((m, i) => (
                <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">{m}</span>
              ))}
            </div>
          )}
        </div>

        {/* Closing */}
        <div className="rounded-xl bg-green-50 border border-green-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🎯</span>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Kapanış</p>
            <span className="ml-auto text-[10px] text-green-500">{day.closing.duration}</span>
          </div>
          <p className="text-sm text-green-900 leading-relaxed">{day.closing.activity}</p>
        </div>

        {/* Day notes */}
        {day.notes && (
          <p className="text-xs text-zinc-400 italic border-t border-zinc-100 pt-3">{day.notes}</p>
        )}
      </div>
    </div>
  );
}

export function WeeklyPlanView({ plan }: { plan: WeeklyPlanContent }) {
  const days = Array.isArray(plan.days) ? plan.days : [];

  return (
    <div className="space-y-6">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#023435]/10 border border-[#023435]/20 px-2.5 py-0.5 text-xs font-medium text-[#023435] dark:text-foreground">
          {plan.weekRange}
        </span>
        <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
          {days.length} ders
        </span>
        {plan.sessionDuration && (
          <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {plan.sessionDuration} dk/ders
          </span>
        )}
        {plan.focusAreas?.map((a, i) => (
          <span key={i} className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", focusBadgeClass(a))}>
            {a}
          </span>
        ))}
      </div>

      {/* Student summary */}
      {plan.studentSummary && (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-500 mb-1">Öğrenci Özeti</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{plan.studentSummary}</p>
        </div>
      )}

      {/* Day cards */}
      <div className="space-y-4">
        {days.map((day, i) => (
          <DayCard key={i} day={day} />
        ))}
      </div>

      {/* Weekly goal */}
      {plan.weeklyGoal && (
        <div className="rounded-2xl border-2 border-[#FE703A]/30 bg-[#FE703A]/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-[#FE703A]" />
            <p className="text-sm font-bold text-[#FE703A]">Haftalık Hedef</p>
          </div>
          <p className="text-sm text-zinc-800 leading-relaxed">{plan.weeklyGoal}</p>
        </div>
      )}

      {/* Materials needed */}
      {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-700">Haftalık Materyaller</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.materialsNeeded.map((m, i) => (
              <span key={i} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Parent communication */}
      {plan.parentCommunication && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-800">Veli Bilgilendirmesi</p>
          </div>
          <p className="text-sm text-blue-900 leading-relaxed">{plan.parentCommunication}</p>
        </div>
      )}

      {/* Expert notes */}
      {plan.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-800">Uzman Notları</p>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed">{plan.expertNotes}</p>
        </div>
      )}

      {/* Next week suggestion */}
      {plan.nextWeekSuggestion && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChevronRight className="h-4 w-4 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-700">Gelecek Hafta Önerisi</p>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">{plan.nextWeekSuggestion}</p>
        </div>
      )}
    </div>
  );
}
