import { Calendar, Clock, Users, TrendingUp, Home, Lock, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoalPerformance {
  goal: string;
  accuracy: string;
  cueLevel: string;
  analysis: string;
  recommendation: string;
}

export interface SessionSummaryContent {
  title: string;
  sessionInfo: {
    date: string;
    duration: string;
    type: string;
    student: string;
  };
  goalPerformance: GoalPerformance[];
  overallAssessment: string;
  behaviorNotes?: string;
  nextSessionPlan: string;
  parentNote: string;
  expertNotes?: string;
  // metadata
  sessionType?: string;
  overallPerformance?: string;
  sessionDate?: string;
}

function parseAccuracy(acc: string | number): number {
  if (typeof acc === "number") return Math.min(100, Math.max(0, acc));
  const m = String(acc).match(/\d+/);
  return m ? Math.min(100, Math.max(0, parseInt(m[0]))) : 0;
}

function accuracyBarColor(pct: number): string {
  if (pct >= 81) return "#16a34a";
  if (pct >= 61) return "#ca8a04";
  if (pct >= 31) return "#FE703A";
  return "#ef4444";
}

function accuracyBadgeCls(pct: number): string {
  if (pct >= 81) return "bg-green-50 text-green-700 border-green-200";
  if (pct >= 61) return "bg-amber-50 text-amber-700 border-amber-200";
  if (pct >= 31) return "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20";
  return "bg-red-50 text-red-700 border-red-200";
}

const CUE_LEVEL_CLS: Record<string, string> = {
  "Bağımsız":        "bg-green-50 text-green-700 border-green-200",
  "Minimum İpucu":   "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  "Orta İpucu":      "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
  "Maksimum İpucu":  "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  "Tam Destek":      "bg-red-50 text-red-700 border-red-200",
};

const SESSION_TYPE_LABEL: Record<string, string> = {
  individual:     "Bireysel",
  group:          "Grup",
  assessment:     "Değerlendirme",
  parent_meeting: "Veli Görüşmesi",
};

const PERFORMANCE_LABEL: Record<string, string> = {
  above_target:  "Beklenenin Üstünde",
  on_target:     "Hedefle Uyumlu",
  progressing:   "Gelişim Gösteriyor",
  needs_support: "Ek Destek Gerekiyor",
  not_assessed:  "Değerlendirme Yapılamadı",
};

const PERFORMANCE_CLS: Record<string, string> = {
  above_target:  "bg-green-50 text-green-700 border-green-200",
  on_target:     "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  progressing:   "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
  needs_support: "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  not_assessed:  "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export function SessionSummaryView({ summary }: { summary: SessionSummaryContent }) {
  const goals = Array.isArray(summary.goalPerformance) ? summary.goalPerformance : [];

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] mb-3 leading-snug">{summary.title}</h2>

        {/* Oturum bilgileri badge'leri */}
        <div className="flex flex-wrap gap-1.5">
          {summary.sessionInfo?.date && (
            <span className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
              <Calendar className="h-3 w-3" />
              {summary.sessionInfo.date}
            </span>
          )}
          {summary.sessionInfo?.duration && (
            <span className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
              <Clock className="h-3 w-3" />
              {summary.sessionInfo.duration}
            </span>
          )}
          {(summary.sessionInfo?.type ?? SESSION_TYPE_LABEL[summary.sessionType ?? ""]) && (
            <span className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
              <Users className="h-3 w-3" />
              {summary.sessionInfo?.type ?? SESSION_TYPE_LABEL[summary.sessionType ?? ""]}
            </span>
          )}
          {summary.overallPerformance && (
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", PERFORMANCE_CLS[summary.overallPerformance] ?? "bg-zinc-100 text-zinc-500 border-zinc-200")}>
              {PERFORMANCE_LABEL[summary.overallPerformance] ?? summary.overallPerformance}
            </span>
          )}
        </div>
      </div>

      {/* Çalışılan Hedefler */}
      {goals.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-500">Çalışılan Hedefler ({goals.length})</p>
          </div>
          <div className="space-y-3">
            {goals.map((g, i) => {
              const pct = parseAccuracy(g.accuracy);
              return (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-zinc-800 leading-snug flex-1">{g.goal}</p>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold", accuracyBadgeCls(pct))}>
                      {g.accuracy}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-zinc-100 mb-3">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: accuracyBarColor(pct) }}
                    />
                  </div>
                  {/* Cue level */}
                  {g.cueLevel && (
                    <div className="mb-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", CUE_LEVEL_CLS[g.cueLevel] ?? "bg-zinc-100 text-zinc-500 border-zinc-200")}>
                        {g.cueLevel}
                      </span>
                    </div>
                  )}
                  {/* Analysis */}
                  {g.analysis && (
                    <p className="text-xs text-zinc-600 leading-relaxed mb-1.5">{g.analysis}</p>
                  )}
                  {/* Recommendation */}
                  {g.recommendation && (
                    <div className="flex items-start gap-1.5 mt-2 rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5">
                      <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-500 leading-relaxed">{g.recommendation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genel Değerlendirme */}
      {summary.overallAssessment && (
        <div className="rounded-xl border border-[#107996]/30 bg-[#107996]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-[#107996] shrink-0" />
            <p className="text-xs font-semibold text-[#107996]">Genel Değerlendirme</p>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{summary.overallAssessment}</p>
        </div>
      )}

      {/* Davranış ve Katılım */}
      {summary.behaviorNotes && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Davranış ve Katılım</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{summary.behaviorNotes}</p>
        </div>
      )}

      {/* Sonraki Oturum Planı */}
      {summary.nextSessionPlan && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 border-l-4 border-l-[#16a34a]">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Sonraki Oturum Planı</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{summary.nextSessionPlan}</p>
        </div>
      )}

      {/* Veliye İletilecek Not */}
      {summary.parentNote && (
        <div className="rounded-xl border-2 border-[#023435]/20 bg-[#023435]/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#023435]/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-[#023435]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#023435]">Veliye İletilecek Not</p>
              <p className="text-[10px] text-[#023435]/60">Bu bölümü veliye iletebilirsiniz</p>
            </div>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{summary.parentNote}</p>
        </div>
      )}

      {/* Uzman Notları */}
      {summary.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Uzman Notları
              <span className="ml-1 font-normal text-amber-700/70">(sadece uzman görür)</span>
            </p>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{summary.expertNotes}</p>
        </div>
      )}
    </div>
  );
}
