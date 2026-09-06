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

# Las migraciones se aplican al arrancar: asi un despliegue nuevo levanta con
# el esquema al dia sin un paso manual.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
