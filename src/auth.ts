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
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
