"""開發環境設定：debug 開、CORS 寬鬆、方便本機開發。"""
from .base import *  # noqa: F401,F403
from .base import CORS_ALLOWED_ORIGINS

DEBUG = True

# 本機開發允許所有 localhost 來源
CORS_ALLOW_ALL_ORIGINS = True
INTERNAL_IPS = ["127.0.0.1"]

# 開發環境用 console 寄信
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
