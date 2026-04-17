import { Lightbulb, Eye, Star, Clock, Package, ChevronRight } from "lucide-react";

export interface HomeworkStep {
  stepNumber: number;
  instruction: string;
  tip?: string;
}

export interface HomeworkContent {
  title: string;
  materialType: "exercise" | "observation" | "daily_activity";
  duration: string;
  targetArea: string;
  introduction: string;
  materials?: string[];
  steps: HomeworkStep[];
  watchFor: string;
  celebration: string;
  frequency: string;
  expertNotes?: string;
  adaptations?: string;
}

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  exercise:       "Ev Egzersizi",
  observation:    "Gözlem Formu",
  daily_activity: "Günlük Aktivite",
};

const MATERIAL_TYPE_COLOR: Record<string, string> = {
  exercise:       "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  observation:    "bg-[#023435]/10 text-[#023435] dark:text-foreground border-[#023435]/20",
  daily_activity: "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

export function HomeworkView({ hw }: { hw: HomeworkContent }) {
  return (
    <div className="space-y-5">
      {/* Başlık + badge'ler */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] dark:text-foreground mb-3">{hw.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${MATERIAL_TYPE_COLOR[hw.materialType] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
            {MATERIAL_TYPE_LABEL[hw.materialType] ?? hw.materialType}
          </span>
          {hw.duration && (
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {hw.duration}
            </span>
          )}
          {hw.targetArea && (
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
              {hw.targetArea}
            </span>
          )}
        </div>
      </div>

      {/* Giriş */}
      {hw.introduction && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex gap-3">
          <Lightbulb className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-700 leading-relaxed">{hw.introduction}</p>
        </div>
      )}

      {/* Gerekli malzemeler */}
      {hw.materials && hw.materials.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-500">Gerekli Malzemeler</p>
          </div>
          <ul className="space-y-1">
            {hw.materials.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FE703A] shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adımlar */}
      {hw.steps && hw.steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-3">Adımlar</p>
          <div className="space-y-2.5">
            {hw.steps.map((step, i) => (
              <div key={i} className="rounded-lg border border-zinc-100 bg-white p-3 flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-[#107996]/10 text-[#107996] text-xs font-bold flex items-center justify-center">
                  {step.stepNumber ?? i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 leading-relaxed">{step.instruction}</p>
                  {step.tip && (
                    <p className="mt-1.5 rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5 text-xs italic text-zinc-500">
                      <ChevronRight className="inline h-3 w-3 mr-0.5" />
                      {step.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dikkat Edin */}
      {hw.watchFor && (
        <div className="rounded-xl border border-[#F4AE10]/30 bg-[#F4AE10]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Dikkat Edin</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{hw.watchFor}</p>
        </div>
      )}

      {/* Kutlama Anı */}
      {hw.celebration && (
        <div className="rounded-xl border border-[#023435]/20 bg-[#023435]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-[#023435] dark:text-foreground shrink-0" />
            <span className="text-xs font-semibold text-[#023435] dark:text-foreground">Kutlama Anı</span>
          </div>
          <p className="text-xs text-[#023435]/80 dark:text-foreground/90 leading-relaxed">{hw.celebration}</p>
        </div>
      )}

      {/* Tekrar sıklığı */}
      {hw.frequency && (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-500">Öneri: <span className="font-medium text-zinc-700">{hw.frequency}</span></span>
        </div>
      )}

      {/* Uyarlama önerileri */}
      {hw.adaptations && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Uyarlama Önerileri</p>
          <p className="text-xs text-zinc-600 leading-relaxed">{hw.adaptations}</p>
        </div>
      )}

      {/* Uzman Notları */}
      {hw.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{hw.expertNotes}</p>
        </div>
      )}
    </div>
  );
}
