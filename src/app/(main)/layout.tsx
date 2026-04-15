import { Sidebar } from "@/components/ui/dashboard-with-collapsible-sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900">
      <Sidebar />
      <div className="flex-1 w-full flex flex-col pt-16 md:pt-0 h-screen overflow-auto">
        {children}
      </div>
    </div>
  );
}
