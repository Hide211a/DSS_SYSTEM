FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

RUN npm ci -w backend --include-workspace-root

COPY backend ./backend

WORKDIR /app/backend
RUN cp prisma/schema.postgres.prisma prisma/schema.prisma
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src ./src
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/scripts ./scripts
COPY --from=build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/backend/node_modules/@prisma ./node_modules/@prisma

RUN npm install prisma@6.8.2 tsx@4.19.4 --omit=dev

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
