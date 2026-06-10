from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.utils import timezone

from .version import get_version_info

API_PREFIX = "api/v1/"


def healthcheck(_request):
    """輕量存活檢查（簡單 ok）。"""
    return JsonResponse({"status": "ok", "service": "food-map-journal-api"})


def healthz(_request):
    """詳細健康檢查：版本、發佈日期、commit、環境、時間。

    供 k8s/VM liveness/readiness 探針與版更除錯使用。
    """
    info = get_version_info()
    return JsonResponse(
        {
            "status": "ok",
            "service": "food-map-journal-api",
            **info,
            "time": timezone.now().isoformat(),
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    # 健康檢查（不分版本，方便探針固定路徑）
    path("healthz/", healthz, name="healthz"),
    path("api/v1/healthz/", healthz, name="healthz_v1"),
    path("api/v1/health/", healthcheck, name="health"),
    # API v1
    path(API_PREFIX, include("accounts.urls")),
    path(API_PREFIX, include("maps.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
