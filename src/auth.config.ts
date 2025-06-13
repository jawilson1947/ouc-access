import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { User } from "next-auth"

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials")
}

if (!process.env.ADMIN_EMAIL) {
  throw new Error("Missing ADMIN_EMAIL environment variable")
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable")
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error("Missing NEXTAUTH_URL environment variable")
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials): Promise<User | null> {
        try {
          if (!credentials?.email || typeof credentials.email !== 'string') {
            console.log("No email provided or not a string")
            return null
          }

          const email = credentials.email.toLowerCase().trim()
          console.log("Authorizing email:", email)

          // Check if it's the admin email
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim() || ''
          const isAdmin = email === adminEmail
          console.log("Is admin:", isAdmin)

          // Create a user object
          const user = {
            id: email,
            email: email,
            name: email.split('@')[0],
            isAdmin: isAdmin
          }

          console.log("Created user object:", user)
          return user
        } catch (error) {
          console.error("Error in authorize function:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.email = user.email
          token.name = user.name
          token.isAdmin = user.isAdmin
        }
        return token
      } catch (error) {
        console.error("Error in jwt callback:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.isAdmin = token.isAdmin as boolean
        }
        return session
      } catch (error) {
        console.error("Error in session callback:", error)
        return session
      }
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig 