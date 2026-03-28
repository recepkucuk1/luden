"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Users,
  CalendarDays,
  Layers,
  Wand2,
  ChevronDown,
  ChevronsRight,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  FileText,
  Mic,
  ClipboardList,
  NotebookPen,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS_SUB = [
  { title: "Öğrenme Kartı", href: "/generate",                Icon: BookOpen      },
  { title: "Sosyal Hikaye",  href: "/tools/social-story",     Icon: FileText      },
  { title: "Artikülasyon",   href: "/tools/articulation",     Icon: Mic           },
  { title: "Ev Ödevi",       href: "/tools/homework",          Icon: ClipboardList },
  { title: "Oturum Özeti",   href: "/tools/session-summary",  Icon: NotebookPen   },
  { title: "Kelime Eşleştirme", href: "/tools/matching-game", Icon: Puzzle        },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const toolsActive =
    pathname === "/tools" ||
    pathname.startsWith("/tools/") ||
    pathname === "/generate";

  const [toolsOpen, setToolsOpen] = useState(toolsActive);

  // Keep accordion open when navigating into tools area
  useEffect(() => {
    if (toolsActive) setToolsOpen(true);
  }, [toolsActive]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { icon: Home,       title: "Dashboard",  href: "/dashboard" },
    { icon: Users,      title: "Öğrenciler", href: "/students"  },
    { icon: Layers,     title: "Kütüphane",  href: "/cards"     },
    { icon: CalendarDays, title: "Takvim",   href: "/calendar"  },
  ];

  const adminItems = [
    { icon: Settings, title: "Admin Panel", href: "/admin/users" },
  ];

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 absolute top-0 left-0 right-0 z-50">
        <Logo size="small" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed md:sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out z-50 md:z-0",
          "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm",
          open ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <TitleSection open={open} userName={session?.user?.name || "Kullanıcı"} />

        <div className="space-y-1 mb-8 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar">
          {/* Dashboard */}
          <Option
            Icon={Home}
            title="Dashboard"
            href="/dashboard"
            currentPath={pathname}
            open={open}
          />

          {/* Araçlar accordion */}
          <div>
            <button
              onClick={() => { if (open) setToolsOpen((v) => !v); }}
              className={cn(
                "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
                toolsActive
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900"
              )}
            >
              <div className="grid h-full w-12 place-content-center">
                <Wand2 className="h-4 w-4" />
              </div>
              {open && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">Araçlar</span>
                  <ChevronDown
                    className={cn(
                      "mr-3 h-3.5 w-3.5 transition-transform duration-200 text-gray-400",
                      toolsOpen && "rotate-180"
                    )}
                  />
                </>
              )}
            </button>

            {/* Sub-items */}
            {open && toolsOpen && (
              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-3">
                <Link
                  href="/tools"
                  className={cn(
                    "flex h-8 items-center rounded-md px-2 text-xs font-medium transition-colors",
                    pathname === "/tools"
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Tüm Araçlar
                </Link>
                {TOOLS_SUB.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium transition-colors",
                      pathname === sub.href || pathname.startsWith(sub.href + "/")
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <sub.Icon className="h-3 w-3 shrink-0" />
                    {sub.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Remaining nav items */}
          {navItems.map((item) => (
            <Option
              key={item.href}
              Icon={item.icon}
              title={item.title}
              href={item.href}
              currentPath={pathname}
              open={open}
            />
          ))}

          {session?.user?.role === "admin" &&
            adminItems.map((item) => (
              <Option
                key={item.href}
                Icon={item.icon}
                title={item.title}
                href={item.href}
                currentPath={pathname}
                open={open}
              />
            ))}
        </div>

        {open && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1 absolute bottom-14 left-2 right-2 bg-white dark:bg-gray-900">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Hesap
            </div>
            <Option
              Icon={Settings}
              title="Profil"
              href="/profile"
              currentPath={pathname}
              open={open}
            />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="relative flex h-11 w-full items-center rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            >
              <div className="grid h-full w-12 place-content-center">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium transition-opacity duration-200 opacity-100">
                Çıkış Yap
              </span>
            </button>
          </div>
        )}

        <div className="hidden md:block">
          <ToggleClose open={open} setOpen={setOpen} />
        </div>
      </nav>
    </>
  );
};

interface OptionProps {
  Icon: React.ElementType;
  title: string;
  href: string;
  currentPath: string;
  open: boolean;
  notifs?: number;
}

const Option = ({ Icon, title, href, currentPath, open, notifs }: OptionProps) => {
  const isSelected = currentPath === href || currentPath.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
      )}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && (
        <span className={cn("text-sm font-medium transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
          {title}
        </span>
      )}
      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-xs text-white font-medium">
          {notifs}
        </span>
      )}
    </Link>
  );
};

const TitleSection = ({ open, userName }: { open: boolean; userName: string }) => {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 pt-2 md:pt-0">
      <Link
        href="/dashboard"
        className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className={cn("transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
              <div className="flex items-center gap-2">
                <div className="max-w-[130px]">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {userName}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Pro Plan</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />}
      </Link>
    </div>
  );
};

const Logo = ({ size = "normal" }: { size?: "small" | "normal" }) => {
  const dim = size === "small" ? "size-8" : "size-10";
  return (
    <div className={cn("grid shrink-0 place-content-center rounded-lg bg-gradient-to-br from-[#023435] to-[#04595B] shadow-sm", dim)}>
      <svg
        width={size === "small" ? "16" : "20"}
        height={size === "small" ? "12" : "16"}
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-white"
      >
        <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
        <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
      </svg>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={cn("h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400", open && "rotate-180")}
          />
        </div>
        {open && (
          <span className={cn("text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
            Daralt
          </span>
        )}
      </div>
    </button>
  );
};
