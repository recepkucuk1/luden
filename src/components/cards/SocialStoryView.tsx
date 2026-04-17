import { Lightbulb, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StorySentence {
  type: "descriptive" | "perspective" | "directive" | "affirmative";
  text: string;
  visualPrompt?: string;
}

export interface SocialStoryContent {
  title: string;
  sentences: StorySentence[];
  expertNotes?: string;
  homeGuidance?: string;
}

const SENTENCE_TYPE_LABEL: Record<string, string> = {
  descriptive: "Tanımlayıcı",
  perspective: "Perspektif",
  directive:   "Yönlendirici",
  affirmative: "Olumlu",
};

const SENTENCE_TYPE_COLOR: Record<string, string> = {
  descriptive: "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  perspective: "bg-[#023435]/10 text-[#023435] dark:text-foreground border-[#023435]/20",
  directive:   "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  affirmative: "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

export function SocialStoryView({ story }: { story: SocialStoryContent }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#023435] dark:text-foreground">{story.title}</h2>

      <div className="space-y-2.5">
        {story.sentences?.map((s, i) => (
          <div key={i} className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold h-fit mt-0.5",
                SENTENCE_TYPE_COLOR[s.type] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"
              )}
            >
              {SENTENCE_TYPE_LABEL[s.type] ?? s.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-800 leading-relaxed">{s.text}</p>
              {s.visualPrompt && (
                <p className="mt-1 text-xs italic text-zinc-400">{s.visualPrompt}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {story.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Uzman Notları</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">{story.expertNotes}</p>
        </div>
      )}

      {story.homeGuidance && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-blue-800">Veli Rehberi</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">{story.homeGuidance}</p>
        </div>
      )}
    </div>
  );
}
