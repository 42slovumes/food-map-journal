"""地圖即時同步 WebSocket consumer。

連線：ws/maps/<map_id>/?token=<access_jwt>
- 未登入 → 4401 關閉
- 非該地圖成員 → 4403 關閉
- 成員 → 加入 group「map_<id>」，接收 REST 廣播的事件與其他人的上線/離線狀態
寫入一律走 REST API（由後端驗權後再廣播），WebSocket 只負責「接收」。
"""
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .events import group_name


class MapConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.map_id = int(self.scope["url_route"]["kwargs"]["map_id"])

        if self.user is None or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        role = await self.get_role()
        if role is None:
            await self.close(code=4403)
            return

        self.role = role
        self.group = group_name(self.map_id)
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

        await self.send_json({"event": "connected", "role": role, "map_id": self.map_id})
        await self.channel_layer.group_send(
            self.group, {"type": "presence.event", "event": "presence.join", "user": self._me()}
        )

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_send(
                self.group,
                {"type": "presence.event", "event": "presence.leave", "user": self._me()},
            )
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # 客戶端只需保持連線；支援 ping 保活
        if content.get("type") == "ping":
            await self.send_json({"event": "pong"})

    # ---- group handlers ----
    async def map_event(self, message):
        event = message["event"]
        await self.send_json(
            {
                "event": event,
                "payload": message["payload"],
                "actor": message.get("actor"),
            }
        )
        # 成員/權限變更後重新確認自己仍是成員，若已被移除則立即斷線
        # （降為 viewer 不斷線，viewer 本就可讀；只有不再是成員才關閉）
        if event in ("collaborator.removed", "permission.updated"):
            if await self.get_role() is None:
                await self.close(code=4403)

    async def presence_event(self, message):
        await self.send_json({"event": message["event"], "user": message["user"]})

    # ---- helpers ----
    def _me(self):
        return {"id": self.user.id, "display_name": self.user.display_name}

    @database_sync_to_async
    def get_role(self):
        from .models import Map

        m = Map.objects.filter(id=self.map_id).first()
        return m.role_for(self.user) if m else None
