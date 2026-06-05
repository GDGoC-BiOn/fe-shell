FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_PUBLIC_URL=https://app.example.com/
ARG VITE_CATALOG_URL=https://app.example.com/fe-catalog
ARG VITE_CART_URL=https://app.example.com/fe-cart
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_CATALOG_URL=$VITE_CATALOG_URL \
    VITE_CART_URL=$VITE_CART_URL

RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
