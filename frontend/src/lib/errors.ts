import { AxiosError } from "axios";

/**
 * 從 API 錯誤取出可顯示的訊息（型別安全，取代各處 `err: any` 的取值）。
 * 依序嘗試：DRF `detail` → 第一個欄位錯誤 → Error.message → fallback。
 */
export function apiErrorMessage(err: unknown, fallback = "發生錯誤，請稍後再試"): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object") {
      const detail = (data as Record<string, unknown>).detail;
      if (typeof detail === "string") return detail;
      const first = Object.values(data as Record<string, unknown>).flat()[0];
      if (typeof first === "string") return first;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
