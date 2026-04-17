import { Lightbulb, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrillItem {
  word: string;
  syllableCount?: number;
  syllableBreak?: string;
  position?: string;
  targetSound?: string;
  sentence?: string;
  visualPrompt?: string;
}

export interface ArticulationContent {
  title: string;
  targetSounds: string[];
  positions: string[];
  level: string;
  items: DrillItem[];
  expertNotes?: string;
  cueTypes?: string[];
  homeGuidance?: string;
}

const POSITION_LABEL: Record<string, string> = {
  initial: "Başta",
  medial:  "Ortada",
  final:   "Sonda",
};

const LEVEL_LABEL: Record<string, string> = {
  isolated:   "İzole Ses",
  syllable:   "Hece Düzeyi",
  word:       "Kelime Düzeyi",
  sentence:   "Cümle Düzeyi",
  contextual: "Bağlam İçi",
};

function highlightSound(text: string, sounds: string[]) {
  if (!sounds.length) return <span>{text}</span>;
  const letters = sounds.map((s) => s.replace(/\//g, "")).filter(Boolean);
  if (!letters.length) return <span>{text}</span>;
  const pattern = new RegExp(
    `(${letters.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <span key={i} className="font-bold text-[#FE703A]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function IsolatedView({ items }: { items: DrillItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <span className="text-xs font-semibold text-zinc-400 w-5">{i + 1}.</span>
          <span className="text-sm text-zinc-800">{item.word}</span>
        </li>
      ))}
    </ul>
  );
}

function SyllableView({ items }: { items: DrillItem[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-[#107996]/20 bg-[#107996]/5 px-3 py-2.5 text-center">
          <span className="text-sm font-semibold text-[#107996]">{item.word}</span>
        </div>
      ))}
    </div>
  );
}

function WordView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400 w-8">#</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Kelime</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Heceler</th>
            <th className="pb-2 text-left text-xs font-semibold text-zinc-400">Pozisyon</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={cn("border-b border-zinc-100", i % 2 === 0 ? "bg-white" : "bg-zinc-50")}>
              <td className="py-2 text-xs text-zinc-400">{i + 1}</td>
              <td className="py-2 font-medium text-zinc-800">{highlightSound(item.word, sounds)}</td>
              <td className="py-2 text-zinc-500">{item.syllableBreak ?? "—"}</td>
              <td className="py-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {POSITION_LABEL[item.position ?? ""] ?? item.position ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentenceView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
          <p className="text-sm font-semibold text-zinc-800 mb-1">
            {highlightSound(item.word, sounds)}
          </p>
          {item.sentence && (
            <p className="text-xs text-zinc-600 leading-relaxed">
              {highlightSound(item.sentence, sounds)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ContextualView({ items, sounds }: { items: DrillItem[]; sounds: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-700 leading-loose">
            {highlightSound(item.sentence ?? item.word, sounds)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ArticulationView({ drill }: { drill: ArticulationContent }) {
  const sounds = drill.targetSounds ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#023435] dark:text-foreground mb-3">{drill.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          {sounds.map((s) => (
            <span key={s} className="rounded-full bg-[#107996]/10 border border-[#107996]/20 px-2.5 py-0.5 text-xs font-semibold text-[#107996]">
              {s}
            </span>
          ))}
          {(drill.positions ?? []).map((p) => (
            <span key={p} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
              {POSITION_LABEL[p] ?? p}
            </span>
          ))}
          <span className="rounded-full bg-[#FE703A]/10 border border-[#FE703A]/20 px-2.5 py-0.5 text-xs text-[#FE703A]">
            {LEVEL_LABEL[drill.level] ?? drill.level}
          </span>
          <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
            {drill.items?.length ?? 0} öğe
          </span>
        </div>
      </div>

      <div>
        {drill.level === "isolated"   && <IsolatedView   items={drill.items} />}
        {drill.level === "syllable"   && <SyllableView   items={drill.items} />}
        {drill.level === "word"       && <WordView       items={drill.items} sounds={sounds} />}
        {drill.level === "sentence"   && <SentenceView   items={drill.items} sounds={sounds} />}
        {drill.level === "contextual" && <ContextualView items={drill.items} sounds={sounds} />}
        {!["isolated","syllable","word","sentence","contextual"].includes(drill.level) && (
          <WordView items={drill.items} sounds={sounds} />
        )}
      </div>

      {drill.cueTypes?.length ? (
        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-2">İpucu Türleri</p>
          <div className="flex flex-wrap gap-2">
            {drill.cueTypes.map((c, i) => (
              <span key={i} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {drill.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{drill.expertNotes}</p>
        </div>
      )}

      {drill.homeGuidance && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-blue-800">Veli Rehberi</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">{drill.homeGuidance}</p>
        </div>
      )}
    </div>
  );
}
