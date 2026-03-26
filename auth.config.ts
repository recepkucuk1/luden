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
      const isPublic = path === "/" || path.startsWith("/verify-email");

      if (isApiAuth) return true;
      if (isPublic) return true;
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      // Askıya alınmış kullanıcıyı oturumu kapat
      if ((auth?.user as { role?: string })?.role === "suspended") {
        return Response.redirect(new URL("/api/auth/signout", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Providers auth.ts'te tanımlanır
};
