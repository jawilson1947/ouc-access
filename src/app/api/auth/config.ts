import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

const ADMIN_EMAIL = 'jawilson1947@gmail.com';

export const authOptions: AuthOptions = {
  // Set base URL explicitly for production
  url: process.env.NEXTAUTH_URL || (typeof window !== 'undefined' ? window.location.origin : undefined),
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
        
        // Return a simple user object for non-Gmail authentication
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      return !!user;
    },
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        token.accessToken = account?.access_token;
        token.isAdmin = user.email === ADMIN_EMAIL;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to access-request after successful authentication
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/access-request`;
      }
      
      // If url is the callback URL for access-request, use it
      if (url.includes('/access-request')) {
        return url;
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Handle absolute URLs starting with baseUrl
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default fallback to access-request instead of baseUrl
      return `${baseUrl}/access-request`;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
