from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(_request):
    return JsonResponse({"status": "ok", "service": "food-map-journal-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="health"),
    path("api/", include("accounts.urls")),
    path("api/", include("maps.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
