FROM node:24-alpine AS client-build

WORKDIR /build/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-alpine AS production-dependencies

WORKDIR /build/api
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies /build/api/node_modules ./node_modules
COPY package.json package-lock.json server.js ./
COPY api ./api
COPY scripts ./scripts
COPY src ./src
COPY --from=client-build /build/client/dist/hospital-client ./client/dist/hospital-client

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node scripts/migrate.js && exec node server.js"]
