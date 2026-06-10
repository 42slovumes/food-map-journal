from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DEFAULT_CATEGORY_COLORS, STATUS_PRESETS

# 常用標籤建議（前端可自由新增，這裡只是建議清單）
TAG_SUGGESTIONS = [
    "一定要去",
    "CP值高",
    "排隊很久",
    "適合約會",
    "適合拍照",
    "交通方便",
    "想再訪",
    "朋友推薦",
    "氣氛好",
    "服務好",
    "份量大",
    "便宜",
    "適合多人",
]

CATEGORY_ICON_SUGGESTIONS = [
    "📍", "🍜", "☕", "🍰", "🍺", "🍲", "🏞️", "🎨", "🛍️", "🌮",
    "🍣", "🍕", "🏨", "📷", "❤️", "⭐", "🗼", "🍷",
]


class PresetsView(APIView):
    """提供前端使用的預設清單：狀態、顏色、標籤、圖示。"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "statuses": STATUS_PRESETS,
                "colors": DEFAULT_CATEGORY_COLORS,
                "tags": TAG_SUGGESTIONS,
                "icons": CATEGORY_ICON_SUGGESTIONS,
            }
        )
