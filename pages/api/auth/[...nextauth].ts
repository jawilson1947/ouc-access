import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials")
}

if (!process.env.ADMIN_EMAIL) {
  throw new Error("Missing ADMIN_EMAIL environment variable")
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable")
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email;
        return {
          id: "1",
          email,
          name: email.split('@')[0],
          isAdmin: email === process.env.ADMIN_EMAIL
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT, user: any, account: any }) {
      if (user) {
        token.email = user.email
        token.isAdmin = user.email === ADMIN_EMAIL
      }
      return token
    },
    async session({ session, token }: { session: any, token: JWT }) {
      if (session.user) {
        session.user.email = token.email
        session.user.isAdmin = token.isAdmin
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      return "/access-request"
    }
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions) 