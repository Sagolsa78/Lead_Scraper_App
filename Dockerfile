FROM node:20-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY backend/ .

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/config ./config
COPY --from=backend-builder /app/controllers ./controllers
COPY --from=backend-builder /app/middleware ./middleware
COPY --from=backend-builder /app/routes ./routes
COPY --from=backend-builder /app/services ./services
COPY --from=backend-builder /app/utils ./utils
COPY --from=backend-builder /app/workers ./workers
COPY --from=backend-builder /app/app.js ./
COPY --from=backend-builder /app/runAudit.js ./
# Copy built frontend client
COPY --from=frontend-builder /app/dist ../client/dist

EXPOSE 5005

RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'node app.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
