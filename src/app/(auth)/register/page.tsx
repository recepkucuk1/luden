"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { AnimatedAuthPanel } from "@/components/auth/AnimatedAuthPanel";

const isDev = process.env.NODE_ENV === "development";

export default function RegisterPage() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    if (!isDev && !captchaToken) {
      setError("Lütfen CAPTCHA doğrulamasını tamamlayın.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, captchaToken }),
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Kayıt sırasında hata oluştu.");
      setLoading(false);
      return;
    }

    // Kayıt başarılı — email doğrulama sayfasına yönlendir
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  const isAnyPasswordVisible = (password.length > 0 && showPassword) || (passwordConfirm.length > 0 && showPasswordConfirm);
  const combinedPasswordLength = password.length > 0 ? password.length : passwordConfirm.length;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <AnimatedAuthPanel isTyping={isTyping} showPassword={isAnyPasswordVisible} passwordLength={combinedPasswordLength} />

      {/* Right Content Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white text-zinc-900">
        <div className="w-full max-w-sm">
          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.svg" alt="Luden" width={200} height={72} className="h-14 w-auto mx-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Hesap Oluştur</h1>
            <p className="mt-1 text-sm text-zinc-500">Luden&apos;a ücretsiz kaydol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Ad Soyad</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. Ayşe Yılmaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                autoComplete="name"
                className="h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ad@klinik.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                autoComplete="email"
                className="h-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-sm font-medium">Şifre Tekrar</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-10 pr-10 bg-white border-zinc-200 focus:border-[#023435] text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPasswordConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {!isDev && (
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ""}
                onVerify={setCaptchaToken}
                onError={(err) => console.error("[hCaptcha] error:", err)}
                onExpire={() => { console.warn("[hCaptcha] expired"); setCaptchaToken(null); }}
                ref={captchaRef}
                theme="light"
              />
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || (!isDev && !captchaToken)} className="w-full h-10 bg-[#023435] text-white hover:bg-[#023435]/90">
              {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-[#FE703A] hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
