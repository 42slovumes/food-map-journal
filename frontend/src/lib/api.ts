import axios, { type AxiosInstance } from "axios";

import type {
  Category,
  MapBoard,
  Paginated,
  Place,
  Presets,
  User,
} from "@/types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

const ACCESS_KEY = "fmj_access";
const REFRESH_KEY = "fmj_refresh";

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.access();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 時嘗試用 refresh token 換新 access；失敗則登出
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.refresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
    tokenStore.set(data.access, data.refresh);
    return data.access as string;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? doRefresh();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      // refresh 失敗：導回登入
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ---- Auth ----
export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post("/auth/login/", { email, password });
    tokenStore.set(data.access, data.refresh);
    return data.user as User;
  },
  async register(payload: {
    email: string;
    password: string;
    display_name?: string;
  }) {
    await api.post("/auth/register/", payload);
    return authApi.login(payload.email, payload.password);
  },
  async me() {
    const { data } = await api.get<User>("/auth/me/");
    return data;
  },
  logout() {
    tokenStore.clear();
  },
};

// ---- Maps / Categories / Places ----
const unwrap = <T>(d: Paginated<T> | T[]): T[] =>
  Array.isArray(d) ? d : d.results;

export const mapsApi = {
  async list() {
    const { data } = await api.get<Paginated<MapBoard>>("/maps/");
    return unwrap(data);
  },
  async create(payload: Partial<MapBoard>) {
    const { data } = await api.post<MapBoard>("/maps/", payload);
    return data;
  },
  async update(id: number, payload: Partial<MapBoard>) {
    const { data } = await api.patch<MapBoard>(`/maps/${id}/`, payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/maps/${id}/`);
  },
};

export const categoriesApi = {
  async list(mapId?: number) {
    const { data } = await api.get<Paginated<Category>>("/categories/", {
      params: mapId ? { map: mapId } : undefined,
    });
    return unwrap(data);
  },
  async create(payload: Partial<Category>) {
    const { data } = await api.post<Category>("/categories/", payload);
    return data;
  },
  async update(id: number, payload: Partial<Category>) {
    const { data } = await api.patch<Category>(`/categories/${id}/`, payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/categories/${id}/`);
  },
};

export interface PlaceQuery {
  map?: number;
  category?: number;
  status?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export const placesApi = {
  async list(query: PlaceQuery = {}) {
    const { data } = await api.get<Paginated<Place>>("/places/", {
      params: query,
    });
    return unwrap(data);
  },
  async get(id: number) {
    const { data } = await api.get<Place>(`/places/${id}/`);
    return data;
  },
  async create(payload: Partial<Place>) {
    const { data } = await api.post<Place>("/places/", payload);
    return data;
  },
  async update(id: number, payload: Partial<Place>) {
    const { data } = await api.patch<Place>(`/places/${id}/`, payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/places/${id}/`);
  },
};

export const metaApi = {
  async presets() {
    const { data } = await api.get<Presets>("/meta/presets/");
    return data;
  },
};
