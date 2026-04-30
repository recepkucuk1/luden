import { Sidebar } from "@/components/poster/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="poster-scope flex min-h-screen w-full" style={{ background: "var(--poster-bg)", color: "var(--poster-ink)" }}>
      <Sidebar />
      <main id="main-content" className="flex-1 w-full flex flex-col pt-16 md:pt-0 h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
