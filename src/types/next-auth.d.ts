import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    isAdmin: boolean
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email: string
    name: string
    isAdmin: boolean
  }
} 