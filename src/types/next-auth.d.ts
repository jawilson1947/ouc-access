import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    isAdmin: boolean
    image?: string
    accessToken?: string
  }

  interface Session {
    user?: {
      email?: string
      name?: string
      image?: string
      accessToken?: string
      isAdmin?: boolean
    }
    expires: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email: string
    name: string
    isAdmin: boolean
  }
} 