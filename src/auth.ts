import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "../auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const therapist = await prisma.therapist.findUnique({
            where: { email: credentials.email as string },
            select: { id: true, email: true, name: true, password: true, role: true, suspended: true },
          });

          if (!therapist) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            therapist.password
          );

          if (!isValid) return null;

          if (therapist.suspended) return null;

          // Son giriş tarihini kaydet
          await prisma.therapist.update({
            where: { id: therapist.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: therapist.id,
            email: therapist.email,
            name: therapist.name,
            role: therapist.role,
          };
        } catch (error) {
          console.error("[auth] authorize hatası:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      if (!token?.id) { session.user.role = "user"; return session; }

      const therapist = await prisma.therapist.findUnique({
        where: { id: token.id as string },
        select: { role: true, suspended: true },
      });

      // Askıya alınmış kullanıcının oturumunu sonlandır
      if (!therapist || therapist.suspended) {
        // null döndürmek mümkün değil ama boş session döndürerek istemciyi logout'a zorla
        session.user.id = "";
        session.user.role = "suspended";
        return session;
      }

      session.user.role = therapist.role ?? "user";
      return session;
    },
  },
});
