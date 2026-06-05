# Good-Night 晚安体感 - Production Dockerfile
# 多阶段构建：编译前端 → 精简生产镜像

FROM node:20-alpine AS builder

WORKDIR /app

# 安装前端依赖并构建
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# 安装后端依赖（跳过原生串口模块）
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev --ignore-scripts || cd server && npm ci --omit=dev

# ========== 生产镜像 ==========
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

ENV NODE_ENV=production
ENV SKIP_SERIAL=true

EXPOSE 3001

CMD ["node", "server/src/index.js"]
