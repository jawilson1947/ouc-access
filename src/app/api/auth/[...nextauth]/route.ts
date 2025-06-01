import NextAuth from 'next-auth';
import { authOptions } from '../config';

// Create and export the handler directly
const handler = NextAuth(authOptions);

// Export the GET and POST functions
export { handler as GET, handler as POST };

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