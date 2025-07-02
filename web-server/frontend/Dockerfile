# syntax=docker/dockerfile:1

ARG NODE_VERSION=20

# Base image
FROM node:${NODE_VERSION} AS base
WORKDIR /app

# --- Build stage ---
FROM base AS builder
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/. .
COPY ../.env .env
RUN npm run build --verbose

# --- Run stage ---
FROM base AS runner
RUN npm install -g serve
COPY --from=builder /app/dist .
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80"]
