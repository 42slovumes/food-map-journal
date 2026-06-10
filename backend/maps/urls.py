from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .meta_views import PresetsView
from .views import CategoryViewSet, CollaboratorViewSet, MapViewSet, PlaceViewSet

router = DefaultRouter()
router.register("maps", MapViewSet, basename="map")
router.register("categories", CategoryViewSet, basename="category")
router.register("places", PlaceViewSet, basename="place")

# 巢狀：地圖共編者
collaborator_list = CollaboratorViewSet.as_view({"get": "list", "post": "create"})
collaborator_detail = CollaboratorViewSet.as_view(
    {"patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("meta/presets/", PresetsView.as_view(), name="presets"),
    path("maps/<int:map_pk>/collaborators/", collaborator_list, name="collaborator-list"),
    path(
        "maps/<int:map_pk>/collaborators/<int:pk>/",
        collaborator_detail,
        name="collaborator-detail",
    ),
    path("", include(router.urls)),
]
