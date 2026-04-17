"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type EarnedBadge } from "@/lib/badges";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TherapistProfile {
  id: string;
  name: string;
  email: string;
  specialty: string[];
  avatarUrl: string | null;
  institution: string | null;
  phone: string | null;
  experienceYears: string | null;
  certifications: string | null;
  preferences: UserPreferences | null;
  credits: number;
  planType: string;
  createdAt: string;
}

interface UserPreferences {
  defaultSessionDuration: string;
  defaultDifficulty: string;
  defaultTheme: string;
  showInstitutionLogo: boolean;
  emailNotifications: boolean;
}

interface UsageStats {
  thisMonth: { count: number; byToolType: Record<string, number> };
  lastMonth: { count: number };
  allTime: { byToolType: Record<string, number>; total: number };
  topToolThisMonth: string;
  students: number;
  last3Months: { month: string; count: number }[];
}

const SPECIALTY_OPTIONS = [
  { value: "speech-therapist", label: "Dil ve Konuşma Terapisti" },
  { value: "audiologist",      label: "Odyolog" },
  { value: "speech-audiology", label: "Odyoloji ve Konuşma Bozuklukları Uzmanı" },
  { value: "other",            label: "Diğer" },
];
const PREDEFINED_SPECIALTIES = ["speech-therapist", "audiologist", "speech-audiology"];

const EXPERIENCE_OPTIONS = [
  { value: "",    label: "Belirtmek istemiyorum" },
  { value: "0-1", label: "0–1 yıl" },
  { value: "1-3", label: "1–3 yıl" },
  { value: "3-5", label: "3–5 yıl" },
  { value: "5-10",label: "5–10 yıl" },
  { value: "10+", label: "10+ yıl" },
];

const DURATION_OPTIONS = ["20", "30", "40", "45", "60"];
const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard",   label: "Zor" },
];
const THEME_OPTIONS = [
  { value: "none",    label: "Tema yok" },
  { value: "animals", label: "Hayvanlar" },
  { value: "food",    label: "Yiyecekler" },
  { value: "nature",  label: "Doğa" },
  { value: "sports",  label: "Spor" },
  { value: "school",  label: "Okul" },
];

const TOOL_LABELS: Record<string, string> = {
  LEARNING_CARD:       "Öğrenme Kartı",
  SOCIAL_STORY:        "Sosyal Hikaye",
  ARTICULATION_DRILL:  "Artikülasyon",
  HOMEWORK_MATERIAL:   "Ev Ödevi",
  WEEKLY_PLAN:         "Haftalık Plan",
  SESSION_SUMMARY:     "Oturum Özeti",
  MATCHING_GAME:       "Kelime Eşleştirme",
  PHONATION_ACTIVITY:  "Sesletim",
  COMMUNICATION_BOARD: "İletişim Panosu",
};

const TOOL_COLORS: Record<string, string> = {
  LEARNING_CARD:       "#107996",
  SOCIAL_STORY:        "#F4AE10",
  ARTICULATION_DRILL:  "#FE703A",
  HOMEWORK_MATERIAL:   "#692137",
  WEEKLY_PLAN:         "#023435",
  SESSION_SUMMARY:     "#4f46e5",
  MATCHING_GAME:       "#059669",
  PHONATION_ACTIVITY:  "#db2777",
  COMMUNICATION_BOARD: "#7c3aed",
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Ücretsiz", PRO: "Pro", ADVANCED: "Gelişmiş", ENTERPRISE: "Kurumsal",
};

const DEFAULT_PREFS: UserPreferences = {
  defaultSessionDuration: "45",
  defaultDifficulty: "medium",
  defaultTheme: "none",
  showInstitutionLogo: false,
  emailNotifications: true,
};

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

function compressAndConvert(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SectionCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-400 mt-0.5 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#023435]/30",
        checked ? "bg-[#023435]" : "bg-zinc-200"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-4" : "translate-x-1"
      )} />
    </button>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();

  const [profile,  setProfile]  = useState<TherapistProfile | null>(null);
  const [stats,    setStats]    = useState<UsageStats | null>(null);
  const [badges,   setBadges]   = useState<EarnedBadge[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [name,            setName]            = useState("");
  const [selectedSpec,    setSelectedSpec]    = useState("");
  const [otherText,       setOtherText]       = useState("");
  const [institution,     setInstitution]     = useState("");
  const [phone,           setPhone]           = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [certifications,  setCertifications]  = useState("");
  const [profileSaving,   setProfileSaving]   = useState(false);

  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [avatarHover,  setAvatarHover]  = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [pwdSaving,   setPwdSaving]   = useState(false);

  const [prefs,       setPrefs]       = useState<UserPreferences>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes, bRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/profile/stats"),
          fetch("/api/stats/badges"),
        ]);
        const [pData, sData, bData] = await Promise.all([pRes.json(), sRes.json(), bRes.json()]);
        if (pRes.ok && pData.therapist) {
          const t: TherapistProfile = pData.therapist;
          setProfile(t);
          setName(t.name);
          setAvatarUrl(t.avatarUrl);
          setInstitution(t.institution ?? "");
          setPhone(t.phone ?? "");
          setExperienceYears(t.experienceYears ?? "");
          setCertifications(t.certifications ?? "");
          if (t.preferences) setPrefs({ ...DEFAULT_PREFS, ...t.preferences });
          const spec = t.specialty[0] ?? "";
          if (PREDEFINED_SPECIALTIES.includes(spec)) {
            setSelectedSpec(spec);
          } else if (spec) {
            setSelectedSpec("other");
            setOtherText(spec);
          }
        }
        if (sRes.ok) setStats(sData);
        if (bRes.ok) setBadges(bData.badges ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Sadece JPG, PNG veya WebP yükleyebilirsiniz"); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maksimum dosya boyutu 2MB"); return;
    }
    setAvatarSaving(true);
    try {
      const dataUrl = await compressAndConvert(file);
      setAvatarUrl(dataUrl);
      const r = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Profil fotoğrafı güncellendi");
    } catch {
      toast.error("Fotoğraf yüklenemedi");
    } finally {
      setAvatarSaving(false);
      e.target.value = "";
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const specialty =
        selectedSpec === "other" && otherText.trim()
          ? [otherText.trim()]
          : selectedSpec ? [selectedSpec] : [];
      const r = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, institution, phone, experienceYears, certifications }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Profil güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error("Yeni şifreler eşleşmiyor"); return; }
    setPwdSaving(true);
    try {
      const r = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Şifre güncellendi");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setPwdSaving(false);
    }
  }

  async function handlePrefsSave(e: React.FormEvent) {
    e.preventDefault();
    setPrefsSaving(true);
    try {
      const r = await fetch("/api/profile/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Tercihler kaydedildi");
    } catch {
      toast.error("Tercihler kaydedilemedi");
    } finally {
      setPrefsSaving(false);
    }
  }

  const displayName = name || session?.user?.name || "Kullanıcı";
  const specialtyLabel = selectedSpec === "other"
    ? otherText
    : SPECIALTY_OPTIONS.find(o => o.value === selectedSpec)?.label ?? "";

  const thisMonthCount = stats?.thisMonth.count ?? 0;
  const lastMonthCount = stats?.lastMonth.count ?? 0;
  const monthDiff      = thisMonthCount - lastMonthCount;
  const allTimeByType  = stats?.allTime.byToolType ?? {};
  const allTimeTotal   = stats?.allTime.total ?? 0;
  const topToolName    = stats?.topToolThisMonth
    ? (TOOL_LABELS[stats.topToolThisMonth] ?? stats.topToolThisMonth)
    : "—";

  const earnedCount = badges.filter(b => b.earned).length;

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div
          className="relative cursor-pointer"
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
          onClick={() => fileRef.current?.click()}
        >
          <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#023435] to-[#04595B] text-white text-3xl font-bold select-none">
                {getInitials(displayName)}
              </div>
            )}
          </div>
          <div className={cn(
            "absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/50 transition-opacity",
            avatarHover || avatarSaving ? "opacity-100" : "opacity-0"
          )}>
            {avatarSaving
              ? <Loader2 className="h-5 w-5 text-white animate-spin" />
              : <><Camera className="h-5 w-5 text-white mb-0.5" /><span className="text-[10px] text-white font-medium">Değiştir</span></>
            }
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFile} />
          <div className="text-center">
            <h1 className="text-xl font-bold text-zinc-900">{displayName}</h1>
            {specialtyLabel && (
              <span className="inline-block mt-1 rounded-full bg-[#023435]/10 px-3 py-0.5 text-xs font-medium text-[#023435] dark:text-foreground">
                {specialtyLabel}
              </span>
            )}
            {profile && (
              <div className="flex flex-col items-center mt-2 gap-2">
                <p className="text-xs text-zinc-500 font-medium">
                  {PLAN_LABELS[profile.planType] ?? profile.planType} Planı · <span className="text-[#FE703A] font-bold">{profile.credits} Kredi</span>
                </p>
                <Link
                  href="/subscription"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  Planı Yükselt / Aboneliği Yönet
                </Link>
              </div>
            )}
          </div>
      </div>

      {/* Kişisel Bilgiler */}
      <SectionCard title="Kişisel Bilgiler">
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Ad Soyad</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">E-posta</Label>
              <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">{session?.user?.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="institution" className="text-sm font-medium">Kurum / Merkez</Label>
              <Input id="institution" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Çalıştığınız kurum adı" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Telefon <span className="text-zinc-400 font-normal text-xs">(opsiyonel)</span></Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-sm font-medium">Deneyim Yılı</Label>
              <select
                id="experience"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certs" className="text-sm font-medium">Lisans / Sertifikalar <span className="text-zinc-400 font-normal text-xs">(opsiyonel)</span></Label>
            <textarea
              id="certs"
              rows={2}
              value={certifications}
              onChange={e => setCertifications(e.target.value)}
              placeholder="Lisans, yüksek lisans, sertifika bilgileri..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/30 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Uzmanlık Alanı</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPECIALTY_OPTIONS.map(opt => (
                <div key={opt.value}>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="specialty"
                      value={opt.value}
                      checked={selectedSpec === opt.value}
                      onChange={() => setSelectedSpec(opt.value)}
                      className="h-4 w-4 border-zinc-300 accent-[#023435]"
                    />
                    <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">{opt.label}</span>
                  </label>
                  {opt.value === "other" && selectedSpec === "other" && (
                    <div className="ml-6 mt-2">
                      <Input value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="Uzmanlık alanınızı yazın" className="text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={profileSaving}>
            {profileSaving ? "Kaydediliyor…" : "Bilgileri Kaydet"}
          </Button>
        </form>
      </SectionCard>

      {/* Kullanım İstatistikleri */}
      {stats && (
        <SectionCard title="Kullanım İstatistikleri" subtitle={`Toplam ${allTimeTotal} materyal üretildi`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Bu Ay</p>
              <p className="text-2xl font-bold text-[#023435] dark:text-foreground mt-1">{thisMonthCount}</p>
              <div className="flex items-center gap-1 mt-1">
                {monthDiff > 0
                  ? <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-[10px] text-green-600">+{monthDiff} geçen aya göre</span></>
                  : monthDiff < 0
                  ? <><TrendingDown className="h-3 w-3 text-red-400" /><span className="text-[10px] text-red-500">{monthDiff} geçen aya göre</span></>
                  : <><Minus className="h-3 w-3 text-zinc-300" /><span className="text-[10px] text-zinc-400">değişim yok</span></>
                }
              </div>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Kalan Kredi</p>
              <p className="text-2xl font-bold text-[#FE703A] mt-1">{profile?.credits ?? 0}</p>
              <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-200">
                <div className="h-1 rounded-full bg-[#FE703A]" style={{ width: `${Math.min(((profile?.credits ?? 0) / 200) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Aktif Öğrenci</p>
              <p className="text-2xl font-bold text-[#107996] mt-1">{stats.students}</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">En Çok Araç</p>
              <p className="text-sm font-bold text-zinc-700 mt-1 leading-tight">{topToolName}</p>
            </div>
          </div>

          {allTimeTotal > 0 && (
            <div className="space-y-2.5 mb-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Araç Dağılımı</p>
              {Object.entries(allTimeByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct   = Math.round((count / allTimeTotal) * 100);
                  const color = TOOL_COLORS[type] ?? "#9ca3af";
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-36 text-xs text-zinc-600 truncate shrink-0">{TOOL_LABELS[type] ?? type}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-16 text-right shrink-0">{count} (%{pct})</span>
                    </div>
                  );
                })}
            </div>
          )}

          {stats.last3Months.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Aylık Trend</p>
              <div className="flex gap-3">
                {stats.last3Months.map((m, i) => (
                  <div key={i} className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-center">
                    <p className="text-[10px] text-zinc-400 leading-tight">{m.month}</p>
                    <p className="text-xl font-bold text-zinc-700 mt-1">{m.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Rozetlerim */}
      {badges.length > 0 && (
        <SectionCard title="Rozetlerim" subtitle={`${earnedCount} / ${badges.length} rozet kazanıldı`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {badges.map(badge => (
              <div
                key={badge.id}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                  badge.earned
                    ? "border-[#023435]/20 bg-[#023435]/[0.06] shadow-sm"
                    : "border-zinc-100 bg-zinc-50 opacity-30 grayscale"
                )}
              >
                {badge.earned && (
                  <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#023435] text-white text-[9px] font-bold">
                    ✓
                  </div>
                )}
                <span className="text-4xl leading-none">{badge.emoji}</span>
                <div>
                  <p className={cn("text-[11px] font-semibold leading-tight", badge.earned ? "text-zinc-800" : "text-zinc-500")}>
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Tercihler */}
      <SectionCard title="Tercihler">
        <form onSubmit={handlePrefsSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Varsayılan Ders Süresi</Label>
              <select
                value={prefs.defaultSessionDuration}
                onChange={e => setPrefs(p => ({ ...p, defaultSessionDuration: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} dk</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Varsayılan Zorluk Seviyesi</Label>
              <select
                value={prefs.defaultDifficulty}
                onChange={e => setPrefs(p => ({ ...p, defaultDifficulty: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Varsayılan Tema</Label>
              <select
                value={prefs.defaultTheme}
                onChange={e => setPrefs(p => ({ ...p, defaultTheme: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/30"
              >
                {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {([
              { key: "showInstitutionLogo" as const, label: "PDF'lerde Kurum Logosu Göster", desc: "İleride PDF çıktılarına kurum logosu eklensin" },
              { key: "emailNotifications"  as const, label: "E-posta Bildirimleri",          desc: "Haftalık özet e-postası al" },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-3.5">
                <div>
                  <p className="text-sm font-medium text-zinc-700">{label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={prefs[key] as boolean} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={prefsSaving}>
            {prefsSaving ? "Kaydediliyor…" : "Tercihleri Kaydet"}
          </Button>
        </form>
      </SectionCard>

      {/* Şifre Değiştir */}
      <SectionCard title="Şifre Değiştir">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPwd" className="text-sm font-medium">Mevcut Şifre</Label>
            <Input id="currentPwd" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPwd" className="text-sm font-medium">Yeni Şifre</Label>
              <Input id="newPwd" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="En az 8 karakter" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPwd" className="text-sm font-medium">Yeni Şifre Tekrar</Label>
              <Input id="confirmPwd" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
          </div>
          <Button type="submit" disabled={pwdSaving} variant="outline">
            {pwdSaving ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
          </Button>
        </form>
      </SectionCard>

    </main>
  );
}
