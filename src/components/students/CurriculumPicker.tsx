"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AREA_LABELS } from "@/lib/constants";

interface Curriculum {
  id: string;
  area: string;
  title: string;
}

interface CurriculumPickerProps {
  curricula: Curriculum[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  defaultOpenKey?: string; // Varsayılan açık accordion grubu (workArea değeri)
}

const TOP_GROUPS = [
  {
    key: "speech",
    label: "Konuşma",
    icon: "🗣️",
    areas: ["speech", "speech_sound", "motor_speech", "resonance", "voice"],
  },
  {
    key: "language",
    label: "Dil",
    icon: "📚",
    areas: ["language", "acquired_language"],
  },
  {
    key: "hearing",
    label: "İşitme",
    icon: "👂",
    areas: [
      "hearing", "hearing_language", "hearing_social", "hearing_learning",
      "hearing_literacy", "hearing_early_math", "hearing_math",
    ],
  },
];

export function CurriculumPicker({ curricula, selectedIds, onChange, defaultOpenKey }: CurriculumPickerProps) {
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKey ? [defaultOpenKey] : []);

  function toggleGroup(key: string) {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleId(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  if (curricula.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-zinc-700">
        Çalışma Modülleri{" "}
        <span className="text-zinc-400 font-normal">(isteğe bağlı)</span>
      </Label>

      <div className="rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
        {TOP_GROUPS.map((group) => {
          const subGroups = group.areas
            .map((area) => ({ area, list: curricula.filter((c) => c.area === area) }))
            .filter((g) => g.list.length > 0);

          if (subGroups.length === 0) return null;

          const allIds = subGroups.flatMap((g) => g.list.map((c) => c.id));
          const selectedCount = allIds.filter((id) => selectedIds.includes(id)).length;
          const isOpen = openKeys.includes(group.key);

          return (
            <div key={group.key}>
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                  isOpen ? "bg-zinc-50" : "bg-white hover:bg-zinc-50"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 leading-none">
                      {selectedCount} seçili
                    </span>
                  )}
                </span>
                <svg
                  className={cn("h-4 w-4 text-zinc-400 transition-transform", isOpen && "rotate-180")}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="bg-zinc-50 border-t border-zinc-100 px-3 pb-2 max-h-48 overflow-y-auto">
                  {subGroups.map(({ area, list }) => (
                    <div key={area} className="pt-2">
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                        {AREA_LABELS[area]}
                      </p>
                      {list.map((c) => (
                        <label key={c.id} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleId(c.id)}
                            className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                          />
                          <span className="text-sm text-zinc-700 group-hover:text-zinc-900">
                            {c.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
