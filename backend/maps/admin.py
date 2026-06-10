from django.contrib import admin

from .models import Category, Map, Place


@admin.register(Map)
class MapAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "is_public", "updated_at")
    search_fields = ("name", "owner__email")
    list_filter = ("is_public",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "map", "color", "icon", "sort_order", "is_collaborative")
    search_fields = ("name", "map__name")
    list_filter = ("is_public", "is_collaborative")


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "status", "rating", "updated_at")
    search_fields = ("name", "address")
    list_filter = ("status", "category")
