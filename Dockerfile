FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma migrate deploy

RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/generated ./dist/generated
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]