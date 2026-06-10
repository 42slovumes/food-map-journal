"""
ASGI 進入點。

目前 MVP 階段僅服務 Django HTTP（DRF）。
第二階段加入即時同步時，可在此用 Channels 的 ProtocolTypeRouter
包進 WebSocket 路由（見 PROGRESS.md「未來擴充」）：

    from channels.routing import ProtocolTypeRouter, URLRouter
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(maps.routing.websocket_urlpatterns)),
    })
"""
import os

from django.core.asgi import get_asgi_application

env = os.environ.get("DJANGO_ENV", "development")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"config.settings.{env}")

application = get_asgi_application()
