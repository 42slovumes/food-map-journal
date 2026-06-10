from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .meta_views import PresetsView
from .views import CategoryViewSet, MapViewSet, PlaceViewSet

router = DefaultRouter()
router.register("maps", MapViewSet, basename="map")
router.register("categories", CategoryViewSet, basename="category")
router.register("places", PlaceViewSet, basename="place")

urlpatterns = [
    path("meta/presets/", PresetsView.as_view(), name="presets"),
    path("", include(router.urls)),
]
