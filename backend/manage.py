#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


def main():
    # 優先載入 repo 根目錄的 .env（單一來源同時驅動前後端），再讓 backend/.env 覆蓋
    root_env = Path(__file__).resolve().parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
    load_dotenv(override=True)
    env = os.environ.get("DJANGO_ENV", "development")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"config.settings.{env}")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
