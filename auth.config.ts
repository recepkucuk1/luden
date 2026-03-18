import type { NextAuthConfig } from "next-auth";

// Middleware'de çalışacak hafif config — Node.js modülü import etmez
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
      const isApiAuth = path.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      return true;
    },
  },
  providers: [], // Providers auth.ts'te tanımlanır
};
