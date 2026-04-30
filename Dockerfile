# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY smartbill-frontend/package*.json ./
RUN npm ci
COPY smartbill-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production

COPY smartbill-backend/package*.json ./
RUN npm ci --omit=dev

COPY smartbill-backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 4000
CMD ["node", "index.js"]
