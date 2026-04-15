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

  ChevronsRight,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.therapist?.avatarUrl) {
            setAvatarUrl(data.therapist.avatarUrl);
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.id]);

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
    { icon: Home,         title: "Dashboard",  href: "/dashboard"   },
    { icon: Wand2,        title: "Araçlar",    href: "/tools"       },
    { icon: Users,        title: "Öğrenciler", href: "/students"    },
    { icon: Layers,       title: "Kütüphane",  href: "/cards"       },
    { icon: CalendarDays, title: "Takvim",     href: "/calendar"    },
    { icon: CreditCard,   title: "Abonelik",   href: "/subscription"},
  ];

  const adminItems = [
    { icon: Settings, title: "Admin Panel", href: "/admin/users" },
  ];

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white absolute top-0 left-0 right-0 z-50">
        <Logo size="small" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
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
          "border-gray-200 bg-white p-2 shadow-sm",
          open ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <TitleSection open={open} userName={session?.user?.name || "Kullanıcı"} userImage={avatarUrl || session?.user?.image} />

        <div className="space-y-1 mb-8 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar">
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

        <div className="border-t border-gray-200 pt-4 pb-2 space-y-1 absolute bottom-14 left-2 right-2 bg-white">
          {open && (
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Hesap
            </div>
          )}
          <Option
            Icon={Settings}
            title="Profil"
            href="/profile"
            currentPath={pathname}
            open={open}
          />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="relative flex h-11 w-full items-center rounded-md transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
            title="Çıkış Yap"
          >
            <div className="grid h-full w-12 place-content-center">
              <LogOut className="h-4 w-4" />
            </div>
            {open && (
              <span className="text-sm font-medium transition-opacity duration-200 opacity-100">
                Çıkış Yap
              </span>
            )}
          </button>
        </div>


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
          ? "bg-[#023435]/10 text-[#023435] shadow-sm border-l-2 border-[#FE703A]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#FE703A] text-xs text-white font-medium">
          {notifs}
        </span>
      )}
    </Link>
  );
};

const TitleSection = ({ open, userName, userImage }: { open: boolean; userName: string; userImage?: string | null }) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4 pt-2 md:pt-0">
      <Link
        href="/dashboard"
        className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {userImage ? (
            <img src={userImage} alt={userName} className="size-10 rounded-xl object-cover shadow-sm bg-gray-100" />
          ) : (
            <Logo />
          )}
          {open && (
            <div className={cn("transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
              <div className="flex items-center gap-2">
                <div className="max-w-[130px]">
                  <span className="block text-sm font-semibold text-gray-900 truncate">
                    {userName}
                  </span>
                  <span className="block text-xs text-gray-500">Pro Plan</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={cn("h-4 w-4 transition-transform duration-300 text-gray-500", open && "rotate-180")}
          />
        </div>
        {open && (
          <span className={cn("text-sm font-medium text-gray-600 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}>
            Daralt
          </span>
        )}
      </div>
    </button>
  );
};
