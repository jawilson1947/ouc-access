import { authOptions } from "../config"
import NextAuth from "next-auth"

// Create and export the handler using the new Next.js 14 pattern
const handler = NextAuth(authOptions)

// Export the handler functions as async functions
export async function GET(request: Request) {
  return (handler as any)(request)
}

export async function POST(request: Request) {
  return (handler as any)(request)
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}