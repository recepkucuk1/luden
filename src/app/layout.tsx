import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#023435",
};

export const metadata: Metadata = {
  title: "LudenLab — AI Destekli Öğrenme Kartı Üreticisi",
  description: "Dil, konuşma ve işitme uzmanları için AI destekli öğrenme kartı üreticisi.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LudenLab",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${jakarta.variable} antialiased`}>
        {/*
          Blocking inline script — JS yüklenmeden önce çalışır, FOUC'u önler.
          localStorage'daki tercih yoksa sistem dark mode'una uyar.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('luden-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <ThemeProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster position="bottom-right" duration={3000} richColors />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
