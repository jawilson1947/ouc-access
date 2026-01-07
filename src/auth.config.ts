import type { NextAuthOptions } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { User } from "next-auth"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials')
}

if (!ADMIN_EMAIL && !process.env.ADMIN_EMAILS && !process.env.NEXT_PUBLIC_ADMIN_EMAILS) {
  console.warn('⚠️ No ADMIN_EMAIL or ADMIN_EMAILS environment variable set. Admin access will be disabled.')
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable')
}

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
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
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const email = credentials.email
        return {
          id: "1",
          email,
          name: email.split('@')[0],
          isAdmin: isAdmin(email)
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.isAdmin = isAdmin(user.email)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email
        session.user.isAdmin = token.isAdmin
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
}

// Helper to check admin status
function isAdmin(email?: string | null) {
  if (!email) return false

  // Check ADMIN_EMAIL (single)
  if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) return true

  // Check ADMIN_EMAILS (comma-separated list)
  if (process.env.ADMIN_EMAILS) {
    const admins = process.env.ADMIN_EMAILS.split(',').map(e => e.trim())
    return admins.includes(email)
  }

  // Check NEXT_PUBLIC_ADMIN_EMAILS (frontend var, fallback)
  if (process.env.NEXT_PUBLIC_ADMIN_EMAILS) {
    const admins = process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim())
    return admins.includes(email)
  }

  return false
} 