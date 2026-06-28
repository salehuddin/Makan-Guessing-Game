FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web
COPY packages/mobile/package.json ./packages/mobile/package.json

RUN pnpm install --frozen-lockfile

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @guesseat/shared build \
    && pnpm --filter @guesseat/web build

FROM nginx:alpine

COPY packages/web/.docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]