import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

if (!process.env.ADMIN_EMAIL) {
  throw new Error('Missing ADMIN_EMAIL environment variable');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

console.log('🔧 Auth config loaded with ADMIN_EMAIL:', ADMIN_EMAIL);

export const authOptions: AuthOptions = {
  debug: true,
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
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials, req) {
        console.log('🔥 AUTHORIZE FUNCTION CALLED!');
        console.log('🔐 Credentials authorize called with:', {
          credentials,
          email: credentials?.email,
          hasEmail: !!credentials?.email,
          req: req ? 'present' : 'missing'
        });
        
        if (!credentials?.email) {
          console.log('❌ No email provided in credentials');
          return null;
        }
        
        console.log('✅ Credentials auth successful for email:', credentials.email);
        
        // Return a simple user object for non-Gmail authentication
        const user = {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email
        };
        
        console.log('👤 Returning user object:', user);
        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('✅ SignIn callback triggered:', {
        userEmail: user.email,
        userName: user.name,
        accountProvider: account?.provider,
        profileEmail: profile?.email
      });
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('🔑 JWT Callback triggered!');
      console.log('🔑 JWT Callback raw inputs:', {
        tokenEmail: token?.email,
        userEmail: user?.email,
        userName: user?.name,
        accountProvider: account?.provider
      });
      
      if (user) {
        // Ensure token has user's email and basic info
        token.email = user.email;
        token.name = user.name;
        token.id = user.id;
        
        const userEmail = user.email;
        const adminEmail = ADMIN_EMAIL;
        
        console.log('🔍 ADMIN CHECK COMPARISON:');
        console.log('  User Email:', JSON.stringify(userEmail));
        console.log('  Admin Email:', JSON.stringify(adminEmail));
        console.log('  User Email Type:', typeof userEmail);
        console.log('  Admin Email Type:', typeof adminEmail);
        console.log('  Emails Match (===):', userEmail === adminEmail);
        console.log('  Emails Match (==):', userEmail == adminEmail);
        console.log('  User Email Length:', userEmail?.length);
        console.log('  Admin Email Length:', adminEmail?.length);
        
        const isAdmin = userEmail === adminEmail;
        console.log('🔑 JWT Callback - Final Admin Result:', isAdmin);
        
        token.isAdmin = isAdmin;
        console.log('🔑 JWT Callback - Token after all assignments:', {
          email: token.email,
          name: token.name,
          id: token.id,
          isAdmin: token.isAdmin,
          isAdminType: typeof token.isAdmin
        });
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('🎟️ Session Callback triggered!');
      console.log('🎟️ Session Callback inputs:', {
        sessionUserEmail: session?.user?.email,
        tokenEmail: token?.email,
        tokenName: token?.name,
        tokenIsAdmin: token?.isAdmin,
        tokenIsAdminType: typeof token?.isAdmin
      });
      
      if (session.user && token) {
        // Ensure session has all user info from token
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.isAdmin = token.isAdmin || false;
        
        console.log('🎟️ Session Callback - Final session user:', {
          email: session.user.email,
          name: session.user.name,
          isAdmin: session.user.isAdmin,
          isAdminType: typeof session.user.isAdmin
        });
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
