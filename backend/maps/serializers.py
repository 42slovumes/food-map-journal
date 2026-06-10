from rest_framework import serializers

from .models import Category, Collaborator, Map, Place


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
    places_count = serializers.SerializerMethodField()

    def get_places_count(self, obj):
        # 清單查詢會用 annotate 帶入；廣播單一物件時退回即時計數
        val = getattr(obj, "places_count", None)
        return val if val is not None else obj.places.count()

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
    my_role = serializers.SerializerMethodField()
    collaborators_count = serializers.SerializerMethodField()
    owner = serializers.IntegerField(source="owner_id", read_only=True)
    owner_name = serializers.CharField(source="owner.display_name", read_only=True)
    is_shared = serializers.SerializerMethodField()
    share_token = serializers.SerializerMethodField()

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
            "collaborators_count",
            "my_role",
            "owner",
            "owner_name",
            "is_shared",
            "share_token",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "categories_count",
            "places_count",
            "collaborators_count",
            "my_role",
            "owner",
            "owner_name",
            "is_shared",
            "share_token",
            "created_at",
            "updated_at",
        ]

    def get_is_shared(self, obj):
        return obj.share_token is not None

    def get_share_token(self, obj):
        # 分享 token 只回給擁有者
        request = self.context.get("request")
        if request and obj.owner_id == getattr(request.user, "id", None) and obj.share_token:
            return str(obj.share_token)
        return None

    def get_my_role(self, obj):
        request = self.context.get("request")
        return obj.role_for(request.user) if request else None

    def get_collaborators_count(self, obj):
        # 列表查詢已 prefetch_related('collaborators') → len() 走記憶體不再 N+1；
        # 單一物件（如建立）未 prefetch 時 all() 會即時查詢一次。
        return len(obj.collaborators.all())


class CollaboratorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    avatar = serializers.SerializerMethodField()
    invited_by_name = serializers.CharField(source="invited_by.display_name", read_only=True)

    class Meta:
        model = Collaborator
        fields = [
            "id",
            "user_id",
            "email",
            "display_name",
            "avatar",
            "role",
            "invited_by_name",
            "created_at",
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        user = obj.user
        if user.avatar:
            request = self.context.get("request")
            url = user.avatar.url
            return request.build_absolute_uri(url) if request else url
        return user.avatar_url or None


class PublicCategorySerializer(serializers.ModelSerializer):
    """公開分享用的分類（只回展示欄位，不外洩 is_public/is_collaborative/map/owner）。"""

    places_count = serializers.SerializerMethodField()

    def get_places_count(self, obj):
        val = getattr(obj, "places_count", None)
        return val if val is not None else obj.places.count()

    class Meta:
        model = Category
        fields = ["id", "name", "description", "color", "icon", "sort_order", "places_count"]
        read_only_fields = fields


class RecommendationPlaceSerializer(serializers.ModelSerializer):
    """推薦用的精簡地點：保留卡片所需欄位，省略 want_reason/experience_note 等個人欄位。"""

    map = serializers.IntegerField(source="map_id", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    created_by_name = serializers.CharField(source="created_by.display_name", read_only=True)
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
            "status",
            "rating",
            "tags",
            "created_by_name",
            "distance_km",
        ]
        read_only_fields = fields

    def get_distance_km(self, obj):
        value = getattr(obj, "distance_km", None)
        return round(value, 2) if value is not None else None


class PublicPlaceSerializer(serializers.ModelSerializer):
    """公開分享用的精簡地點（不外洩建立者、想去原因、體驗等私人欄位）。"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)

    class Meta:
        model = Place
        fields = [
            "id",
            "category",
            "category_name",
            "category_color",
            "category_icon",
            "name",
            "address",
            "latitude",
            "longitude",
            "google_maps_url",
            "status",
            "rating",
            "tags",
            "note",
        ]
        read_only_fields = fields
