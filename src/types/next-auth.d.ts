import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import 'next-auth'

declare module 'next-auth' {
  interface User {
    isAdmin?: boolean
  }

  interface Session {
    user: {
      isAdmin?: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?: boolean
  }
} 