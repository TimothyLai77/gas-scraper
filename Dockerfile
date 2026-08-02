FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9696
ENV CACHE_TTL=43200

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY public ./public
RUN mkdir -p data

EXPOSE 9696

CMD ["node", "dist/index.js"]
