"""應用程式版本資訊。

預設值寫在這裡；部署時可用環境變數覆蓋（讓 CI/CD 在打包時注入），
不需改程式即可更新版本：
    APP_VERSION、APP_RELEASE_DATE、APP_GIT_SHA
"""
import os

# 版本與發佈日期（每次版更時更新這兩個值，或由部署環境變數覆蓋）
VERSION = "0.2.0"
RELEASE_DATE = "2026-06-10"


def get_version_info() -> dict:
    # 用 `or` 回退：環境變數為空字串時仍採用程式內預設值
    return {
        "version": os.environ.get("APP_VERSION") or VERSION,
        "released": os.environ.get("APP_RELEASE_DATE") or RELEASE_DATE,
        "commit": os.environ.get("APP_GIT_SHA") or "",
        "environment": os.environ.get("DJANGO_ENV") or "development",
    }
