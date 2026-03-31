"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";

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
  _count:        { students: number; cards: number; lessons: number };
  cardStats?:    Record<string, number>;
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

const TOOL_LABELS: Record<string, string> = {
  LEARNING_CARD: "Öğrenme Kartı",
  SOCIAL_STORY: "Sosyal Hikaye",
  ARTICULATION_DRILL: "Artikülasyon Alıştırması",
  HOMEWORK_MATERIAL: "Ev Ödevi Materyali",
  WEEKLY_PLAN: "Haftalık Plan",
  SESSION_SUMMARY: "Seans Özeti",
  MATCHING_GAME: "Eşleştirme Oyunu",
  PHONATION_ACTIVITY: "Fonasyon Aktivitesi",
  COMMUNICATION_BOARD: "İletişim Panosu",
};

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

type SortKey = "name" | "planType" | "credits" | "currentPeriodEnd" | "students" | "lastLogin" | "createdAt" | "cards" | "lessons";
type SortDir = "asc" | "desc";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [planCounts, setPlanCounts] = useState<PlanCount[]>([]);
  const [loading,    setLoading]    = useState(true);
  
  // Filters & Search
  const [search,       setSearch]       = useState("");
  const [filterPlan,   setFilterPlan]   = useState<PlanType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ADMIN" | "SUSPENDED">("ALL");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Modal State
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

  // 1. Dizeye Filtre Uygula
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (filterPlan !== "ALL") {
      result = result.filter((u) => u.planType === filterPlan);
    }

    if (filterStatus === "ADMIN") {
      result = result.filter((u) => u.role === "admin");
    } else if (filterStatus === "SUSPENDED") {
      result = result.filter((u) => u.suspended);
    }

    return result;
  }, [users, search, filterPlan, filterStatus]);

  // 2. Sırala
  const sortedUsers = useMemo(() => {
    return filteredUsers.sort((a, b) => {
      let valA: any = a[sortKey as keyof UserRow];
      let valB: any = b[sortKey as keyof UserRow];

      if (sortKey === "students") {
        valA = a._count.students;
        valB = b._count.students;
      } else if (sortKey === "cards") {
        valA = a._count.cards;
        valB = b._count.cards;
      } else if (sortKey === "lessons") {
        valA = a._count.lessons || 0;
        valB = b._count.lessons || 0;
      } else if (sortKey === "currentPeriodEnd") {
        valA = activeSub(a)?.currentPeriodEnd || "0000-00-00";
        valB = activeSub(b)?.currentPeriodEnd || "0000-00-00";
        if (a.role === "admin") valA = "9999-99-99"; // push admins to top/bottom
        if (b.role === "admin") valB = "9999-99-99";
      }

      if (valA === null) valA = "";
      if (valB === null) valB = "";

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortKey, sortDir]);

  // 3. Sayfalama
  const totalItems = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedUsers.slice(start, start + perPage);
  }, [sortedUsers, currentPage, perPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterPlan, filterStatus, perPage]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc"); // Defaults to descending when switching keys
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortDir === "asc" 
      ? <ChevronUp className="ml-1 h-3 w-3 text-[#FE703A]" /> 
      : <ChevronDown className="ml-1 h-3 w-3 text-[#FE703A]" />;
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="h-10 w-10 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-full flex-1 w-full flex flex-col relative overflow-y-auto custom-scrollbar bg-[#F0F4F4]"
      style={{ background: "linear-gradient(135deg, #f0f7f7 0%, #e8f4f4 50%, #f5fafa 100%)" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#107996]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#FE703A]/5 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 pb-12 relative z-10 flex-1 flex flex-col space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#023435] tracking-tight">Gelişmiş Yönetim</h1>
            <p className="mt-1 text-sm text-[#023435]/60">Sistemdeki tüm kayıtlı {users.length} terapist ve kullanıcıyı yönetin.</p>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-md px-5 py-2.5 text-sm font-bold text-[#023435] hover:bg-white/80 hover:-translate-y-0.5 transition-all"
          >
            ← Admin Panele Dön
          </a>
        </div>

        {/* ── Özet kartlar ── */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: "Toplam Kullanıcı", value: users.length,          color: "border-l-[#023435]", textColor: "text-[#023435]"  },
            { label: "Free",             value: planCount("FREE"),      color: "border-l-zinc-400",  textColor: "text-zinc-600"   },
            { label: "Pro",              value: planCount("PRO"),       color: "border-l-[#107996]", textColor: "text-[#107996]"  },
            { label: "Advanced",         value: planCount("ADVANCED"),  color: "border-l-[#FE703A]", textColor: "text-[#FE703A]"  },
          ].map((card) => (
            <div key={card.label} className={cn("rounded-[20px] border border-white/60 bg-white/40 shadow-[0_4px_24px_rgba(2,52,53,0.03)] backdrop-blur-md p-5 border-l-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(2,52,53,0.08)]", card.color)}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#023435]/50">{card.label}</p>
              <p className={cn("mt-1.5 text-3xl font-extrabold", card.textColor)}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── FİLTRELEME & ARAMA ÇUBUĞU ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 rounded-[20px] border border-white/60 bg-white/60 shadow-sm backdrop-blur-md p-4">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023435]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya email ile arayın..."
              className="w-full rounded-xl border border-white/40 bg-white/60 pl-10 pr-4 py-2 text-sm text-[#023435] placeholder:text-[#023435]/40 focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30 focus:bg-white transition-all shadow-inner"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#023435]/40" />
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value as any)}
                className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30 appearance-none font-medium cursor-pointer"
              >
                <option value="ALL">Tüm Planlar</option>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ADVANCED">Advanced</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30 appearance-none font-medium cursor-pointer"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ADMIN">Sadece Adminler</option>
              <option value="SUSPENDED">Askıya Alınanlar</option>
            </select>
            
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-[#023435] focus:outline-none focus:ring-2 focus:ring-[#FE703A]/30 appearance-none font-medium cursor-pointer"
            >
              <option value={10}>10 Göster</option>
              <option value={20}>20 Göster</option>
              <option value={50}>50 Göster</option>
              <option value={100}>100 Göster</option>
            </select>
          </div>
        </div>

        {/* ── Tablo Alanı ── */}
        <div className="rounded-[24px] border border-white/80 bg-white/70 shadow-[0_8px_32px_rgba(2,52,53,0.04)] backdrop-blur-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#023435]/5 bg-white/40">
                  <th 
                    className="text-left px-5 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="flex items-center">Ad / Email <SortIcon columnKey="name" /></div>
                  </th>
                  <th 
                    className="text-left px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("planType")}
                  >
                    <div className="flex items-center">Plan <SortIcon columnKey="planType" /></div>
                  </th>
                  <th 
                    className="text-left px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("credits")}
                  >
                    <div className="flex items-center">Kredi <SortIcon columnKey="credits" /></div>
                  </th>
                  <th 
                    className="text-left px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("currentPeriodEnd")}
                  >
                    <div className="flex items-center">Üyelik Bitiş <SortIcon columnKey="currentPeriodEnd" /></div>
                  </th>
                  <th 
                    className="text-center px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("cards")}
                  >
                    <div className="flex items-center justify-center">Materyal <SortIcon columnKey="cards" /></div>
                  </th>
                  <th 
                    className="text-center px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("students")}
                  >
                    <div className="flex items-center justify-center">Öğrenci <SortIcon columnKey="students" /></div>
                  </th>
                  <th 
                    className="text-center px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("lessons")}
                  >
                    <div className="flex items-center justify-center">Randevu <SortIcon columnKey="lessons" /></div>
                  </th>
                  <th 
                    className="text-left px-4 py-4 text-xs font-bold text-[#023435]/60 uppercase tracking-widest cursor-pointer hover:bg-white/50 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort("lastLogin")}
                  >
                    <div className="flex items-center">Son Giriş <SortIcon columnKey="lastLogin" /></div>
                  </th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#023435]/5 bg-white/20">
                {paginatedUsers.map((u) => {
                  const sub = activeSub(u);
                  return (
                    <tr
                      key={u.id}
                      className={cn("transition-all duration-200 group", u.suspended ? "bg-red-50/50 hover:bg-red-50/80" : "hover:bg-white/60")}
                    >
                      {/* Ad / Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#023435]">{u.name}</span>
                          {u.role === "admin" && (
                            <span className="rounded-md bg-[#023435] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-sm">ADMIN</span>
                          )}
                          {u.suspended && (
                            <span className="rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-red-600 shadow-sm">ASKIDA</span>
                          )}
                        </div>
                        <p className="text-xs text-[#023435]/50 mt-1 font-medium">{u.email}</p>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-4">
                        <span className={cn("rounded-lg border px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase", PLAN_BADGE[u.planType])}>
                          {PLAN_LABEL[u.planType]}
                        </span>
                        {sub && (
                          <p className="text-[10px] text-[#023435]/40 mt-1.5 font-bold uppercase tracking-wider">
                            {sub.billingCycle === "MONTHLY" ? "AYLIK" : "YILLIK"}
                          </p>
                        )}
                      </td>

                      {/* Kredi */}
                      <td className="px-4 py-4">
                        <span className="font-extrabold text-[#023435] tabular-nums bg-white/60 border border-white px-2 py-1 rounded-md shadow-sm drop-shadow-sm">
                          {u.credits.toLocaleString("tr-TR")}
                        </span>
                      </td>

                      {/* Üyelik Bitiş */}
                      <td className="px-4 py-4 text-[13px] font-medium text-[#023435]/70 whitespace-nowrap tabular-nums">
                        {sub ? fmtDate(sub.currentPeriodEnd) : "—"}
                      </td>

                      {/* Materyal */}
                      <td className="px-4 py-4 text-center">
                        <div className="group/tooltip relative inline-block cursor-help">
                          <span className="font-extrabold text-[#023435] tabular-nums bg-[#107996]/10 px-2 py-1 rounded-md border border-[#107996]/20 transition-all group-hover/tooltip:bg-[#107996]/20">
                            {u._count.cards}
                          </span>
                          {/* Tooltip Popup */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-1">
                            <div className="min-w-[200px] overflow-hidden rounded-xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-xl">
                              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#023435]/50 border-b border-[#023435]/10 pb-1">
                                Kategori Dağılımı
                              </p>
                              {Object.keys(u.cardStats || {}).length === 0 ? (
                                <p className="text-xs font-medium text-[#023435]/60">Henüz materyal üretilmedi</p>
                              ) : (
                                <ul className="space-y-1.5 flex flex-col items-start w-full">
                                  {Object.entries(u.cardStats || {})
                                    .sort((a,b) => b[1] - a[1]) // highest first
                                    .map(([toolType, count]) => (
                                    <li key={toolType} className="flex items-center justify-between w-full text-xs gap-3">
                                      <span className="font-medium text-[#023435]/70 whitespace-nowrap">
                                        {TOOL_LABELS[toolType] || toolType}
                                      </span>
                                      <span className="font-extrabold text-[#107996] tabular-nums bg-[#107996]/10 px-1.5 rounded">
                                        {count}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Öğrenci */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-extrabold text-[#023435] tabular-nums">{u._count.students}</span>
                        {u.studentLimit !== -1 && (
                          <span className="text-[#023435]/40 text-xs font-bold"> / {u.studentLimit}</span>
                        )}
                      </td>

                      {/* Randevu */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-extrabold text-[#FE703A] tabular-nums bg-[#FE703A]/10 px-2 py-1 rounded-md border border-[#FE703A]/20">
                          {u._count.lessons || 0}
                        </span>
                      </td>

                      {/* Son Giriş */}
                      <td className="px-4 py-4 text-[13px] font-medium text-[#023435]/70 whitespace-nowrap tabular-nums">
                        {fmtDate(u.lastLogin)}
                      </td>

                      {/* İşlemler */}
                      <td className="px-4 py-4">
                        {confirmDel === u.id ? (
                          <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4">
                            <button onClick={() => setConfirmDel(null)} className="text-xs font-bold text-[#023435]/40 hover:text-[#023435] transition-colors bg-white/50 px-3 py-1.5 rounded-lg border border-white">İptal</button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={deleting}
                              className="rounded-lg bg-red-500 border border-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 transition-all"
                            >
                              {deleting ? "Siliniyor..." : "Sil Onayla"}
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

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm font-medium text-[#023435]/40 bg-white/30 backdrop-blur-sm">
                      {search || filterPlan !== "ALL" || filterStatus !== "ALL" 
                        ? "Girilen filtrelere uygun kullanıcı bulunamadı." 
                        : "Henüz kayıtlı kullanıcı yok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION CONTROLS ── */}
          {totalPages > 1 && (
            <div className="bg-white/40 border-t border-[#023435]/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-[#023435]/60">
                Toplam <span className="font-extrabold text-[#023435]">{totalItems}</span> kayıt · Sayfa {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-white/60 bg-white/60 text-[#023435] hover:bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    // Simple logic to show a few pages around current page
                    let pageNum = currentPage - 2 + i;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                       <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-sm font-bold transition-all border shadow-sm",
                          currentPage === pageNum 
                            ? "bg-[#023435] text-white border-[#023435]" 
                            : "bg-white/60 text-[#023435] border-white/60 hover:bg-white"
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-white/60 bg-white/60 text-[#023435] hover:bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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
