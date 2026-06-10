"""即時事件廣播工具。

REST 寫入成功後呼叫 broadcast_event()，把事件推給「正在看同一張地圖」的 WebSocket 連線。
廣播失敗（例如 channel layer 未設定）絕不影響 API 主流程。
"""
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def group_name(map_id) -> str:
    return f"map_{map_id}"


def broadcast_event(map_id, event: str, payload: dict, actor=None) -> None:
    """把事件廣播給某張地圖的所有 WebSocket 連線。

    event 例如：place.created / place.updated / place.deleted /
    category.created / collaborator.added / permission.updated / map.updated
    """
    layer = get_channel_layer()
    if layer is None:
        return

    actor_data = None
    if actor is not None and getattr(actor, "is_authenticated", False):
        actor_data = {"id": actor.id, "display_name": actor.display_name}

    message = {
        "type": "map.event",  # 對應 consumer 的 map_event handler
        "event": event,
        "payload": payload,
        "actor": actor_data,
    }
    try:
        async_to_sync(layer.group_send)(group_name(map_id), message)
    except Exception:  # noqa: BLE001 — 廣播失敗不可影響 API
        logger.warning("broadcast_event 失敗：map=%s event=%s", map_id, event, exc_info=True)
