"""建立示範資料：demo 帳號 + 台北範例地圖／分類／地點。

    python manage.py seed_demo

可重複執行（會清掉 demo 使用者既有資料再重建）。
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from maps.models import Category, Map, Place

User = get_user_model()

DEMO_EMAIL = "demo@foodmap.app"
DEMO_PASSWORD = "demo1234"

CATEGORIES = [
    {
        "name": "拉麵",
        "icon": "🍜",
        "color": "#F97316",
        "places": [
            {"name": "麵屋一燈 台北", "address": "台北市中山區", "lat": 25.0525, "lng": 121.5430,
             "status": "一定要去", "rating": 5, "tags": ["排隊很久", "想再訪"],
             "note": "濃厚雞白湯，必點特製拉麵。"},
            {"name": "鷹流東京醬油拉麵 蘭丸", "address": "台北市大安區", "lat": 25.0413, "lng": 121.5440,
             "status": "已去", "rating": 4, "tags": ["CP值高", "交通方便"],
             "note": "醬油湯頭清爽。"},
            {"name": "豚骨家 拉麵", "address": "台北市信義區", "lat": 25.0330, "lng": 121.5650,
             "status": "想去", "rating": None, "tags": ["朋友推薦"], "note": "朋友大力推薦。"},
        ],
    },
    {
        "name": "咖啡廳",
        "icon": "☕",
        "color": "#10B981",
        "places": [
            {"name": "Fika Fika Cafe", "address": "台北市中山區", "lat": 25.0575, "lng": 121.5380,
             "status": "已去", "rating": 5, "tags": ["氣氛好", "適合拍照"],
             "note": "北歐風淺焙，環境很舒服。"},
            {"name": "VWI by Chad Wang", "address": "台北市中正區", "lat": 25.0410, "lng": 121.5180,
             "status": "想再訪", "rating": 5, "tags": ["服務好", "適合約會"],
             "note": "手沖很細緻。"},
        ],
    },
    {
        "name": "想去景點",
        "icon": "🏞️",
        "color": "#3B82F6",
        "places": [
            {"name": "象山步道", "address": "台北市信義區", "lat": 25.0270, "lng": 121.5710,
             "status": "想去", "rating": None, "tags": ["適合拍照"], "note": "拍 101 夜景的好地方。"},
            {"name": "大稻埕碼頭", "address": "台北市大同區", "lat": 25.0560, "lng": 121.5090,
             "status": "想去", "rating": None, "tags": ["適合約會"], "note": "黃昏散步。"},
        ],
    },
]


class Command(BaseCommand):
    help = "建立示範資料（demo 帳號與台北範例地點）"

    @transaction.atomic
    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={"username": "demo", "display_name": "Demo 使用者"},
        )
        user.set_password(DEMO_PASSWORD)
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS(f"建立 demo 使用者：{DEMO_EMAIL}"))

        # 清掉舊的 demo 地圖（連帶分類、地點），重建
        Map.objects.filter(owner=user).delete()

        demo_map = Map.objects.create(
            owner=user,
            name="台北美食地圖",
            description="我在台北的私房收藏",
            emoji="🍱",
        )

        total_places = 0
        for order, cat in enumerate(CATEGORIES):
            category = Category.objects.create(
                map=demo_map,
                owner=user,
                name=cat["name"],
                icon=cat["icon"],
                color=cat["color"],
                sort_order=order,
            )
            for p in cat["places"]:
                Place.objects.create(
                    category=category,
                    name=p["name"],
                    address=p["address"],
                    latitude=p["lat"],
                    longitude=p["lng"],
                    status=p["status"],
                    rating=p["rating"],
                    tags=p["tags"],
                    note=p["note"],
                    created_by=user,
                    updated_by=user,
                )
                total_places += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"完成！地圖「{demo_map.name}」含 {len(CATEGORIES)} 個分類、{total_places} 個地點。\n"
                f"登入：{DEMO_EMAIL} / {DEMO_PASSWORD}"
            )
        )
