import { authOptions } from "../config"
import NextAuth from "next-auth"

// Create and export the handler using the new Next.js 14 pattern
const handler = NextAuth(authOptions)

// Export the handler functions directly
export const GET = handler
export const POST = handler

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