import type { NextAuthConfig } from "next-auth";

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

      const isAuthPage = path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/forgot-password") || path.startsWith("/reset-password");
      const isApiAuth = path.startsWith("/api/auth");
      const isPublic = path === "/" || path.startsWith("/verify-email") || path.startsWith("/privacy") || path.startsWith("/delivery-return") || path.startsWith("/cookie-policy") || path.startsWith("/terms") || path.startsWith("/about");

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
