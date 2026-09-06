# Build en dos etapas: la imagen final no lleva ni el codigo TypeScript ni las
# dependencias de desarrollo, solo lo necesario para ejecutar.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# ---------------------------------------------------------------- runtime
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Al arrancar: migraciones y datos de arranque, luego el servidor.
#
# El seed va aqui porque en el plan gratuito de Render el disco es efimero: la
# base de datos se pierde en cada reinicio y sin esto la tienda levantaria
# vacia (sin catalogo y sin la cuenta demo). Es idempotente y no toca el stock
# de los productos que ya existan, asi que repetirlo no rompe nada.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main.js"]
