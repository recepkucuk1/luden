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
          });

          if (!therapist) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            therapist.password
          );

          if (!isValid) return null;

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
      // token.role varsa kullan; yoksa (eski token) DB'den çek
      if (token?.role) {
        session.user.role = token.role as string;
      } else if (token?.id) {
        const therapist = await prisma.therapist.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        session.user.role = therapist?.role ?? "user";
      } else {
        session.user.role = "user";
      }
      return session;
    },
  },
});
