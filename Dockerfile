# 1. Base image for building the app
FROM node:20-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy dependency definitions
COPY package.json package-lock.json* ./

# 4. Install dependencies
RUN npm ci

# 5. Copy all necessary app files (except ones in .dockerignore)
COPY . .

# 6. Build the Next.js app
RUN npm run build

# ------------------------------------------------------

# 7. Final image: only the production build
FROM node:20-alpine AS runner

# 8. Set working directory
WORKDIR /app

# 9. Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 10. Copy built output and other needed assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env.local ./

# 11. Set environment variables (optional)
ENV NODE_ENV=production

# 12. Expose port (matches `next start`)
EXPOSE 3000

# 13. Start the server
CMD ["npx", "next", "start"]

