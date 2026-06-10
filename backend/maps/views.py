import math

from django.db.models import Count
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Category, Map, Place
from .permissions import IsOwner
from .serializers import CategorySerializer, MapSerializer, PlaceSerializer

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    """兩個座標間的球面距離（公里）。"""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


class MapViewSet(viewsets.ModelViewSet):
    serializer_class = MapSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        return (
            Map.objects.filter(owner=self.request.user)
            .annotate(
                categories_count=Count("categories", distinct=True),
                places_count=Count("categories__places", distinct=True),
            )
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsOwner]
    filterset_fields = ["map", "is_public", "is_collaborative"]
    search_fields = ["name", "description"]
    ordering_fields = ["sort_order", "created_at", "updated_at", "name"]

    def get_queryset(self):
        return (
            Category.objects.filter(map__owner=self.request.user)
            .annotate(places_count=Count("places", distinct=True))
            .order_by("sort_order", "id")
        )

    def perform_create(self, serializer):
        map_obj = serializer.validated_data.get("map")
        if map_obj is None or map_obj.owner != self.request.user:
            raise ValidationError({"map": "找不到地圖或非本人擁有。"})
        serializer.save(owner=self.request.user)


class PlaceViewSet(viewsets.ModelViewSet):
    serializer_class = PlaceSerializer
    permission_classes = [IsOwner]
    filterset_fields = ["category", "status"]
    search_fields = ["name", "address", "note"]
    ordering_fields = ["created_at", "updated_at", "rating", "name"]

    def get_queryset(self):
        qs = Place.objects.filter(category__map__owner=self.request.user).select_related(
            "category", "category__map", "created_by"
        )
        map_id = self.request.query_params.get("map")
        if map_id:
            qs = qs.filter(category__map_id=map_id)
        return qs

    def filter_queryset(self, queryset):
        # 先套用標準 filter/search/ordering，再做附近搜尋（會覆蓋排序，依距離由近到遠）
        queryset = super().filter_queryset(queryset)
        return self._apply_nearby(queryset)

    def _apply_nearby(self, qs):
        """支援 ?lat=&lng=&radius=：先用 bounding box 粗篩，再用 haversine 精算與排序。"""
        params = self.request.query_params
        lat, lng = params.get("lat"), params.get("lng")
        if lat is None or lng is None:
            return qs
        try:
            lat, lng = float(lat), float(lng)
        except ValueError:
            raise ValidationError({"lat/lng": "必須是數字。"})
        try:
            radius = float(params.get("radius", 5))  # 預設 5 公里
        except ValueError:
            raise ValidationError({"radius": "必須是數字。"})

        # bounding box 粗篩（避免對全表做 haversine）
        lat_delta = radius / 111.0
        lng_delta = radius / (111.0 * max(math.cos(math.radians(lat)), 0.01))
        qs = qs.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=lat - lat_delta,
            latitude__lte=lat + lat_delta,
            longitude__gte=lng - lng_delta,
            longitude__lte=lng + lng_delta,
        )

        nearby = []
        for place in qs:
            d = haversine_km(lat, lng, place.latitude, place.longitude)
            if d <= radius:
                place.distance_km = d
                nearby.append(place)
        nearby.sort(key=lambda p: p.distance_km)
        return nearby

    def perform_create(self, serializer):
        category = serializer.validated_data.get("category")
        if category is None or category.map.owner != self.request.user:
            raise ValidationError({"category": "找不到分類或非本人擁有。"})
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
