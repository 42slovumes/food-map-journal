import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewMode } from "@/types";

interface UIState {
  /** 進階模式：打開後顯示更密集的欄位、工作台式版面、更多統計（預設關閉，降低認知負荷） */
  advancedMode: boolean;
  /** 桌機主畫面版面：split（地圖+清單）/ map / list */
  viewMode: ViewMode;
  /** 是否在清單按距離排序（需要定位） */
  sortByDistance: boolean;
  setAdvanced: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  setSortByDistance: (v: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      advancedMode: false,
      viewMode: "split",
      sortByDistance: false,
      setAdvanced: (advancedMode) => set({ advancedMode }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSortByDistance: (sortByDistance) => set({ sortByDistance }),
    }),
    { name: "fmj_ui_prefs" },
  ),
);
