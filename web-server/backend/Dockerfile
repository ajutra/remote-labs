# syntax=docker/dockerfile:1

ARG GO_VERSION=1.23
ARG ALPINE_VERSION=3.22

FROM golang:${GO_VERSION} AS base
WORKDIR /webserver

# --- Build stage ---
FROM base AS builder
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/. .
RUN CGO_ENABLED=0 GOOS=linux go build -o webserver-backend

# --- Run stage ---
FROM alpine:${ALPINE_VERSION} AS runner
WORKDIR /webserver
COPY --from=builder /webserver/webserver-backend ./webserver-backend
COPY .env ./.backend.env
EXPOSE 8080
CMD ["./webserver-backend"]