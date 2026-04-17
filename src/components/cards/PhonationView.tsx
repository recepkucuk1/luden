import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb, Info, Eye, EyeOff } from "lucide-react";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GridCell {
  position: number;
  word: string;
  hasTargetSound: boolean;
  isLadder?: boolean;
  isSnake?: boolean;
  instruction?: string | null;
}

export interface PhonationGrid {
  rows: number;
  cols: number;
  cells: GridCell[];
}

export interface PhonationObject {
  name: string;
  hasTargetSound: boolean;
  description?: string;
}

export interface WordChainItem {
  order: number;
  word: string;
  connection?: string;
}

export interface PhonationActivityContent {
  title: string;
  activityType: "sound_hunt" | "bingo" | "snakes_ladders" | "word_chain" | "sound_maze";
  targetSounds: string[];
  difficulty: "easy" | "medium" | "hard";
  theme?: string;
  grid?: PhonationGrid | null;
  scene?: string | null;
  objects?: PhonationObject[] | null;
  wordChain?: WordChainItem[] | null;
  instructions?: string;
  expertNotes?: string;
  adaptations?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  sound_hunt:     "Ses Avı",
  bingo:          "Tombala",
  snakes_ladders: "Yılan Merdiven",
  word_chain:     "Kelime Zinciri",
  sound_maze:     "Ses Labirenti",
};

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  sound_hunt:     "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  bingo:          "bg-[#F4AE10]/15 text-amber-800 border-[#F4AE10]/30",
  snakes_ladders: "bg-green-50 text-green-700 border-green-200",
  word_chain:     "bg-purple-50 text-purple-700 border-purple-200",
  sound_maze:     "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard:   "bg-red-50 text-red-700 border-red-200",
};

// ─── Sub-views ────────────────────────────────────────────────────────────────

function SoundHuntView({ activity }: { activity: PhonationActivityContent }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const objects = Array.isArray(activity.objects) ? activity.objects : [];

  return (
    <div className="space-y-4">
      {activity.scene && (
        <div className="rounded-xl border border-[#107996]/20 bg-[#107996]/5 p-4">
          <p className="text-xs font-semibold text-[#107996] mb-1">Sahne</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{activity.scene}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-500">
            Nesneler <span className="text-zinc-400 font-normal">({objects.length} nesne)</span>
          </p>
          <button
            type="button"
            onClick={() => setShowAnswers((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showAnswers ? "Cevapları Gizle" : "Cevapları Göster"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {objects.map((obj, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border-2 p-3 text-center transition-colors",
                showAnswers && obj.hasTargetSound
                  ? "border-[#107996] bg-[#107996]/10"
                  : showAnswers && !obj.hasTargetSound
                  ? "border-zinc-200 bg-zinc-50 opacity-50"
                  : "border-dashed border-zinc-300 bg-white"
              )}
            >
              <p className="text-sm font-semibold text-zinc-800">{obj.name}</p>
              {obj.description && (
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{obj.description}</p>
              )}
              {showAnswers && obj.hasTargetSound && (
                <span className="mt-1 inline-block text-[10px] font-semibold text-[#107996]">✓ Hedef ses</span>
              )}
            </div>
          ))}
        </div>
        {!showAnswers && (
          <p className="mt-2 text-[11px] text-zinc-400 text-center">
            Hedef sesi içeren nesneleri bulun, ardından cevapları gösterin.
          </p>
        )}
      </div>
    </div>
  );
}

function BingoView({ activity }: { activity: PhonationActivityContent }) {
  const grid = activity.grid;
  if (!grid) return <p className="text-sm text-zinc-400">Tombala verisi bulunamadı.</p>;
  const cells = Array.isArray(grid.cells) ? grid.cells : [];
  const midPos = Math.ceil((grid.rows * grid.cols) / 2);

  return (
    <div>
      <div
        className="grid gap-1.5 mx-auto"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`, maxWidth: grid.cols * 90 }}
      >
        {cells.map((cell, i) => {
          const isMid = cell.position === midPos && grid.rows === grid.cols;
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border-2 p-2 flex items-center justify-center text-center min-h-[60px]",
                isMid
                  ? "border-[#F4AE10] bg-[#F4AE10]/20 text-amber-900 font-bold"
                  : "border-[#F4AE10]/40 bg-[#F4AE10]/5"
              )}
            >
              <span className={cn("text-xs font-semibold leading-snug", isMid ? "text-amber-800" : "text-zinc-800")}>
                {isMid ? "⭐ SES" : cell.word}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-zinc-400 text-center">
        {grid.rows}×{grid.cols} tombala kartı · Ortadaki yıldız kare serbesttir
      </p>
    </div>
  );
}

function SnakesLaddersView({ activity }: { activity: PhonationActivityContent }) {
  const grid = activity.grid;
  if (!grid) return <p className="text-sm text-zinc-400">Yılan Merdiven verisi bulunamadı.</p>;
  const cells = Array.isArray(grid.cells) ? grid.cells : [];
  const total = grid.rows * grid.cols;

  // Build board rows from bottom to top (snakes & ladders style)
  const rows: GridCell[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    const rowCells = cells.filter(
      (c) => c.position > r * grid.cols && c.position <= (r + 1) * grid.cols
    );
    // Alternate row direction
    rows.unshift((grid.rows - 1 - r) % 2 === 0 ? rowCells : [...rowCells].reverse());
  }

  return (
    <div>
      <div className="space-y-1">
        {rows.map((row, ri) => (
          <div key={ri} className={cn("grid gap-1", `grid-cols-${grid.cols}`)}>
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={cn(
                  "rounded-lg border p-1.5 text-center min-h-[52px] flex flex-col items-center justify-center",
                  cell.position === 1
                    ? "border-green-400 bg-green-50"
                    : cell.position === total
                    ? "border-[#F4AE10] bg-[#F4AE10]/20"
                    : cell.isLadder
                    ? "border-green-300 bg-green-50"
                    : cell.isSnake
                    ? "border-red-300 bg-red-50"
                    : "border-zinc-200 bg-white"
                )}
                style={grid.cols === 5 ? {} : { gridColumn: "span 1" }}
              >
                <span className="text-[9px] text-zinc-400 leading-none mb-0.5">{cell.position}</span>
                {cell.position === 1 && <span className="text-[10px]">🏁</span>}
                {cell.position === total && <span className="text-[10px]">🏆</span>}
                <span className="text-[10px] font-semibold text-zinc-800 leading-snug">{cell.word}</span>
                {cell.isLadder && <span className="text-[9px] text-green-600">↑ Merdiven</span>}
                {cell.isSnake && <span className="text-[9px] text-red-500">↓ Yılan</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-500 justify-center flex-wrap">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-100 border border-green-300 inline-block" /> Merdiven — doğru söylersen ilerle</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 border border-red-300 inline-block" /> Yılan — tekrar dene</span>
      </div>
    </div>
  );
}

function WordChainView({ activity }: { activity: PhonationActivityContent }) {
  const chain = Array.isArray(activity.wordChain) ? activity.wordChain : [];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max">
        {chain.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="rounded-lg border-2 border-purple-300 bg-purple-50 px-3 py-2.5 text-center min-w-[72px]">
              <span className="block text-[10px] font-semibold text-purple-400 mb-0.5">{item.order}</span>
              <span className="block text-sm font-bold text-purple-800">{item.word}</span>
              {item.connection && (
                <span className="block text-[9px] text-purple-500 leading-snug mt-0.5">{item.connection}</span>
              )}
            </div>
            {i < chain.length - 1 && (
              <span className="text-purple-300 text-lg font-light">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SoundMazeView({ activity }: { activity: PhonationActivityContent }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const grid = activity.grid;
  if (!grid) return <p className="text-sm text-zinc-400">Labirent verisi bulunamadı.</p>;
  const cells = Array.isArray(grid.cells) ? grid.cells : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-500">Labirent</p>
        <button
          type="button"
          onClick={() => setShowAnswers((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showAnswers ? "Yolu Gizle" : "Doğru Yolu Göster"}
        </button>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border-2 p-2 flex items-center justify-center text-center min-h-[56px] transition-colors",
              cell.position === 1
                ? "border-green-400 bg-green-50"
                : cell.position === cells.length
                ? "border-[#F4AE10] bg-[#F4AE10]/20"
                : showAnswers && cell.hasTargetSound
                ? "border-green-400 bg-green-50"
                : showAnswers && !cell.hasTargetSound
                ? "border-red-200 bg-red-50 opacity-60"
                : "border-dashed border-zinc-300 bg-white"
            )}
          >
            <div>
              {cell.position === 1 && <p className="text-[10px] text-green-600 mb-0.5">GİRİŞ</p>}
              {cell.position === cells.length && <p className="text-[10px] text-amber-600 mb-0.5">ÇIKIŞ</p>}
              <span className="text-xs font-semibold text-zinc-800">{cell.word}</span>
            </div>
          </div>
        ))}
      </div>
      {!showAnswers && (
        <p className="mt-2 text-[11px] text-zinc-400 text-center">
          Hedef sesi içeren kelimeleri takip ederek çıkışa ulaşın.
        </p>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function PhonationView({ activity }: { activity: PhonationActivityContent }) {
  const [showAnswers, setShowAnswers] = useState(false);

  const sounds = Array.isArray(activity.targetSounds) ? activity.targetSounds : [];

  return (
    <div className="space-y-5">
      {/* Başlık + badge'ler */}
      <div>
        <h2 className="text-lg font-bold text-[#023435] dark:text-foreground mb-3 leading-snug">{activity.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", ACTIVITY_TYPE_COLOR[activity.activityType] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
            {ACTIVITY_TYPE_LABEL[activity.activityType] ?? activity.activityType}
          </span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", DIFFICULTY_COLOR[activity.difficulty] ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
            {DIFFICULTY_LABEL[activity.difficulty] ?? activity.difficulty}
          </span>
          {sounds.map((s) => (
            <span key={s} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
              {s}
            </span>
          ))}
          {activity.theme && (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-500">
              {activity.theme}
            </span>
          )}
        </div>
      </div>

      {/* Aktivite türüne göre render */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        {activity.activityType === "sound_hunt" && (
          <SoundHuntView activity={activity} />
        )}
        {activity.activityType === "bingo" && (
          <BingoView activity={activity} />
        )}
        {activity.activityType === "snakes_ladders" && (
          <SnakesLaddersView activity={activity} />
        )}
        {activity.activityType === "word_chain" && (
          <WordChainView activity={activity} />
        )}
        {activity.activityType === "sound_maze" && (
          <SoundMazeView activity={activity} />
        )}
      </div>

      {/* Talimatlar */}
      {activity.instructions && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex gap-3">
          <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1">Nasıl Oynanır</p>
            <p className="text-sm text-zinc-700 leading-relaxed">{activity.instructions}</p>
          </div>
        </div>
      )}

      {/* Uyarlama */}
      {activity.adaptations && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1.5">Uyarlama Önerileri</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{activity.adaptations}</p>
        </div>
      )}

      {/* Uzman Notları */}
      {activity.expertNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">Uzman Notları</p>
            <p className="text-xs text-amber-700 leading-relaxed">{activity.expertNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
