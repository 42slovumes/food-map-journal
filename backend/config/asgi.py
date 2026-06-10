"""
ASGI 進入點：HTTP（Django/DRF）+ WebSocket（Channels 即時同步）。
"""
import os

from django.core.asgi import get_asgi_application

env = os.environ.get("DJANGO_ENV", "development")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"config.settings.{env}")

# 先初始化 Django（載入 app registry），再 import 會用到 models 的模組
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from maps.routing import websocket_urlpatterns  # noqa: E402
from maps.ws_auth import JWTAuthMiddleware  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
