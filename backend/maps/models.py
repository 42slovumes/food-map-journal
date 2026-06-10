from urllib.parse import quote_plus

from django.conf import settings
from django.db import models

# 常用狀態預設值（前端會提供選單，但實際儲存為自由字串，符合 plan「狀態可自由設定」）
STATUS_PRESETS = [
    "想去",
    "已去",
    "一定要去",
    "想再訪",
    "朋友推薦",
    "收藏中",
    "普通",
    "不推薦",
]

# 預設分類顏色盤（簡約、好辨識）
DEFAULT_CATEGORY_COLORS = [
    "#F97316",  # orange（主題色）
    "#EF4444",  # red
    "#F59E0B",  # amber
    "#10B981",  # emerald
    "#3B82F6",  # blue
    "#8B5CF6",  # violet
    "#EC4899",  # pink
    "#14B8A6",  # teal
]


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField("建立時間", auto_now_add=True)
    updated_at = models.DateTimeField("更新時間", auto_now=True)

    class Meta:
        abstract = True


class Map(TimeStampedModel):
    """一張地圖／收藏看板，例如「台北美食地圖」「濟州島想去」。"""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maps",
        verbose_name="擁有者",
    )
    name = models.CharField("名稱", max_length=80)
    description = models.TextField("描述", blank=True)
    emoji = models.CharField("圖示", max_length=8, blank=True, default="🗺️")
    is_public = models.BooleanField("是否公開", default=False)

    class Meta:
        verbose_name = "地圖"
        verbose_name_plural = "地圖"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.name


class Category(TimeStampedModel):
    """地圖底下的主題分類，例如「拉麵」「咖啡廳」。"""

    map = models.ForeignKey(
        Map, on_delete=models.CASCADE, related_name="categories", verbose_name="所屬地圖"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
        verbose_name="建立者",
    )
    name = models.CharField("名稱", max_length=60)
    description = models.TextField("描述", blank=True)
    color = models.CharField("顏色", max_length=9, default="#F97316")
    icon = models.CharField("圖示", max_length=8, blank=True, default="📍")
    is_public = models.BooleanField("是否公開", default=False)
    is_collaborative = models.BooleanField("是否可共編", default=False)
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        verbose_name = "分類"
        verbose_name_plural = "分類"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.name


class Place(TimeStampedModel):
    """地圖上的單一地點紀錄。"""

    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="places", verbose_name="所屬分類"
    )
    name = models.CharField("名稱", max_length=120)
    address = models.CharField("地址", max_length=255, blank=True)
    latitude = models.FloatField("緯度", null=True, blank=True)
    longitude = models.FloatField("經度", null=True, blank=True)
    google_maps_url = models.URLField("Google Maps 連結", max_length=500, blank=True)
    google_place_id = models.CharField("Google Place ID", max_length=255, blank=True)

    status = models.CharField("狀態", max_length=32, blank=True, default="想去")
    rating = models.PositiveSmallIntegerField("星等", null=True, blank=True)  # 0-5
    recommend_level = models.PositiveSmallIntegerField("推薦程度", null=True, blank=True)  # 0-5
    tags = models.JSONField("標籤", default=list, blank=True)

    note = models.TextField("備註", blank=True)
    want_reason = models.TextField("想去原因", blank=True)
    experience_note = models.TextField("實際體驗紀錄", blank=True)
    cover_photo = models.ImageField("照片", upload_to="places/", blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_places",
        verbose_name="建立者",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_places",
        verbose_name="最後更新者",
    )

    class Meta:
        verbose_name = "地點"
        verbose_name_plural = "地點"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def map_id(self) -> int:
        return self.category.map_id

    def ensure_google_maps_url(self) -> str:
        """若未提供 Google Maps 連結，依 place_id / 座標 / 名稱自動產生。"""
        if self.google_maps_url:
            return self.google_maps_url
        if self.google_place_id:
            return (
                "https://www.google.com/maps/search/?api=1"
                f"&query={quote_plus(self.name)}&query_place_id={self.google_place_id}"
            )
        if self.latitude is not None and self.longitude is not None:
            return (
                "https://www.google.com/maps/search/?api=1"
                f"&query={self.latitude}%2C{self.longitude}"
            )
        if self.name:
            return f"https://www.google.com/maps/search/?api=1&query={quote_plus(self.name)}"
        return ""

    def save(self, *args, **kwargs):
        self.google_maps_url = self.ensure_google_maps_url()
        super().save(*args, **kwargs)
