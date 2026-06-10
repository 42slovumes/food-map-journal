#!/bin/sh
set -e

# 等待資料庫就緒（Docker 內有設 POSTGRES_HOST 時）
if [ -n "$POSTGRES_HOST" ]; then
  echo "⏳ 等待資料庫 $POSTGRES_HOST:${POSTGRES_PORT:-5432} ..."
  python - <<'PY'
import os, time
import psycopg
for i in range(40):
    try:
        psycopg.connect(
            host=os.environ["POSTGRES_HOST"],
            port=os.environ.get("POSTGRES_PORT", "5432"),
            dbname=os.environ["POSTGRES_DB"],
            user=os.environ["POSTGRES_USER"],
            password=os.environ["POSTGRES_PASSWORD"],
        ).close()
        print("✅ 資料庫就緒")
        break
    except Exception as exc:
        print(f"  ...尚未就緒 ({i+1}/40): {exc}")
        time.sleep(1)
else:
    raise SystemExit("資料庫連線逾時")
PY
fi

echo "🔧 套用 migrations ..."
python manage.py migrate --noinput

if [ "${DJANGO_ENV:-development}" = "development" ]; then
  echo "🌱 灌入示範資料 ..."
  python manage.py seed_demo || true
fi

python manage.py collectstatic --noinput >/dev/null 2>&1 || true

echo "🚀 啟動後端伺服器 ..."
exec python manage.py runserver 0.0.0.0:8000
