# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /workspace

ARG VITE_BACKEND_URL
ARG VITE_SOCKET_URL

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY apps/web/package*.json ./apps/web/
RUN npm --prefix apps/web ci --legacy-peer-deps

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /workspace/apps/web
RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM nginx:alpine

COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html
COPY --from=builder /workspace/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
