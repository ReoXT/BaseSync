# Static Build Dockerfile for Railway
# Deploys pre-built server bundle from .wasp/build/server/bundle/

FROM node:22.12.0-alpine3.20 AS base
RUN apk --no-cache -U upgrade
RUN apk add --no-cache python3

ENV NODE_ENV=production
WORKDIR /app

# Copy package files first for better layer caching
COPY .wasp/build/server/package*.json ./server/
COPY package.json package-lock.json* ./

# Install root dependencies (includes Prisma)
RUN npm install --production

# Install server dependencies (includes dotenv)
WORKDIR /app/server
RUN npm install --production

# Copy the pre-built bundle
WORKDIR /app
COPY .wasp/build/server/bundle ./server/bundle
COPY .wasp/build/server/package*.json ./server/

# Copy database schema
COPY .wasp/build/db ./db

# Generate Prisma Client
WORKDIR /app/server
RUN npx prisma generate --schema=../db/schema.prisma

# Expose port
EXPOSE ${PORT}

# Start the pre-bundled server
CMD ["npm", "run", "start-production"]
