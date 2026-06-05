FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Real production defaults: the GitHub "deploy from repository" trigger builds
# this Dockerfile directly WITHOUT --build-arg, so these defaults are what gets
# baked. (cloudbuild.yaml still overrides them via --build-arg when used.)
ARG VITE_PUBLIC_URL=https://app.gdgocbion.web.id/
ARG VITE_CATALOG_URL=https://app.gdgocbion.web.id/fe-catalog
ARG VITE_CART_URL=https://app.gdgocbion.web.id/fe-cart
# OTel collector base URL (same-origin /otel via the LB). Empty disables RUM.
ARG VITE_OTEL_URL=
ARG VITE_BUILD_ID=dev
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_CATALOG_URL=$VITE_CATALOG_URL \
    VITE_CART_URL=$VITE_CART_URL \
    VITE_OTEL_URL=$VITE_OTEL_URL \
    VITE_BUILD_ID=$VITE_BUILD_ID

RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
