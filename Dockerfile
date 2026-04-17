FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/
RUN npm install

COPY packages/client ./packages/client
COPY packages/server ./packages/server
RUN npm run build


FROM node:20-alpine

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/dist ./dist
COPY --from=build /app/packages/server/data ./data
COPY --from=build /app/packages/client/dist ./public

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
