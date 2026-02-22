# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine

RUN apk add --no-cache wget dumb-init \
  && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
RUN mkdir -p uploads && chown appuser:appgroup /app /app/uploads

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps \
  && rm -rf node_modules/@next node_modules/next \
  node_modules/@octokit node_modules/date-fns \
  node_modules/@img node_modules/@biomejs \
  node_modules/figlet node_modules/core-js \
  node_modules/@babel node_modules/prettier \
  node_modules/@modelcontextprotocol \
  node_modules/es-toolkit \
  && npm cache clean --force

COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

USER appuser

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["dumb-init", "node", "dist/server.js"]
