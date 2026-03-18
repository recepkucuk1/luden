"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PREDEFINED_SPECIALTIES = ["speech-therapist", "audiologist", "speech-audiology"];

const SPECIALTY_OPTIONS = [
  { value: "speech-therapist", label: "Dil ve Konuşma Terapisti" },
  { value: "audiologist", label: "Odyolog" },
  { value: "speech-audiology", label: "Odyoloji ve Konuşma Bozuklukları Uzmanı" },
  { value: "other", label: "Diğer" },
];

export default function ProfilePage() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setName(data.therapist.name);
        const specialties: string[] = data.therapist.specialty ?? [];
        const predefined = specialties.filter((s) => PREDEFINED_SPECIALTIES.includes(s));
        const other = specialties.find((s) => !PREDEFINED_SPECIALTIES.includes(s)) ?? "";
        setSelectedSpecialties([...predefined, ...(other ? ["other"] : [])]);
        setOtherText(other);
      } catch (err) {
        console.error("Profil yüklenemedi:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    load();
  }, []);

  function toggleSpecialty(value: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const specialtyToSave = [
        ...selectedSpecialties.filter((s) => s !== "other"),
        ...(selectedSpecialties.includes("other") && otherText.trim() ? [otherText.trim()] : []),
      ];
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty: specialtyToSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileMsg({ type: "success", text: "Profil güncellendi." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Hata oluştu" });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordMsg({ type: "success", text: "Şifre başarıyla değiştirildi." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Hata oluştu" });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                TM
              </div>
              <span className="text-base font-bold text-zinc-900">TerapiMat</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-medium text-zinc-700">Profil</span>
          </div>
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Çıkış Yap
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <h1 className="text-xl font-bold text-zinc-900">Uzman Profili</h1>

        {profileLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Kişisel Bilgiler */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Kişisel Bilgiler</h2>
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">E-posta</Label>
                  <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    {session?.user?.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uzmanlık Alanı</Label>
                  <div className="space-y-2.5">
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <div key={opt.value}>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedSpecialties.includes(opt.value)}
                            onChange={() => toggleSpecialty(opt.value)}
                            className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                          />
                          <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                            {opt.label}
                          </span>
                        </label>
                        {opt.value === "other" && selectedSpecialties.includes("other") && (
                          <div className="ml-6 mt-2">
                            <Input
                              value={otherText}
                              onChange={(e) => setOtherText(e.target.value)}
                              placeholder="Uzmanlık alanınızı yazın"
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {profileMsg && (
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      profileMsg.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    )}
                  >
                    {profileMsg.text}
                  </div>
                )}

                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? "Kaydediliyor…" : "Kaydet"}
                </Button>
              </form>
            </div>

            {/* Şifre Değiştir */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Şifre Değiştir</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm font-medium">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Yeni Şifre Tekrar</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                {passwordMsg && (
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      passwordMsg.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    )}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <Button type="submit" disabled={passwordSaving} variant="outline">
                  {passwordSaving ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
                </Button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
