# ---- Frontend：React + Vite（開發模式，hot reload） ----
FROM node:22-alpine

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app
RUN corepack enable

# 先裝相依，利用 layer cache（packageManager 欄位會讓 corepack 使用釘選的 pnpm 版本）
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

EXPOSE 5173

# --host 讓容器外可連入；envDir 指向掛載進來的 repo 根 .env
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
