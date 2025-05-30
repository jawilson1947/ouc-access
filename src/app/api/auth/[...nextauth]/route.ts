import NextAuth from 'next-auth';
import { authOptions } from '../config';

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };