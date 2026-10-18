# admin.binary.uz — statik eksport, serverda Node protsessi YO'Q.
#
# Bu image ishga tushirilmaydi: oxirgi bosqich faqat `out/` ni beradi va
# BuildKit uni to'g'ridan-to'g'ri diskka yozadi, nginx esa shu yerdan
# tarqatadi:
#
#   docker build -f deploy/admin.Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.binary.uz/api/v1 \
#     --output type=local,dest=/var/www/binary/admin.new .

FROM node:22-alpine AS build
WORKDIR /repo

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_TELEGRAM_BOT=$NEXT_PUBLIC_TELEGRAM_BOT \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1536

COPY package.json package-lock.json ./
COPY apps/www/package.json apps/www/
COPY apps/admin/package.json apps/admin/
COPY packages/api/package.json packages/api/
COPY packages/session/package.json packages/session/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .
RUN npm run build --workspace @binary/admin

FROM scratch
COPY --from=build /repo/apps/admin/out /
