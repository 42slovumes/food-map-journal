# ---- Backend：Django + DRF（uv 管理） ----
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # 把 venv 放在 /app 之外，避免 compose 掛載原始碼時被蓋掉
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# uv 二進位
COPY --from=ghcr.io/astral-sh/uv:0.8.2 /uv /usr/local/bin/uv

WORKDIR /app

# 先只複製相依定義，利用 layer cache
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-install-project --frozen 2>/dev/null || uv sync --no-install-project

COPY . .

EXPOSE 8000

# 預設啟動：等資料庫 → migrate →（開發環境）灌種子 → 開發伺服器
CMD ["sh", "entrypoint.sh"]
