import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function logError(tag: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`\n[${tag}] ${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
    const extra = error as unknown as Record<string, unknown>;
    if (extra.code) console.error(`  Prisma code: ${extra.code}`);
    if (extra.meta) console.error(`  Prisma meta:`, extra.meta);
  } else {
    console.error(`\n[${tag}]`, error);
  }
}

export function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

/**
 * Extract the first JSON object from a Claude (or any LLM) response.
 *
 * Accepts either a fenced ```json block or a bare `{ ... }` substring.
 * Throws on missing / unparseable JSON. Keep this as the single source of
 * truth so every tool route handles LLM JSON parsing the same way.
 */
export function extractJson(text: string): Record<string, unknown> {
  const jsonMatch =
    text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
    text.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("Claude yanıtından JSON çıkarılamadı");
  }

  try {
    return JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  } catch {
    throw new Error("JSON parse hatası");
  }
}
