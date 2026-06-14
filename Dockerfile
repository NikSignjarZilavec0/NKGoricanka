# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 — build the React (Vite) client
###############################################################################
FROM node:20-alpine AS client-build
WORKDIR /app/client

# Install dependencies (cache-friendly: copy manifests first)
COPY client/package*.json ./
RUN npm ci

# Build the SPA
COPY client/ ./
RUN npm run build

###############################################################################
# Stage 2 — production server (Express serves the API + built client + uploads)
###############################################################################
FROM node:20-alpine AS server
WORKDIR /app/server
ENV NODE_ENV=production

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Server source
COPY server/ ./

# Bring in the built client from stage 1
COPY --from=client-build /app/client/dist ./client-dist

# Uploads directory (mounted as a volume in docker-compose so images persist)
RUN mkdir -p /app/server/uploads

EXPOSE 5000
CMD ["node", "src/index.js"]
