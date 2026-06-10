import { create } from "zustand";

import {
  categoriesApi,
  collaboratorsApi,
  mapsApi,
  metaApi,
  type PlaceQuery,
  placesApi,
} from "@/lib/api";
import type { LatLng } from "@/map/types";
import type { Category, Collaborator, MapBoard, Place, Presets, Role } from "@/types";

interface DataState {
  maps: MapBoard[];
  activeMapId: number | null;
  categories: Category[];
  activeCategoryId: number | null; // null = 全部分類
  places: Place[];
  presets: Presets | null;
  members: Collaborator[];

  selectedPlaceId: number | null;
  search: string;
  statusFilter: string | null;

  userLocation: LatLng | null;
  nearby: boolean;
  radius: number;

  ready: boolean;
  loadingPlaces: boolean;
  locating: boolean;

  bootstrap: () => Promise<void>;
  setActiveMap: (id: number) => Promise<void>;
  setActiveCategory: (id: number | null) => Promise<void>;
  setSearch: (s: string) => void;
  setStatusFilter: (s: string | null) => Promise<void>;
  refreshPlaces: () => Promise<void>;
  locateUser: () => Promise<void>;
  disableNearby: () => Promise<void>;
  selectPlace: (id: number | null) => void;

  createMap: (payload: Partial<MapBoard>) => Promise<MapBoard>;
  updateMap: (id: number, payload: Partial<MapBoard>) => Promise<void>;
  deleteMap: (id: number) => Promise<void>;
  enableShare: (id: number) => Promise<string>;
  disableShare: (id: number) => Promise<void>;

  createCategory: (payload: Partial<Category>) => Promise<Category>;
  updateCategory: (id: number, payload: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  createPlace: (payload: Partial<Place>) => Promise<Place>;
  updatePlace: (id: number, payload: Partial<Place>) => Promise<Place>;
  deletePlace: (id: number) => Promise<void>;

  // 共編成員
  loadMembers: () => Promise<void>;
  inviteCollaborator: (email: string, role: Exclude<Role, "owner">) => Promise<Collaborator>;
  updateCollaboratorRole: (id: number, role: Exclude<Role, "owner">) => Promise<void>;
  removeCollaborator: (id: number) => Promise<void>;

  // 我在目前地圖的角色
  myRole: () => Role | null;
  // 套用 WebSocket 即時事件
  applyEvent: (
    event: string,
    payload: any,
    actor: { id: number; display_name: string } | null,
  ) => Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  maps: [],
  activeMapId: null,
  categories: [],
  activeCategoryId: null,
  places: [],
  presets: null,
  members: [],

  selectedPlaceId: null,
  search: "",
  statusFilter: null,

  userLocation: null,
  nearby: false,
  radius: 5,

  ready: false,
  loadingPlaces: false,
  locating: false,

  async bootstrap() {
    const [presets, maps] = await Promise.all([
      metaApi.presets().catch(() => null),
      mapsApi.list(),
    ]);
    let activeMap = maps[0] ?? null;

    // 全新使用者：自動建立第一張地圖，降低空白焦慮
    if (!activeMap) {
      activeMap = await mapsApi.create({
        name: "我的地圖",
        emoji: "🗺️",
        description: "開始收藏你的第一個地點吧",
      });
      maps.push(activeMap);
    }

    set({ presets, maps, activeMapId: activeMap.id });
    const categories = await categoriesApi.list(activeMap.id);
    set({ categories });
    await get().refreshPlaces();
    set({ ready: true });
  },

  async setActiveMap(id) {
    set({ activeMapId: id, activeCategoryId: null, selectedPlaceId: null });
    const categories = await categoriesApi.list(id);
    set({ categories });
    await get().refreshPlaces();
  },

  async setActiveCategory(id) {
    set({ activeCategoryId: id, selectedPlaceId: null });
    await get().refreshPlaces();
  },

  setSearch(s) {
    set({ search: s });
  },

  async setStatusFilter(s) {
    set({ statusFilter: s });
    await get().refreshPlaces();
  },

  async refreshPlaces() {
    const { activeMapId, activeCategoryId, statusFilter, search, nearby, userLocation, radius } =
      get();
    if (!activeMapId) return;
    set({ loadingPlaces: true });
    const query: PlaceQuery = { map: activeMapId };
    if (activeCategoryId) query.category = activeCategoryId;
    if (statusFilter) query.status = statusFilter;
    if (search.trim()) query.search = search.trim();
    if (nearby && userLocation) {
      query.lat = userLocation.lat;
      query.lng = userLocation.lng;
      query.radius = radius;
    }
    try {
      const places = await placesApi.list(query);
      set({ places });
    } finally {
      set({ loadingPlaces: false });
    }
  },

  async locateUser() {
    set({ locating: true });
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("瀏覽器不支援定位"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      set({
        userLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        nearby: true,
      });
      await get().refreshPlaces();
    } finally {
      set({ locating: false });
    }
  },

  async disableNearby() {
    set({ nearby: false });
    await get().refreshPlaces();
  },

  selectPlace(id) {
    set({ selectedPlaceId: id });
  },

  // ---- Map CRUD ----
  async createMap(payload) {
    const map = await mapsApi.create(payload);
    set((s) => ({ maps: [map, ...s.maps] }));
    return map;
  },
  async updateMap(id, payload) {
    const updated = await mapsApi.update(id, payload);
    set((s) => ({ maps: s.maps.map((m) => (m.id === id ? updated : m)) }));
  },
  async deleteMap(id) {
    await mapsApi.remove(id);
    const remaining = get().maps.filter((m) => m.id !== id);
    set({ maps: remaining });
    if (get().activeMapId === id && remaining[0]) {
      await get().setActiveMap(remaining[0].id);
    }
  },
  async enableShare(id) {
    const { share_token } = await mapsApi.enableShare(id);
    set((s) => ({
      maps: s.maps.map((m) => (m.id === id ? { ...m, is_shared: true, share_token } : m)),
    }));
    return share_token;
  },
  async disableShare(id) {
    await mapsApi.disableShare(id);
    set((s) => ({
      maps: s.maps.map((m) => (m.id === id ? { ...m, is_shared: false, share_token: null } : m)),
    }));
  },

  // ---- Category CRUD ----
  async createCategory(payload) {
    const cat = await categoriesApi.create({ ...payload, map: get().activeMapId ?? undefined });
    set((s) => ({ categories: [...s.categories, cat] }));
    return cat;
  },
  async updateCategory(id, payload) {
    const updated = await categoriesApi.update(id, payload);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
    await get().refreshPlaces();
  },
  async deleteCategory(id) {
    await categoriesApi.remove(id);
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      activeCategoryId: s.activeCategoryId === id ? null : s.activeCategoryId,
    }));
    await get().refreshPlaces();
  },

  // ---- Place CRUD ----
  async createPlace(payload) {
    const place = await placesApi.create(payload);
    set((s) => ({ places: [place, ...s.places] }));
    await refreshCategoryCounts(set, get);
    return place;
  },
  async updatePlace(id, payload) {
    const place = await placesApi.update(id, payload);
    set((s) => ({ places: s.places.map((p) => (p.id === id ? place : p)) }));
    await refreshCategoryCounts(set, get);
    return place;
  },
  async deletePlace(id) {
    await placesApi.remove(id);
    set((s) => ({
      places: s.places.filter((p) => p.id !== id),
      selectedPlaceId: s.selectedPlaceId === id ? null : s.selectedPlaceId,
    }));
    await refreshCategoryCounts(set, get);
  },

  // ---- 共編成員 ----
  async loadMembers() {
    const mapId = get().activeMapId;
    if (!mapId) return;
    const members = await collaboratorsApi.list(mapId);
    set({ members });
  },
  async inviteCollaborator(email, role) {
    const mapId = get().activeMapId!;
    const collab = await collaboratorsApi.invite(mapId, email, role);
    await get().loadMembers();
    await reloadMaps(set, get);
    return collab;
  },
  async updateCollaboratorRole(id, role) {
    const mapId = get().activeMapId!;
    await collaboratorsApi.updateRole(mapId, id, role);
    await get().loadMembers();
  },
  async removeCollaborator(id) {
    const mapId = get().activeMapId!;
    await collaboratorsApi.remove(mapId, id);
    await get().loadMembers();
    await reloadMaps(set, get);
  },

  myRole() {
    const { maps, activeMapId } = get();
    return maps.find((m) => m.id === activeMapId)?.my_role ?? null;
  },

  // ---- 套用 WebSocket 即時事件 ----
  async applyEvent(event, payload, _actor) {
    const state = get();
    const mapId = state.activeMapId;

    const matchesFilter = (p: Place) => {
      if (state.activeCategoryId !== null && p.category !== state.activeCategoryId) return false;
      if (state.statusFilter && p.status !== state.statusFilter) return false;
      return true;
    };

    if (event === "place.created" || event === "place.updated") {
      const p: Place = payload.place;
      if (p.map !== mapId) return;
      set((s) => {
        const exists = s.places.some((x) => x.id === p.id);
        if (exists) return { places: s.places.map((x) => (x.id === p.id ? p : x)) };
        if (matchesFilter(p)) return { places: [p, ...s.places] };
        return {};
      });
      await refreshCategoryCounts(set, get);
    } else if (event === "place.deleted") {
      const id = payload.id;
      set((s) => ({
        places: s.places.filter((x) => x.id !== id),
        selectedPlaceId: s.selectedPlaceId === id ? null : s.selectedPlaceId,
      }));
      await refreshCategoryCounts(set, get);
    } else if (event.startsWith("category.")) {
      // 分類異動：重載分類；若刪除則一併移除其地點
      if (event === "category.deleted") {
        const id = payload.id;
        set((s) => ({
          places: s.places.filter((p) => p.category !== id),
          activeCategoryId: s.activeCategoryId === id ? null : s.activeCategoryId,
        }));
      }
      if (mapId) {
        const categories = await categoriesApi.list(mapId);
        set({ categories });
      }
    } else if (event.startsWith("collaborator.") || event === "permission.updated") {
      await get().loadMembers();
      await reloadMaps(set, get);
    }
  },
}));

// 地點變動後重新抓分類（更新 places_count 徽章）
async function refreshCategoryCounts(
  set: (partial: Partial<DataState>) => void,
  get: () => DataState,
) {
  const mapId = get().activeMapId;
  if (!mapId) return;
  const categories = await categoriesApi.list(mapId);
  set({ categories });
}

// 成員/權限變動後重抓地圖清單（更新 my_role、collaborators_count）
async function reloadMaps(
  set: (partial: Partial<DataState>) => void,
  get: () => DataState,
) {
  const maps = await mapsApi.list();
  set({ maps });
  void get;
}
