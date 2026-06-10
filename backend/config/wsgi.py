import os

from django.core.wsgi import get_wsgi_application

env = os.environ.get("DJANGO_ENV", "development")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"config.settings.{env}")

application = get_wsgi_application()
