from django.urls import path

from .consumers import MapConsumer

websocket_urlpatterns = [
    path("ws/maps/<int:map_id>/", MapConsumer.as_asgi()),
]
