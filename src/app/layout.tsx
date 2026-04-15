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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${jakarta.variable} antialiased`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster position="bottom-right" duration={3000} richColors />
        <CookieBanner />
      </body>
    </html>
  );
}
