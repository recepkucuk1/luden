import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TerapiMat — AI Destekli Öğrenme Kartı Üreticisi",
  description: "Dil, konuşma ve işitme uzmanları için AI destekli öğrenme kartı üreticisi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${jakarta.variable} antialiased`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster position="bottom-right" duration={3000} richColors />
      </body>
    </html>
  );
}
