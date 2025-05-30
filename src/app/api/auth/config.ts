import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

const ADMIN_EMAIL = 'jawilson1947@gmail.com';

export const authOptions: AuthOptions = {
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
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Error code passed in query string as ?error=
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        token.accessToken = account.access_token;
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
      // Only allow relative URLs or URLs matching the base URL
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 