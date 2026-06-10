from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """只有資源擁有者可以存取／修改。

    Map / Category 有 owner 欄位；Place 透過 category.map.owner 判斷。
    （第二階段共編時，這裡會擴充成檢查 collaborator 權限。）
    """

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "owner", None)
        if owner is None and hasattr(obj, "category"):
            owner = obj.category.map.owner
        return owner == request.user
