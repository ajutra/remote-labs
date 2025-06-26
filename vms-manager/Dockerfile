# syntax=docker/dockerfile:1

ARG GO_VERSION=1.23
ARG ALPINE_VERSION=3.22

FROM golang:${GO_VERSION} AS base
WORKDIR /vms-manager

# --- Build stage ---
FROM base AS builder
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o vms-manager

# --- Run stage ---
FROM alpine:${ALPINE_VERSION} AS runner
WORKDIR /vms-manager
COPY --from=builder /vms-manager/vms-manager ./vms-manager
COPY .env ./
EXPOSE 8000
CMD ["./vms-manager"]
