# www.binary.uz — Next.js `standalone`, bitta Node protsessi.
#
# Repo ildizidan yig'iladi: workspace paketlari (`packages/*`) manba holida
# keladi va Next ularni o'zi kompilyatsiya qiladi (transpilePackages).
#
#   docker compose -f deploy/docker-compose.yml up -d --build

FROM node:22-alpine AS build
WORKDIR /repo

# Brauzerga tushadigan qiymatlar — build paytida bundle ichiga yoziladi,
# ya'ni o'zgarsa qayta yig'ish kerak, restart yetmaydi.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TELEGRAM_BOT=$NEXT_PUBLIC_TELEGRAM_BOT \
    NEXT_TELEMETRY_DISABLED=1

# Server 2 yadro / 3.7 GB va unda boshqa loyihalar ishlaydi: Node heap
# chegaralanmasa, build xotirani yeb, OOM killer qo'shni konteynerni
# (masalan, Mongo'ni) o'ldirishi mumkin.
ENV NODE_OPTIONS=--max-old-space-size=1536

# package.json'lar alohida qatlamda: kod o'zgarganda `npm ci` qayta
# ishlamaydi.
COPY package.json package-lock.json ./
COPY apps/www/package.json apps/www/
COPY apps/admin/package.json apps/admin/
COPY packages/api/package.json packages/api/
COPY packages/session/package.json packages/session/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .
RUN npm run build --workspace @binary/www

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# `standalone` faqat server kodini va kerakli node_modules'ni beradi;
# statik fayllar va `public/` ni Next ataylab tashqarida qoldiradi.
COPY --from=build --chown=node:node /repo/apps/www/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/www/.next/static ./apps/www/.next/static
COPY --from=build --chown=node:node /repo/apps/www/public ./apps/www/public

USER node
EXPOSE 3000
CMD ["node", "apps/www/server.js"]
