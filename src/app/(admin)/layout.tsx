import { AppHeader } from "@/components/AppHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      {children}
    </div>
  );
}
