from rest_framework import serializers

from .models import Category, Map, Place


class PlaceSerializer(serializers.ModelSerializer):
    map = serializers.IntegerField(source="map_id", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    created_by_name = serializers.CharField(source="created_by.display_name", read_only=True)
    # 附近搜尋時動態附帶（公里），平時為 None
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            "id",
            "category",
            "category_name",
            "category_color",
            "category_icon",
            "map",
            "name",
            "address",
            "latitude",
            "longitude",
            "google_maps_url",
            "google_place_id",
            "status",
            "rating",
            "recommend_level",
            "tags",
            "note",
            "want_reason",
            "experience_note",
            "cover_photo",
            "created_by",
            "created_by_name",
            "updated_by",
            "created_at",
            "updated_at",
            "distance_km",
        ]
        read_only_fields = [
            "id",
            "google_maps_url",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def get_distance_km(self, obj):
        value = getattr(obj, "distance_km", None)
        return round(value, 2) if value is not None else None


class CategorySerializer(serializers.ModelSerializer):
    places_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "map",
            "name",
            "description",
            "color",
            "icon",
            "is_public",
            "is_collaborative",
            "sort_order",
            "places_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "places_count", "created_at", "updated_at"]


class MapSerializer(serializers.ModelSerializer):
    categories_count = serializers.IntegerField(read_only=True)
    places_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Map
        fields = [
            "id",
            "name",
            "description",
            "emoji",
            "is_public",
            "categories_count",
            "places_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "categories_count", "places_count", "created_at", "updated_at"]
