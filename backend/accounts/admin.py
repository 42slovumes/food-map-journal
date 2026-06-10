from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "email", "username", "display_name", "is_staff")
    search_fields = ("email", "username", "display_name")
    ordering = ("id",)
    fieldsets = UserAdmin.fieldsets + (
        ("個人資料", {"fields": ("display_name", "avatar")}),
    )
