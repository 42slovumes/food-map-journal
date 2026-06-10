from rest_framework import permissions

from .models import Category, Collaborator, Map, Place


def map_of(obj) -> Map | None:
    """取得任一資源所屬的 Map。"""
    if isinstance(obj, Map):
        return obj
    if isinstance(obj, Category):
        return obj.map
    if isinstance(obj, Place):
        return obj.category.map
    if isinstance(obj, Collaborator):
        return obj.map
    return None


class MapAccessPermission(permissions.BasePermission):
    """以地圖角色控管存取：

    - 讀取（SAFE_METHODS）：owner / editor / viewer 皆可
    - 寫入地點/分類：owner / editor
    - 修改地圖本身或管理成員：僅 owner
    """

    def has_object_permission(self, request, view, obj):
        m = map_of(obj)
        if m is None:
            return False
        if request.method in permissions.SAFE_METHODS:
            return m.can_view(request.user)
        # 地圖本身與共編者：只有 owner 能改
        if isinstance(obj, (Map, Collaborator)):
            return m.can_manage(request.user)
        # 地點 / 分類：editor 以上可改
        return m.can_edit(request.user)
