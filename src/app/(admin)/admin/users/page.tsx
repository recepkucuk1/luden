"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanType = "FREE" | "PRO" | "ADVANCED" | "ENTERPRISE";

interface UserRow {
  id: string;
  name: string;
  email: string;
  specialty: string[];
  role: string;
  planType: PlanType;
  credits: number;
  studentLimit: number;
  suspended: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: { students: number; cards: number };
}

interface PlanCount {
  planType: PlanType;
  _count: { _all: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<PlanType, string> = {
  FREE:       "bg-zinc-100 text-zinc-500 border-zinc-200",
  PRO:        "bg-[#107996]/10 text-[#107996] border-[#107996]/20",
  ADVANCED:   "bg-[#FE703A]/10 text-[#FE703A] border-[#FE703A]/20",
  ENTERPRISE: "bg-[#692137]/10 text-[#692137] border-[#692137]/20",
};

const PLAN_LABEL: Record<PlanType, string> = {
  FREE: "Free", PRO: "Pro", ADVANCED: "Advanced", ENTERPRISE: "Enterprise",
};

const PLANS: PlanType[] = ["FREE", "PRO", "ADVANCED", "ENTERPRISE"];

function fmtDate(str: string | null) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtLimit(n: number) {
  return n === -1 ? "∞" : String(n);
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function PlanModal({
  user,
  onClose,
  onSave,
}: {
  user: UserRow;
  onClose: () => void;
  onSave: (planType: PlanType) => void;
}) {
  const [selected, setSelected] = useState<PlanType>(user.planType);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Plan güncellendi");
      onSave(selected);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  const PLAN_INFO: Record<PlanType, { students: string; credits: string }> = {
    FREE:       { students: "2 öğrenci", credits: "40 kredi"     },
    PRO:        { students: "200 öğrenci", credits: "2.000 kredi" },
    ADVANCED:   { students: "Sınırsız", credits: "10.000 kredi"  },
    ENTERPRISE: { students: "Sınırsız", credits: "Özel"          },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Plan Değiştir</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          {PLANS.map((plan) => (
            <button
              key={plan}
              onClick={() => setSelected(plan)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                selected === plan
                  ? "border-[#023435] bg-[#023435]/5"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  PLAN_BADGE[plan]
                )}>
                  {PLAN_LABEL[plan]}
                </span>
                {selected === plan && (
                  <span className="h-4 w-4 rounded-full bg-[#023435] flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                {PLAN_INFO[plan].students} · {PLAN_INFO[plan].credits}
              </p>
            </button>
          ))}
        </div>

        <div className="border-t border-zinc-100 px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">İptal</button>
          <button
            onClick={handleSave}
            disabled={saving || selected === user.planType}
            className="rounded-xl bg-[#023435] px-4 py-2 text-sm font-semibold text-white hover:bg-[#023435]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditsModal({
  user,
  onClose,
  onSave,
}: {
  user: UserRow;
  onClose: () => void;
  onSave: (newCredits: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const PRESETS = [50, 100, 500, 1000, 2000];

  async function handleSave() {
    const n = parseInt(amount);
    if (!n || n < 1) { toast.error("Geçerli bir miktar girin"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${n} kredi eklendi`);
      onSave(data.user.credits);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Kredi Ekle</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{user.name} · Mevcut: {user.credits} kredi</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => setAmount(String(n))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  amount === String(n)
                    ? "bg-[#FE703A] text-white border-[#FE703A]"
                    : "border-zinc-200 text-zinc-600 hover:border-[#FE703A]/40 hover:text-[#FE703A]"
                )}
              >
                +{n}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Özel miktar</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Kredi miktarı..."
              min={1}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30"
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">İptal</button>
          <button
            onClick={handleSave}
            disabled={saving || !amount}
            className="rounded-xl bg-[#FE703A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  user,
  currentUserId,
  onChangePlan,
  onAddCredits,
  onToggleRole,
  onToggleSuspend,
  onDelete,
}: {
  user: UserRow;
  currentUserId: string;
  onChangePlan: () => void;
  onAddCredits: () => void;
  onToggleRole: () => void;
  onToggleSuspend: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSelf = user.id === currentUserId;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const item = "flex w-full items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        İşlemler ▾
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-zinc-200 bg-white shadow-lg py-1.5 z-20">
          <button
            onClick={() => { setOpen(false); onChangePlan(); }}
            className={cn(item, "text-zinc-700 hover:bg-zinc-50")}
          >
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Planı Değiştir
          </button>
          <button
            onClick={() => { setOpen(false); onAddCredits(); }}
            className={cn(item, "text-zinc-700 hover:bg-zinc-50")}
          >
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Kredi Ekle
          </button>

          {!isSelf && (
            <>
              <div className="my-1 border-t border-zinc-100" />
              <button
                onClick={() => { setOpen(false); onToggleRole(); }}
                className={cn(item, "text-zinc-700 hover:bg-zinc-50")}
              >
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {user.role === "admin" ? "Admin'den Çıkar" : "Admin Yap"}
              </button>
              <button
                onClick={() => { setOpen(false); onToggleSuspend(); }}
                className={cn(item, user.suspended ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50")}
              >
                <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={user.suspended
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  } />
                </svg>
                {user.suspended ? "Askıyı Kaldır" : "Hesabı Askıya Al"}
              </button>
              <div className="my-1 border-t border-zinc-100" />
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className={cn(item, "text-red-600 hover:bg-red-50")}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hesabı Sil
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [planCounts, setPlanCounts] = useState<PlanCount[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");

  // Modals
  const [planModal,    setPlanModal]    = useState<UserRow | null>(null);
  const [creditsModal, setCreditsModal] = useState<UserRow | null>(null);
  const [confirmDel,   setConfirmDel]   = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.replace("/login"); return; }
    if (session.user.role !== "admin") { router.replace("/dashboard"); return; }

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setPlanCounts(d.planCounts ?? []);
        setLoading(false);
      });
  }, [session, status, router]);

  function planCount(pt: PlanType) {
    return planCounts.find((p) => p.planType === pt)?._count._all ?? 0;
  }

  async function handleToggleRole(user: UserRow) {
    const res  = await fetch(`/api/admin/users/${user.id}/role`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: data.user.role } : u));
    toast.success(data.user.role === "admin" ? "Admin yapıldı" : "Admin yetkisi alındı");
  }

  async function handleToggleSuspend(user: UserRow) {
    const res  = await fetch(`/api/admin/users/${user.id}/suspend`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, suspended: data.user.suspended } : u));
    toast.success(data.user.suspended ? "Hesap askıya alındı" : "Askı kaldırıldı");
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Hesap silindi");
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
    setDeleting(false);
    setConfirmDel(null);
  }

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Üye Yönetimi</h1>
          <p className="mt-1 text-sm text-zinc-500">{users.length} kullanıcı kayıtlı</p>
        </div>
        <a
          href="/admin"
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Admin Panel
        </a>
      </div>

      {/* ── Özet kartlar ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Toplam Kullanıcı", value: users.length, color: "border-l-[#023435]", textColor: "text-[#023435]" },
          { label: "Free Plan",        value: planCount("FREE"),       color: "border-l-zinc-400",    textColor: "text-zinc-700" },
          { label: "Pro Plan",         value: planCount("PRO"),        color: "border-l-[#107996]",   textColor: "text-[#107996]" },
          { label: "Advanced Plan",    value: planCount("ADVANCED"),   color: "border-l-[#FE703A]",   textColor: "text-[#FE703A]" },
        ].map((card) => (
          <div key={card.label} className={cn("rounded-xl border border-zinc-200 bg-white p-5 border-l-4", card.color)}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{card.label}</p>
            <p className={cn("mt-1 text-3xl font-bold", card.textColor)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tablo ── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-800">Kullanıcılar</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad veya email ara..."
            className="w-60 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#023435]/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Ad / Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Kredi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Öğrenci</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Kayıt</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Son Giriş</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "transition-colors",
                    u.suspended ? "bg-red-50/50" : "hover:bg-zinc-50"
                  )}
                >
                  {/* Ad / Email */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-800">{u.name}</span>
                      {u.role === "admin" && (
                        <span className="rounded-full bg-[#023435] px-1.5 py-0.5 text-[10px] font-bold text-white">Admin</span>
                      )}
                      {u.suspended && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Askıda</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{u.email}</p>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", PLAN_BADGE[u.planType])}>
                      {PLAN_LABEL[u.planType]}
                    </span>
                  </td>

                  {/* Kredi */}
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-zinc-800">{u.credits.toLocaleString("tr-TR")}</span>
                    <span className="text-zinc-400 text-xs"> / {fmtLimit(u.studentLimit === -1 ? -1 : u.studentLimit)} öğr.</span>
                  </td>

                  {/* Öğrenci */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-zinc-700">{u._count.students}</span>
                    {u.studentLimit !== -1 && (
                      <span className="text-zinc-400 text-xs"> / {u.studentLimit}</span>
                    )}
                  </td>

                  {/* Kayıt */}
                  <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>

                  {/* Son Giriş */}
                  <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">{fmtDate(u.lastLogin)}</td>

                  {/* İşlemler */}
                  <td className="px-4 py-3.5 text-right">
                    {confirmDel === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setConfirmDel(null)} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">İptal</button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {deleting ? "Siliniyor…" : "Onayla"}
                        </button>
                      </div>
                    ) : (
                      <ActionDropdown
                        user={u}
                        currentUserId={session!.user!.id!}
                        onChangePlan={() => setPlanModal(u)}
                        onAddCredits={() => setCreditsModal(u)}
                        onToggleRole={() => handleToggleRole(u)}
                        onToggleSuspend={() => handleToggleSuspend(u)}
                        onDelete={() => setConfirmDel(u.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                    {search ? "Arama sonucu bulunamadı" : "Henüz kayıtlı kullanıcı yok"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {planModal && (
        <PlanModal
          user={planModal}
          onClose={() => setPlanModal(null)}
          onSave={(planType) => {
            setUsers((prev) => prev.map((u) => u.id === planModal.id ? { ...u, planType } : u));
            setPlanModal(null);
          }}
        />
      )}
      {creditsModal && (
        <CreditsModal
          user={creditsModal}
          onClose={() => setCreditsModal(null)}
          onSave={(newCredits) => {
            setUsers((prev) => prev.map((u) => u.id === creditsModal.id ? { ...u, credits: newCredits } : u));
            setCreditsModal(null);
          }}
        />
      )}
    </div>
  );
}
