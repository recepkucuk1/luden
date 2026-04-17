import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb, Info } from "lucide-react";

export interface MatchingPair {
  id: number;
  cardA: string;
  cardB: string;
  hint?: string;
}

export interface MatchingGameContent {
  title: string;
  matchType: "synonym" | "antonym" | "definition" | "image_desc" | "category" | "sentence";
  difficulty: "easy" | "medium" | "hard";
  pairs: MatchingPair[];
  instructions?: string;
  expertNotes?: string;
  adaptations?: string;
  theme?: string;
  pairCount?: number;
}

const MATCH_TYPE_LABEL: Record<string, string> = {
  definition: "Kelime — Tanım",
  image_desc: "Kelime — Resim Açıklaması",
  synonym:    "Eş Anlamlı",
  antonym:    "Zıt Anlamlı",
  category:   "Kategori Eşleştirme",
  sentence:   "Cümle Tamamlama",
};

const MATCH_TYPE_COLOR: Record<string, string> = {
  definition: "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  image_desc: "bg-[#023435]/10 text-[#023435] dark:text-foreground border-[#023435]/20",
  synonym:    "bg-green-50 text-green-700 border-green-200",
  antonym:    "bg-red-50 text-red-700 border-red-200",
  category:   "bg-purple-50 text-purple-700 border-purple-200",
  sentence:   "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard:   "bg-red-50 text-red-700 border-red-200",
};

export function MatchingGameView({ game }: { game: MatchingGameContent }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const pairs = Array.isArray(game.pairs) ? game.pairs : [];

  return (
    <div className="space-y-5">
      {/* Başlık + badge'ler */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] dark:text-foreground mb-3 leading-snug">{game.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", MATCH_TYPE_COLOR[game.matchType] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
            {MATCH_TYPE_LABEL[game.matchType] ?? game.matchType}
          </span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", DIFFICULTY_COLOR[game.difficulty] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
            {DIFFICULTY_LABEL[game.difficulty] ?? game.difficulty}
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
            {pairs.length} çift
          </span>
          {game.theme && (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
              {game.theme}
            </span>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="w-8 py-2.5 px-3 text-left text-xs font-semibold text-zinc-400">#</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-zinc-600">Kart A</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-zinc-600">Kart B</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => (
              <tr key={pair.id ?? i} className={cn("border-b border-zinc-100 last:border-0", i % 2 === 1 && "bg-zinc-50/50")}>
                <td className="py-2.5 px-3 text-xs text-zinc-400 font-medium">{pair.id ?? i + 1}</td>
                <td className="py-2.5 px-3 text-sm text-zinc-800 font-medium">{pair.cardA}</td>
                <td className="py-2.5 px-3 text-sm text-zinc-600">
                  {pair.cardB}
                  {pair.hint && (
                    <span className="ml-1.5 text-[10px] text-zinc-400 italic">({pair.hint})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Talimatlar */}
      {game.instructions && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex gap-3">
          <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1">Nasıl Oynanır</p>
            <p className="text-sm text-zinc-700 leading-relaxed">{game.instructions}</p>
          </div>
        </div>
      )}

      {/* Uyarlama */}
      {game.adaptations && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Uyarlama Önerileri</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{game.adaptations}</p>
        </div>
      )}

      {/* Uzman Notları */}
      {game.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">Uzman Notları</p>
            <p className="text-xs text-amber-700 leading-relaxed">{game.expertNotes}</p>
          </div>
        </div>
      )}

      {/* Cevap Anahtarı */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAnswers((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors"
        >
          Cevap Anahtarı
          {showAnswers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showAnswers && (
          <div className="p-4 space-y-1.5 bg-white">
            {pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-5 shrink-0 font-semibold text-zinc-400">{pair.id ?? i + 1}.</span>
                <span className="font-medium text-zinc-800">{pair.cardA}</span>
                <span className="text-zinc-400">→</span>
                <span>{pair.cardB}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
