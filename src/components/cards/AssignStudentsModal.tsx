"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WORK_AREA_COLOR, WORK_AREA_LABEL } from "@/lib/constants";
import { WORK_AREA_COLOR, WORK_AREA_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ModalPortal } from "@/components/ui/modal-portal";

interface StudentOption {
  id: string;
  name: string;
  workArea: string;
}

interface Props {
  cardId: string;
  cardTitle: string;
  onClose: () => void;
  onSaved?: (assignedCount: number) => void;
}

export function AssignStudentsModal({ cardId, cardTitle, onClose, onSaved }: Props) {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, assignmentsRes] = await Promise.all([
          fetch("/api/students"),
          fetch(`/api/cards/${cardId}/assignments`),
        ]);
        if (!studentsRes.ok) throw new Error("Öğrenciler yüklenemedi");
        if (!assignmentsRes.ok) throw new Error("Atamalar yüklenemedi");
        const studentsData = await studentsRes.json();
        const assignmentsData = await assignmentsRes.json();

        setStudents(
          (studentsData.students ?? []).map((s: StudentOption) => ({
            id: s.id,
            name: s.name,
            workArea: s.workArea,
          }))
        );
        setSelected(new Set(assignmentsData.assignedStudentIds ?? []));
      } catch {
        toast.error("Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cardId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      toast.success(`${data.assignedCount} öğrenciye atandı`);
      onSaved?.(data.assignedCount);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Öğrenciye Ata</h2>
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[280px]">{cardTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-12">Henüz öğrenci eklenmedi.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 transition-colors has-[:checked]:border-[#023435]/30 has-[:checked]:bg-[#023435]/5">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 rounded border-zinc-300 accent-[#023435]"
                    />
                    <span className="flex-1 text-sm font-medium text-zinc-800">{s.name}</span>
                    <Badge className={WORK_AREA_COLOR[s.workArea] ?? "bg-zinc-100 text-zinc-600"} style={{ fontSize: "10px" }}>
                      {WORK_AREA_LABEL[s.workArea] ?? s.workArea}
                    </Badge>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">
            {selected.size} öğrenci seçildi
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
