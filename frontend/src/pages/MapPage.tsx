import {
  ArrowLeft,
  Columns2,
  List,
  type LucideIcon,
  Map as MapIcon,
  Navigation,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CategoryChips } from "@/components/CategoryChips";
import { CategoryForm } from "@/components/CategoryForm";
import { MapForm } from "@/components/MapForm";
import { MapSwitcher } from "@/components/MapSwitcher";
import { MembersDialog } from "@/components/MembersDialog";
import { PlaceDetail } from "@/components/PlaceDetail";
import { ShareDialog } from "@/components/ShareDialog";
import { PlaceForm } from "@/components/PlaceForm";
import { PlaceList } from "@/components/PlaceList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import MapView from "@/map/MapView";
import type { LatLng, MapMarkerData } from "@/map/types";
import { useData } from "@/store/data";
import { useRealtime } from "@/store/realtime";
import { useUI } from "@/store/ui";
import type { Place, ViewMode } from "@/types";

export default function MapPage() {
  const isDesktop = useIsDesktop();

  const places = useData((s) => s.places);
  const categories = useData((s) => s.categories);
  const presets = useData((s) => s.presets);
  const loadingPlaces = useData((s) => s.loadingPlaces);
  const selectedPlaceId = useData((s) => s.selectedPlaceId);
  const selectPlace = useData((s) => s.selectPlace);
  const search = useData((s) => s.search);
  const setSearch = useData((s) => s.setSearch);
  const refreshPlaces = useData((s) => s.refreshPlaces);
  const statusFilter = useData((s) => s.statusFilter);
  const setStatusFilter = useData((s) => s.setStatusFilter);
  const nearby = useData((s) => s.nearby);
  const userLocation = useData((s) => s.userLocation);
  const locating = useData((s) => s.locating);
  const locateUser = useData((s) => s.locateUser);
  const disableNearby = useData((s) => s.disableNearby);
  const deletePlace = useData((s) => s.deletePlace);

  const viewMode = useUI((s) => s.viewMode);
  const setViewMode = useUI((s) => s.setViewMode);
  const advanced = useUI((s) => s.advancedMode);

  // 共編：我的角色與線上狀態
  const myRole = useData((s) => s.maps.find((m) => m.id === s.activeMapId)?.my_role ?? null);
  const canEdit = myRole !== "viewer"; // owner/editor/載入中 → 可編輯；viewer → 唯讀
  const online = useRealtime((s) => s.online);
  const rtStatus = useRealtime((s) => s.status);

  const [placeFormOpen, setPlaceFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [newCoords, setNewCoords] = useState<LatLng | null>(null);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [mapFormOpen, setMapFormOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  // 搜尋 debounce
  useEffect(() => {
    const t = setTimeout(() => refreshPlaces(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const markers: MapMarkerData[] = useMemo(
    () =>
      places
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          lat: p.latitude as number,
          lng: p.longitude as number,
          color: p.category_color,
          icon: p.category_icon,
        })),
    [places],
  );

  const focusCenter: LatLng | undefined =
    selectedPlace?.latitude != null && selectedPlace?.longitude != null
      ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
      : nearby && userLocation
        ? userLocation
        : undefined;

  function handleSelect(id: number) {
    selectPlace(id);
    // 桌機在「純地圖」模式選取時，自動展開面板顯示詳情
    if (isDesktop && viewMode === "map") setViewMode("split");
  }

  function openAdd(coords?: LatLng | null) {
    if (categories.length === 0) {
      toast.info("請先建立一個分類");
      setCatFormOpen(true);
      return;
    }
    setEditingPlace(null);
    setNewCoords(coords ?? null);
    setPlaceFormOpen(true);
  }

  function openEdit(place: Place) {
    setEditingPlace(place);
    setNewCoords(null);
    setPlaceFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deletePlace(deleteTarget.id);
    toast.success("已刪除地點");
  }

  function toggleNearby() {
    if (nearby) {
      disableNearby();
    } else {
      locateUser().catch(() => toast.error("無法取得目前位置"));
    }
  }

  const mapEl = (
    <MapView
      markers={markers}
      activeId={selectedPlaceId}
      center={focusCenter}
      userLocation={nearby ? userLocation : null}
      onMarkerClick={handleSelect}
      onMapClick={canEdit ? (c) => openAdd(c) : undefined}
      className="h-full w-full"
    />
  );

  // 手機無法分割，把 split 當作 list 來渲染（桌機才有真正的分割視圖）
  const effectiveView: ViewMode = !isDesktop && viewMode === "split" ? "list" : viewMode;
  const showPanel = effectiveView !== "map";
  const showMap = effectiveView !== "list";

  // 桌機面板：選取時顯示詳情，否則顯示清單
  const panelContent =
    selectedPlace && isDesktop ? (
      <div className="flex h-full flex-col">
        <button
          onClick={() => selectPlace(null)}
          className="mb-3 inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} />
          回到清單
        </button>
        <div className="no-scrollbar flex-1 overflow-y-auto pr-1">
          <PlaceDetail
            place={selectedPlace}
            canEdit={canEdit}
            onEdit={() => openEdit(selectedPlace)}
            onDelete={() => setDeleteTarget(selectedPlace)}
          />
        </div>
      </div>
    ) : (
      <div className="flex h-full flex-col">
        <div className="no-scrollbar flex-1 overflow-y-auto pr-1">
          <PlaceList
            places={places}
            selectedId={selectedPlaceId}
            loading={loadingPlaces}
            onSelect={handleSelect}
            onAdd={canEdit ? () => openAdd() : undefined}
            emptyHint={nearby ? "附近沒有已收藏的地點，試著擴大範圍" : undefined}
          />
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      {/* 工具列 */}
      <header className="z-20 shrink-0 border-b border-line bg-paper/80 px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2">
          <MapSwitcher onNewMap={() => setMapFormOpen(true)} />

          <div className="relative ml-auto hidden flex-1 sm:block sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input py-2 pl-9 pr-3 text-sm"
              placeholder="搜尋地點..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={toggleNearby}
            className={`btn ml-auto shrink-0 px-3 py-2 text-sm sm:ml-0 ${
              nearby ? "bg-brand-500 text-white" : "btn-outline"
            }`}
            title="尋找附近地點"
          >
            <Navigation size={16} className={locating ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">{nearby ? "附近中" : "近我"}</span>
          </button>

          {advanced && (
            <StatusFilter
              value={statusFilter}
              options={presets?.statuses ?? []}
              onChange={setStatusFilter}
            />
          )}

          <ViewToggle isDesktop={isDesktop} value={viewMode} onChange={setViewMode} />

          <button
            onClick={() => setMembersOpen(true)}
            className="btn-outline relative shrink-0 px-3 py-2 text-sm"
            title="成員與共編"
          >
            <Users size={16} />
            <span className="hidden tnum sm:inline">{online.length || ""}</span>
            {rtStatus === "open" && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="btn-outline shrink-0 px-3 py-2 text-sm"
            title="分享地圖"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* 手機搜尋列 */}
        <div className="relative mt-2 sm:hidden">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="input py-2 pl-9 pr-3 text-sm"
            placeholder="搜尋地點..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-2">
          <CategoryChips onAddCategory={canEdit ? () => setCatFormOpen(true) : undefined} />
        </div>
      </header>

      {/* 主體 */}
      <div className="relative flex min-h-0 flex-1">
        {showPanel && (
          <div
            className={`flex min-h-0 flex-col ${
              showMap
                ? "w-full md:w-[400px] md:shrink-0 md:border-r md:border-line"
                : "mx-auto w-full max-w-2xl"
            } ${showMap ? "hidden md:flex" : "flex"} p-3 pb-24 md:pb-3`}
          >
            {panelContent}
          </div>
        )}

        {showMap && (
          <div className={`relative min-h-0 flex-1 ${showPanel ? "hidden md:block" : "block"}`}>
            {mapEl}
            {/* 點地圖新增提示（桌機，僅可編輯者） */}
            {canEdit && (
              <div className="pointer-events-none absolute left-1/2 top-3 hidden -translate-x-1/2 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-medium text-white md:block">
                點地圖空白處可在該位置新增地點
              </div>
            )}
          </div>
        )}

        {/* FAB 新增（viewer 隱藏） */}
        {canEdit && (
          <button
            onClick={() => openAdd()}
            className="absolute bottom-20 right-4 z-20 grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-lift transition active:scale-95 md:bottom-6 md:right-6"
            aria-label="新增地點"
          >
            <Plus size={26} />
          </button>
        )}
      </div>

      {/* 手機詳情 sheet */}
      <Dialog
        open={!!selectedPlace && !isDesktop}
        onClose={() => selectPlace(null)}
        title={selectedPlace?.name}
      >
        {selectedPlace && (
          <PlaceDetail
            place={selectedPlace}
            canEdit={canEdit}
            onEdit={() => openEdit(selectedPlace)}
            onDelete={() => setDeleteTarget(selectedPlace)}
          />
        )}
      </Dialog>

      <PlaceForm
        open={placeFormOpen}
        onClose={() => setPlaceFormOpen(false)}
        initial={editingPlace}
        defaultCoords={newCoords}
      />
      <CategoryForm open={catFormOpen} onClose={() => setCatFormOpen(false)} />
      <MapForm open={mapFormOpen} onClose={() => setMapFormOpen(false)} />
      <MembersDialog open={membersOpen} onClose={() => setMembersOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="刪除這個地點？"
        description={deleteTarget ? `「${deleteTarget.name}」將被永久刪除。` : ""}
        confirmLabel="刪除"
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatusFilter({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`btn shrink-0 px-3 py-2 text-sm ${value ? "bg-brand-500 text-white" : "btn-outline"}`}
        title="狀態篩選"
      >
        <SlidersHorizontal size={16} />
        <span className="hidden lg:inline">{value ?? "狀態"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-40 animate-scale-in rounded-2xl border border-line bg-card p-1.5 shadow-lift">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-50"
          >
            全部狀態
            {!value && <X size={14} className="text-brand-600" />}
          </button>
          {options.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                value === s ? "font-semibold text-brand-700" : "text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  isDesktop,
  value,
  onChange,
}: {
  isDesktop: boolean;
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const options: { mode: ViewMode; icon: LucideIcon; label: string }[] = isDesktop
    ? [
        { mode: "split", icon: Columns2, label: "分割" },
        { mode: "map", icon: MapIcon, label: "地圖" },
        { mode: "list", icon: List, label: "清單" },
      ]
    : [
        { mode: "map", icon: MapIcon, label: "地圖" },
        { mode: "list", icon: List, label: "清單" },
      ];

  // 手機把 split 視為 list
  const current: ViewMode = !isDesktop && value === "split" ? "list" : value;

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.mode}
          onClick={() => onChange(o.mode)}
          className={`grid h-8 w-8 place-items-center rounded-full transition ${
            current === o.mode ? "bg-brand-500 text-white" : "text-ink-faint hover:text-ink"
          }`}
          title={o.label}
        >
          <o.icon size={16} />
        </button>
      ))}
    </div>
  );
}
