# syntax=docker/dockerfile:1

# ---- build: compile the Vite app ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY . .

# Vite inlines VITE_* variables at build time, so pass them as build args:
#   docker build --build-arg VITE_API_ORIGIN=https://api.example.com ...
ARG VITE_API_ORIGIN=http://localhost:3000
ARG VITE_MIDTRANS_CLIENT_KEY=
ARG VITE_MIDTRANS_IS_PRODUCTION=false
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN \
    VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY \
    VITE_MIDTRANS_IS_PRODUCTION=$VITE_MIDTRANS_IS_PRODUCTION

RUN yarn build

# ---- runtime: serve static files with nginx ----
FROM nginx:stable-alpine AS runtime

# The nginx image renders /etc/nginx/templates/*.template with envsubst on start,
# so the listen port follows $PORT (injected by most platforms).
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/" || exit 1
