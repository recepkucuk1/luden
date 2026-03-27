import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SocialStoryPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#107996]">
          Yakında
        </p>
        <h1 className="mb-3 text-2xl font-bold text-[#023435]">Sosyal Hikaye Üretici</h1>
        <p className="mb-8 text-sm text-zinc-500">Bu araç yakında aktif olacak.</p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Araçlara Dön
        </Link>
      </div>
    </div>
  );
}
