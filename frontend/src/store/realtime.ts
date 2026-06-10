import { create } from "zustand";

import { toast } from "@/components/ui/Toast";
import { tokenStore, wsBaseUrl } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";

interface OnlineUser {
  id: number;
  display_name: string;
}

export type RealtimeStatus = "idle" | "connecting" | "open" | "closed";

interface RealtimeState {
  status: RealtimeStatus;
  online: OnlineUser[];
  connect: (mapId: number) => void;
  disconnect: () => void;
}

let socket: WebSocket | null = null;
let currentMapId: number | null = null;
let retry = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalClose = false;

export const useRealtime = create<RealtimeState>((set, get) => ({
  status: "idle",
  online: [],

  connect(mapId) {
    if (socket && currentMapId === mapId) return; // 已連同一張
    if (socket) get().disconnect(); // 切換地圖：關舊連線
    const token = tokenStore.access();
    if (!token) return;
    currentMapId = mapId;
    intentionalClose = false;
    openSocket(mapId, set);
  },

  disconnect() {
    intentionalClose = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    currentMapId = null;
    retry = 0;
    set({ status: "idle", online: [] });
  },
}));

function openSocket(mapId: number, set: (p: Partial<RealtimeState>) => void) {
  const token = tokenStore.access();
  if (!token) return;
  set({ status: "connecting" });
  const ws = new WebSocket(`${wsBaseUrl()}/maps/${mapId}/?token=${token}`);
  socket = ws;

  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
  ws.onclose = () => {
    if (intentionalClose || currentMapId !== mapId) return;
    useRealtime.setState({ status: "closed", online: [] });
    retry += 1;
    const delay = Math.min(1000 * 2 ** (retry - 1), 10000); // 1s,2s,4s,8s,10s...
    reconnectTimer = setTimeout(() => openSocket(mapId, set), delay);
  };
  ws.onerror = () => ws.close();
}

function handleMessage(msg: any) {
  const { event, payload, user, actor } = msg;

  if (event === "connected") {
    retry = 0;
    useRealtime.setState({ status: "open" });
    return;
  }
  if (event === "pong") return;

  if (event === "presence.join") {
    useRealtime.setState((s) =>
      s.online.some((u) => u.id === user.id) ? s : { online: [...s.online, user] },
    );
    return;
  }
  if (event === "presence.leave") {
    useRealtime.setState((s) => ({ online: s.online.filter((u) => u.id !== user.id) }));
    return;
  }

  // 資料事件 → 套用到 data store
  void useData.getState().applyEvent(event, payload, actor ?? null);

  // 別人的動作才提示（自己的動作本機已即時反映）
  const myId = useAuth.getState().user?.id;
  if (actor && actor.id !== myId) {
    const who = actor.display_name;
    const name = payload?.place?.name ?? payload?.category?.name ?? "";
    const text: Record<string, string> = {
      "place.created": `${who} 新增了「${name}」`,
      "place.updated": `${who} 更新了「${name}」`,
      "place.deleted": `${who} 刪除了一個地點`,
      "category.created": `${who} 新增了分類`,
      "category.updated": `${who} 更新了分類`,
      "category.deleted": `${who} 刪除了分類`,
      "collaborator.added": `${who} 邀請了新成員`,
      "collaborator.removed": `成員有異動`,
      "permission.updated": `${who} 調整了成員權限`,
    };
    if (text[event]) toast.info(text[event]);
  }
}
