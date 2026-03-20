"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  name: string;
  email: string;
  specialty: string[];
  role: string;
  createdAt: string;
  _count: { students: number; cards: number };
}

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalCards: number;
}

const SPECIALTY_LABELS: Record<string, string> = {
  speech: "Akıcılık",
  language: "Dil",
  hearing: "İşitme",
};

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.replace("/login"); return; }
    if (session.user.role !== "admin") { router.replace("/dashboard"); return; }

    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]).then(([s, u]) => {
      setStats(s);
      setUsers(u.users ?? []);
      setLoading(false);
    });
  }, [session, status, router]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeletingId(null);
    setConfirmId(null);
    // Refresh stats
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#FE703A]/20 border-t-[#FE703A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-zinc-500">Sistem genelinde kullanıcı ve içerik yönetimi</p>
      </div>

      {/* Özet istatistikler */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 border-l-4 border-l-[#FE703A]">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Toplam Kullanıcı</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 border-l-4 border-l-[#023435]">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Toplam Öğrenci</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{stats.totalStudents}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 border-l-4 border-l-[#F4B2A6]">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Toplam Kart</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{stats.totalCards}</p>
          </div>
        </div>
      )}

      {/* Kullanıcılar tablosu */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Kullanıcılar</h2>
          <span className="text-xs text-zinc-400">{users.length} kullanıcı</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Uzmanlık</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kayıt</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Öğrenci</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kart</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => {
                const isNew = new Date(u.createdAt) >= sevenDaysAgo;
                return (
                  <tr key={u.id} className={isNew ? "bg-[#FE703A]/5" : "hover:bg-zinc-50"}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-800">{u.name}</span>
                        {isNew && (
                          <span className="rounded-full bg-[#FE703A] px-1.5 py-0.5 text-[10px] font-semibold text-white">Yeni</span>
                        )}
                        {u.role === "admin" && (
                          <span className="rounded-full bg-[#023435] px-1.5 py-0.5 text-[10px] font-semibold text-white">Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.specialty.map((s) => (
                          <span key={s} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                            {SPECIALTY_LABELS[s] ?? s}
                          </span>
                        ))}
                        {u.specialty.length === 0 && <span className="text-zinc-400 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-700 font-medium">{u._count.students}</td>
                    <td className="px-4 py-3.5 text-center text-zinc-700 font-medium">{u._count.cards}</td>
                    <td className="px-4 py-3.5 text-right">
                      {u.id !== session?.user?.id && (
                        confirmId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-zinc-500 hover:text-zinc-700"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingId === u.id ? "Siliniyor…" : "Onayla"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(u.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Sil
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
