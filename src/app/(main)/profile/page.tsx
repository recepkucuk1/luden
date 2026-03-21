"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type EarnedBadge } from "@/lib/badges";

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
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [otherText, setOtherText] = useState("");
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, badgesRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/stats/badges"),
        ]);
        const [profileData, badgesData] = await Promise.all([profileRes.json(), badgesRes.json()]);
        if (!profileRes.ok) throw new Error(profileData.error);
        setName(profileData.therapist.name);
        const specialties: string[] = profileData.therapist.specialty ?? [];
        const first = specialties[0] ?? "";
        if (PREDEFINED_SPECIALTIES.includes(first)) {
          setSelectedSpecialty(first);
        } else if (first) {
          setSelectedSpecialty("other");
          setOtherText(first);
        }
        if (badgesRes.ok) setBadges(badgesData.badges ?? []);
      } catch (err) {
        console.error("Profil yüklenemedi:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    load();
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const specialtyToSave =
        selectedSpecialty === "other" && otherText.trim()
          ? [otherText.trim()]
          : selectedSpecialty
          ? [selectedSpecialty]
          : [];
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty: specialtyToSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profil güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu, tekrar deneyin");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Şifre güncellendi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu, tekrar deneyin");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Uzman Profili</h1>

      {profileLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
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
                          type="radio"
                          name="specialty"
                          value={opt.value}
                          checked={selectedSpecialty === opt.value}
                          onChange={() => setSelectedSpecialty(opt.value)}
                          className="h-4 w-4 border-zinc-300 accent-[#023435]"
                        />
                        <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                          {opt.label}
                        </span>
                      </label>
                      {opt.value === "other" && selectedSpecialty === "other" && (
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

              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </form>
          </div>

          {/* Rozetlerim */}
          {badges.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Rozetlerim</h2>
              <p className="text-xs text-zinc-400 mb-5">
                {badges.filter((b) => b.earned).length} / {badges.length} rozet kazanıldı
              </p>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={`${badge.name}: ${badge.description}`}
                    className={[
                      "relative group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                      badge.earned
                        ? "border-[#FE703A]/30 bg-gradient-to-b from-[#FE703A]/5 to-white shadow-sm"
                        : "border-zinc-100 bg-zinc-50 opacity-40 grayscale",
                    ].join(" ")}
                  >
                    <span className="text-2xl leading-none">{badge.emoji}</span>
                    <p className={`text-[11px] font-semibold leading-tight ${badge.earned ? "text-zinc-800" : "text-zinc-500"}`}>
                      {badge.name}
                    </p>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 w-max max-w-[160px] rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center">
                      {badge.description}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-zinc-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  placeholder="En az 8 karakter"
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

              <Button type="submit" disabled={passwordSaving} variant="outline">
                {passwordSaving ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
              </Button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}
