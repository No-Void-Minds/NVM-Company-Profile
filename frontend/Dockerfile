FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite reads these at build time. An empty value hides the link on the site.
ARG VITE_SHOPEE_URL=
ARG VITE_TIKTOK_SHOP_URL=
ARG VITE_INSTAGRAM_URL=
# Makes canonical and hreflang URLs absolute. Empty keeps them root relative.
ARG VITE_PUBLIC_BASE_URL=
ENV VITE_SHOPEE_URL=$VITE_SHOPEE_URL
ENV VITE_TIKTOK_SHOP_URL=$VITE_TIKTOK_SHOP_URL
ENV VITE_INSTAGRAM_URL=$VITE_INSTAGRAM_URL
ENV VITE_PUBLIC_BASE_URL=$VITE_PUBLIC_BASE_URL
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
