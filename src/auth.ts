import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      name: string;
      isAdmin: boolean;
    };
  }
}

export const { auth, signIn, signOut } = NextAuth(authConfig);

// Export the auth config for use in middleware
export { authConfig };
