import math

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .events import broadcast_event
from .models import ROLE_EDITOR, ROLE_VIEWER, Category, Collaborator, Map, Place
from .permissions import MapAccessPermission
from .serializers import (
    CategorySerializer,
    CollaboratorSerializer,
    MapSerializer,
    PlaceSerializer,
    PublicCategorySerializer,
    PublicPlaceSerializer,
    RecommendationPlaceSerializer,
)

User = get_user_model()

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
    permission_classes = [MapAccessPermission]

    def get_queryset(self):
        user = self.request.user
        return (
            Map.objects.filter(Q(owner=user) | Q(collaborators__user=user))
            .annotate(
                categories_count=Count("categories", distinct=True),
                places_count=Count("categories__places", distinct=True),
            )
            .distinct()
            .order_by("-updated_at")
        )

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post", "delete"])
    def share(self, request, pk=None):
        """產生 / 撤銷公開分享連結（owner 限定）。"""
        m = self.get_object()
        if not m.can_manage(request.user):
            raise PermissionDenied("只有擁有者可以管理分享連結。")
        if request.method == "POST":
            token = m.enable_share()
            return Response({"is_shared": True, "share_token": str(token)})
        m.disable_share()
        return Response({"is_shared": False, "share_token": None})


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [MapAccessPermission]
    filterset_fields = ["map", "is_public", "is_collaborative"]
    search_fields = ["name", "description"]
    ordering_fields = ["sort_order", "created_at", "updated_at", "name"]

    def get_queryset(self):
        user = self.request.user
        return (
            Category.objects.filter(
                Q(map__owner=user) | Q(map__collaborators__user=user)
            )
            .annotate(places_count=Count("places", distinct=True))
            .distinct()
            .order_by("sort_order", "id")
        )

    def perform_create(self, serializer):
        map_obj = serializer.validated_data.get("map")
        if map_obj is None or not map_obj.can_edit(self.request.user):
            raise PermissionDenied("沒有在這張地圖新增分類的權限。")
        cat = serializer.save(owner=self.request.user)
        broadcast_event(
            cat.map_id, "category.created", {"category": serializer.data}, actor=self.request.user
        )

    def perform_update(self, serializer):
        # 防 IDOR：若要改 map（搬移分類），目標地圖也必須可編輯
        target_map = serializer.validated_data.get("map")
        if target_map is not None and not target_map.can_edit(self.request.user):
            raise PermissionDenied("沒有把分類移到該地圖的權限。")
        cat = serializer.save()
        broadcast_event(
            cat.map_id, "category.updated", {"category": serializer.data}, actor=self.request.user
        )

    def perform_destroy(self, instance):
        map_id, cid = instance.map_id, instance.id
        instance.delete()
        broadcast_event(map_id, "category.deleted", {"id": cid}, actor=self.request.user)


class PlaceViewSet(viewsets.ModelViewSet):
    serializer_class = PlaceSerializer
    permission_classes = [MapAccessPermission]
    filterset_fields = ["category", "status"]
    search_fields = ["name", "address", "note"]
    ordering_fields = ["created_at", "updated_at", "rating", "name"]

    def get_queryset(self):
        user = self.request.user
        qs = Place.objects.filter(
            Q(category__map__owner=user) | Q(category__map__collaborators__user=user)
        ).select_related("category", "category__map", "created_by").distinct()
        map_id = self.request.query_params.get("map")
        if map_id:
            qs = qs.filter(category__map_id=map_id)
        return qs

    def filter_queryset(self, queryset):
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
            radius = float(params.get("radius", 5))
        except ValueError:
            raise ValidationError({"radius": "必須是數字。"})

        # 空間索引預篩（dwithin 以度為單位）→ 再用 haversine 精算與排序
        pt = Point(lng, lat, srid=4326)
        qs = qs.filter(location__isnull=False, location__dwithin=(pt, radius / 111.0))

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
        if category is None or not category.map.can_edit(self.request.user):
            raise PermissionDenied("沒有在這張地圖新增地點的權限。")
        place = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        broadcast_event(
            place.category.map_id, "place.created", {"place": serializer.data}, actor=self.request.user
        )

    def perform_update(self, serializer):
        # 防 IDOR：若要改 category（搬移地點），目標分類所屬地圖也必須可編輯
        target_category = serializer.validated_data.get("category")
        if target_category is not None and not target_category.map.can_edit(self.request.user):
            raise PermissionDenied("沒有把地點移到該地圖的權限。")
        place = serializer.save(updated_by=self.request.user)
        broadcast_event(
            place.category.map_id, "place.updated", {"place": serializer.data}, actor=self.request.user
        )

    def perform_destroy(self, instance):
        map_id, pid = instance.category.map_id, instance.id
        instance.delete()
        broadcast_event(map_id, "place.deleted", {"id": pid}, actor=self.request.user)


class CollaboratorViewSet(viewsets.ModelViewSet):
    """地圖共編者管理：列出、以 email 邀請、改角色、移除。

    巢狀於 /maps/{map_pk}/collaborators/。
    讀取需為成員；新增/改/刪需 owner（但成員可移除自己＝退出）。
    """

    serializer_class = CollaboratorSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    def get_map(self) -> Map:
        m = get_object_or_404(Map, pk=self.kwargs["map_pk"])
        if not m.can_view(self.request.user):
            raise PermissionDenied("沒有存取這張地圖的權限。")
        return m

    def get_queryset(self):
        return self.get_map().collaborators.select_related("user", "invited_by").order_by(
            "created_at"
        )

    def _require_owner(self):
        if not self.get_map().can_manage(self.request.user):
            raise PermissionDenied("只有地圖擁有者可以管理成員。")

    def create(self, request, *args, **kwargs):
        self._require_owner()
        m = self.get_map()
        email = (request.data.get("email") or "").strip().lower()
        role = request.data.get("role", ROLE_EDITOR)
        if role not in (ROLE_EDITOR, ROLE_VIEWER):
            role = ROLE_EDITOR
        if not email:
            raise ValidationError({"email": "請輸入要邀請的 email。"})
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            raise ValidationError({"email": "查無此使用者，請對方先註冊帳號。"})
        if user.id == m.owner_id:
            raise ValidationError({"email": "此使用者是地圖擁有者，不需邀請。"})

        collab, created = Collaborator.objects.get_or_create(
            map=m, user=user, defaults={"role": role, "invited_by": request.user}
        )
        if not created and collab.role != role:
            collab.role = role
            collab.save()

        data = self.get_serializer(collab).data
        broadcast_event(
            m.id,
            "collaborator.added" if created else "permission.updated",
            {"collaborator": data},
            actor=request.user,
        )
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        self._require_owner()
        collab = self.get_object()
        role = request.data.get("role")
        if role in (ROLE_EDITOR, ROLE_VIEWER):
            collab.role = role
            collab.save()
        data = self.get_serializer(collab).data
        broadcast_event(
            collab.map_id, "permission.updated", {"collaborator": data}, actor=request.user
        )
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        collab = self.get_object()
        # 成員可移除自己（退出地圖）；否則需 owner
        if collab.user_id != request.user.id:
            self._require_owner()
        map_id, user_id = collab.map_id, collab.user_id
        collab.delete()
        broadcast_event(
            map_id, "collaborator.removed", {"user_id": user_id}, actor=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicMapView(APIView):
    """公開唯讀地圖（免登入），需有效 share_token。"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        m = get_object_or_404(Map, share_token=token)
        categories = (
            m.categories.annotate(places_count=Count("places", distinct=True))
            .order_by("sort_order", "id")
        )
        places = (
            Place.objects.filter(category__map=m)
            .select_related("category")
            .order_by("-updated_at")
        )
        return Response(
            {
                "map": {
                    "id": m.id,
                    "name": m.name,
                    "emoji": m.emoji,
                    "description": m.description,
                    "owner_name": m.owner.display_name,
                    "categories_count": categories.count(),
                    "places_count": places.count(),
                },
                "categories": PublicCategorySerializer(categories, many=True).data,
                "places": PublicPlaceSerializer(places, many=True).data,
            }
        )


class RecommendationsView(APIView):
    """智慧推薦（第一階段規則式，多訊號＋理由）。

    回傳分組：高評價、附近順路、想去清單、朋友也收藏（你參與共編的地圖裡別人的收藏）。
    """

    def get(self, request):
        user = request.user
        map_id = request.query_params.get("map")

        accessible = (
            Place.objects.filter(
                Q(category__map__owner=user) | Q(category__map__collaborators__user=user)
            )
            .select_related("category", "category__map", "created_by")
            .distinct()
        )
        in_map = accessible.filter(category__map_id=map_id) if map_id else accessible

        high_rated = list(in_map.filter(rating__gte=4).order_by("-rating", "-updated_at")[:12])
        wishlist = list(
            in_map.filter(status__in=["想去", "一定要去", "想再訪"]).order_by("-updated_at")[:12]
        )

        nearby = []
        lat, lng = request.query_params.get("lat"), request.query_params.get("lng")
        if lat and lng:
            try:
                latf, lngf = float(lat), float(lng)
                radius = 10.0
                # 空間索引預篩（dwithin 以度為單位），避免把整張地圖的地點全載入記憶體
                pt = Point(lngf, latf, srid=4326)
                cands = in_map.filter(
                    location__isnull=False, location__dwithin=(pt, radius / 111.0)
                )
                for p in cands:
                    d = haversine_km(latf, lngf, p.latitude, p.longitude)
                    if d <= radius:
                        p.distance_km = d
                        nearby.append(p)
                nearby.sort(key=lambda x: x.distance_km)
                nearby = nearby[:12]
            except ValueError:
                pass

        # 朋友也收藏：我參與共編（非我擁有）的地圖裡的高評價地點
        friends = list(
            Place.objects.filter(category__map__collaborators__user=user)
            .exclude(category__map__owner=user)
            .filter(rating__gte=4)
            .select_related("category", "category__map", "created_by")
            .order_by("-rating", "-updated_at")
            .distinct()[:12]
        )

        ctx = {"request": request}
        S = RecommendationPlaceSerializer
        return Response(
            {
                "high_rated": S(high_rated, many=True, context=ctx).data,
                "nearby": S(nearby, many=True, context=ctx).data,
                "wishlist": S(wishlist, many=True, context=ctx).data,
                "friends": S(friends, many=True, context=ctx).data,
            }
        )
