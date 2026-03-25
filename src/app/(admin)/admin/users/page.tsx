"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanType     = "FREE" | "PRO" | "ADVANCED" | "ENTERPRISE";
type BillingCycle = "MONTHLY" | "YEARLY";

interface Subscription {
  currentPeriodEnd: string;
  billingCycle:     BillingCycle;
}

interface UserRow {
  id:            string;
  name:          string;
  email:         string;
  specialty:     string[];
  role:          string;
  planType:      PlanType;
  credits:       number;
  studentLimit:  number;
  pdfEnabled:    boolean;
  suspended:     boolean;
  lastLogin:     string | null;
  createdAt:     string;
  subscriptions: Subscription[];
  _count:        { students: number; cards: number };
}

interface PlanCount {
  planType: PlanType;
  _count:   { _all: number };
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

const PLAN_INFO: Record<PlanType, { students: string; credits: string }> = {
  FREE:       { students: "2 öğrenci",   credits: "40 kredi"     },
  PRO:        { students: "200 öğrenci", credits: "2.000 kredi"  },
  ADVANCED:   { students: "Sınırsız",   credits: "10.000 kredi"  },
  ENTERPRISE: { students: "Sınırsız",   credits: "Özel"          },
};

const PLANS: PlanType[] = ["FREE", "PRO", "ADVANCED", "ENTERPRISE"];
const CREDIT_PRESETS    = [50, 100, 500, 1000, 2000];

function fmtDate(str: string | null | undefined) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function activeSub(u: UserRow): Subscription | null {
  return u.subscriptions?.[0] ?? null;
}

// ─── Manage Modal ─────────────────────────────────────────────────────────────

function ManageModal({
  user,
  onClose,
  onUpdate,
}: {
  user:     UserRow;
  onClose:  () => void;
  onUpdate: (patch: Partial<UserRow>) => void;
}) {
  const sub = activeSub(user);

  const [planType,     setPlanType]     = useState<PlanType>(user.planType);
  const [billing,      setBilling]      = useState<BillingCycle>(sub?.billingCycle ?? "YEARLY");
  const [creditAmount, setCreditAmount] = useState("");
  const [savingPlan,   setSavingPlan]   = useState(false);
  const [savingCredit, setSavingCredit] = useState(false);

  async function handleSavePlan() {
    if (planType === user.planType && billing === (sub?.billingCycle ?? "YEARLY")) {
      toast("Değişiklik yok");
      return;
    }
    setSavingPlan(true);
    try {
      const res  = await fetch(`/api/admin/users/${user.id}/plan`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planType, billingCycle: billing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Compute new subscription end for optimistic UI
      const periodEnd = new Date();
      if (billing === "YEARLY") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      onUpdate({
        planType,
        studentLimit:  data.user.studentLimit,
        pdfEnabled:    data.user.pdfEnabled,
        subscriptions: [{ currentPeriodEnd: periodEnd.toISOString(), billingCycle: billing }],
      });
      toast.success("Plan güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleAddCredit() {
    const n = parseInt(creditAmount);
    if (!n || n < 1) { toast.error("Geçerli bir miktar girin"); return; }
    setSavingCredit(true);
    try {
      const res  = await fetch(`/api/admin/users/${user.id}/credits`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate({ credits: data.user.credits });
      setCreditAmount("");
      toast.success(`${n} kredi eklendi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSavingCredit(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Üyelik Yönet</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* ── Plan Seçimi ── */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Plan</p>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanType(p)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    planType === p
                      ? "border-[#023435] bg-[#023435]/5"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", PLAN_BADGE[p])}>
                      {PLAN_LABEL[p]}
                    </span>
                    {planType === p && (
                      <span className="h-3.5 w-3.5 rounded-full bg-[#023435] flex items-center justify-center">
                        <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">{PLAN_INFO[p].students}</p>
                  <p className="text-[11px] text-zinc-400">{PLAN_INFO[p].credits}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Fatura Döngüsü ── */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Fatura Döngüsü</p>
            <div className="flex rounded-xl border border-zinc-200 p-0.5 w-fit">
              {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
                    billing === b ? "bg-[#023435] text-white" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {b === "MONTHLY" ? "Aylık" : "Yıllık"}
                </button>
              ))}
            </div>
            {sub && (
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Mevcut bitiş: {fmtDate(sub.currentPeriodEnd)}
              </p>
            )}
          </div>

          {/* ── Plan Kaydet ── */}
          <button
            onClick={handleSavePlan}
            disabled={savingPlan}
            className="w-full rounded-xl bg-[#023435] py-2.5 text-sm font-semibold text-white hover:bg-[#023435]/90 disabled:opacity-50 transition-colors"
          >
            {savingPlan ? "Kaydediliyor..." : "Planı Kaydet"}
          </button>

          <div className="border-t border-zinc-100" />

          {/* ── Kredi Ekle ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Kredi Ekle</p>
              <span className="text-xs text-zinc-500">Mevcut: <strong>{user.credits.toLocaleString("tr-TR")}</strong></span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CREDIT_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCreditAmount(String(n))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    creditAmount === String(n)
                      ? "bg-[#FE703A] text-white border-[#FE703A]"
                      : "border-zinc-200 text-zinc-600 hover:border-[#FE703A]/40 hover:text-[#FE703A]"
                  )}
                >
                  +{n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Özel miktar..."
                min={1}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30"
              />
              <button
                onClick={handleAddCredit}
                disabled={savingCredit || !creditAmount}
                className="rounded-xl bg-[#FE703A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FE703A]/90 disabled:opacity-50 transition-colors"
              >
                {savingCredit ? "..." : "Ekle"}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 px-5 py-3 flex justify-end">
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            Kapat
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
  onManage,
  onToggleRole,
  onToggleSuspend,
  onDelete,
}: {
  user:            UserRow;
  currentUserId:   string;
  onManage:        () => void;
  onToggleRole:    () => void;
  onToggleSuspend: () => void;
  onDelete:        () => void;
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
    <div className="relative flex items-center gap-1.5 justify-end" ref={ref}>
      {/* Yönet butonu — her zaman görünür */}
      <button
        onClick={onManage}
        className="rounded-lg border border-[#023435]/20 bg-[#023435]/5 px-2.5 py-1.5 text-xs font-semibold text-[#023435] hover:bg-[#023435]/10 transition-colors"
      >
        Yönet
      </button>

      {/* Diğer işlemler dropdown */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:bg-zinc-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-zinc-200 bg-white shadow-lg py-1.5 z-20">
          {!isSelf && (
            <>
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
          {isSelf && (
            <p className="px-4 py-2 text-xs text-zinc-400">Kendi hesabınız</p>
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

  const [manageUser, setManageUser] = useState<UserRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

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

  function updateUser(id: string, patch: Partial<UserRow>) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...patch } : u));
    // manageUser'ı da güncelle
    setManageUser((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  }

  async function handleToggleRole(user: UserRow) {
    const res  = await fetch(`/api/admin/users/${user.id}/role`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    updateUser(user.id, { role: data.user.role });
    toast.success(data.user.role === "admin" ? "Admin yapıldı" : "Admin yetkisi alındı");
  }

  async function handleToggleSuspend(user: UserRow) {
    const res  = await fetch(`/api/admin/users/${user.id}/suspend`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    updateUser(user.id, { suspended: data.user.suspended });
    toast.success(data.user.suspended ? "Hesap askıya alındı" : "Askı kaldırıldı");
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Hesap silindi");
    } else {
      toast.error((await res.json()).error);
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
          { label: "Toplam Kullanıcı", value: users.length,          color: "border-l-[#023435]", textColor: "text-[#023435]"  },
          { label: "Free",             value: planCount("FREE"),      color: "border-l-zinc-400",  textColor: "text-zinc-600"   },
          { label: "Pro",              value: planCount("PRO"),       color: "border-l-[#107996]", textColor: "text-[#107996]"  },
          { label: "Advanced",         value: planCount("ADVANCED"),  color: "border-l-[#FE703A]", textColor: "text-[#FE703A]"  },
        ].map((card) => (
          <div key={card.label} className={cn("rounded-xl border border-zinc-200 bg-white p-5 border-l-4", card.color)}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{card.label}</p>
            <p className={cn("mt-1 text-3xl font-bold", card.textColor)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tablo ── */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Üyelik Bitiş</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Öğrenci</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Son Giriş</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((u) => {
                const sub = activeSub(u);
                return (
                  <tr
                    key={u.id}
                    className={cn("transition-colors", u.suspended ? "bg-red-50/50" : "hover:bg-zinc-50")}
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
                      {sub && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {sub.billingCycle === "MONTHLY" ? "Aylık" : "Yıllık"}
                        </p>
                      )}
                    </td>

                    {/* Kredi */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-zinc-800">{u.credits.toLocaleString("tr-TR")}</span>
                    </td>

                    {/* Üyelik Bitiş */}
                    <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
                      {sub ? fmtDate(sub.currentPeriodEnd) : "—"}
                    </td>

                    {/* Öğrenci */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-zinc-700">{u._count.students}</span>
                      {u.studentLimit !== -1 && (
                        <span className="text-zinc-400 text-xs"> / {u.studentLimit}</span>
                      )}
                    </td>

                    {/* Son Giriş */}
                    <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
                      {fmtDate(u.lastLogin)}
                    </td>

                    {/* İşlemler */}
                    <td className="px-4 py-3.5">
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
                          onManage={() => setManageUser(u)}
                          onToggleRole={() => handleToggleRole(u)}
                          onToggleSuspend={() => handleToggleSuspend(u)}
                          onDelete={() => setConfirmDel(u.id)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}

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

      {/* ── Manage Modal ── */}
      {manageUser && (
        <ManageModal
          user={manageUser}
          onClose={() => setManageUser(null)}
          onUpdate={(patch) => updateUser(manageUser.id, patch)}
        />
      )}
    </div>
  );
}
