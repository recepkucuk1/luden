import type { NextAuthConfig } from "next-auth";

// Auth sayfaları — giriş yapmışsa dashboard'a yönlendir
const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Public path'ler — kimlik doğrulama gerektirmez
const PUBLIC_PATHS = [
  "/",
  "/verify-email",
  "/privacy",
  "/delivery-return",
  "/cookie-policy",
  "/terms",
  "/about",
];

// Middleware'de çalışacak hafif config — Node.js modülü import etmez
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
      const isApiAuth = path.startsWith("/api/auth");
      const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

      if (isApiAuth) return true;
      if (isPublic) return true;
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      return true;
    },
  },
  providers: [], // Providers auth.ts'te tanımlanır
};
