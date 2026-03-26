"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurriculumPicker } from "@/components/students/CurriculumPicker";
import { cn } from "@/lib/utils";

const WORK_AREAS = [
  { value: "speech", label: "Konuşma", icon: "🗣️" },
  { value: "language", label: "Dil", icon: "📚" },
  { value: "hearing", label: "İşitme", icon: "👂" },
];

export interface StudentFormData {
  name: string;
  birthDate: string;
  workArea: string;
  diagnosis: string;
  notes: string;
  curriculumIds: string[];
}

interface StudentFormProps {
  initialValues?: Partial<StudentFormData>;
  curricula: { id: string; area: string; title: string }[];
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
  submitText?: string;
}

export function StudentForm({
  initialValues,
  curricula,
  onSubmit,
  onCancel,
  submitting,
  error,
  submitText = "Kaydet"
}: StudentFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate || "");
  const [workArea, setWorkArea] = useState(initialValues?.workArea || "speech");
  const [diagnosis, setDiagnosis] = useState(initialValues?.diagnosis || "");
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [curriculumIds, setCurriculumIds] = useState<string[]>(initialValues?.curriculumIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, birthDate, workArea, diagnosis, notes, curriculumIds });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium">Ad Soyad *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Öğrenci adı"
          autoFocus
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="birthDate" className="text-sm font-medium">Doğum Tarihi</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Çalışma Alanı *</Label>
        <div className="grid grid-cols-3 gap-2">
          {WORK_AREAS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWorkArea(w.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all text-xs font-medium",
                workArea === w.value
                  ? "border-[#023435] bg-[#023435]/5 text-[#023435]"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              )}
            >
              <span className="text-lg">{w.icon}</span>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <CurriculumPicker
        key={workArea}
        curricula={curricula}
        selectedIds={curriculumIds}
        onChange={setCurriculumIds}
        defaultOpenKey={workArea}
      />

      <div className="space-y-1.5">
        <Label htmlFor="diagnosis" className="text-sm font-medium">Tanı</Label>
        <Input
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Örn: Dil gelişim gecikmesi"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-sm font-medium">Notlar</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Öğrenci hakkında ek notlar..."
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Kaydediliyor…" : submitText}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          İptal
        </Button>
      </div>
    </form>
  );
}
