import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import AuthPage from "@/pages/AuthPage";
import DiscoverPage from "@/pages/DiscoverPage";
import ManagePage from "@/pages/ManagePage";
import MapPage from "@/pages/MapPage";
import PublicMapPage from "@/pages/PublicMapPage";
import SettingsPage from "@/pages/SettingsPage";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";

function Splash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper">
      <div className="grid h-14 w-14 animate-scale-in place-items-center rounded-3xl bg-brand-500 text-white shadow-lift">
        <MapPin size={28} />
      </div>
      <Spinner />
    </div>
  );
}

function RequireAuth() {
  const status = useAuth((s) => s.status);
  if (status !== "authed") return <Navigate to="/login" replace />;
  return <Outlet />;
}

function BootstrapGate() {
  const ready = useData((s) => s.ready);
  const bootstrap = useData((s) => s.bootstrap);

  useEffect(() => {
    if (!ready) bootstrap().catch(() => toast.error("載入資料失敗，請重新整理"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;
  return <Outlet />;
}

export default function App() {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "idle" || status === "loading") return <Splash />;

  return (
    <Routes>
      <Route
        path="/login"
        element={status === "authed" ? <Navigate to="/" replace /> : <AuthPage />}
      />
      {/* 公開分享頁：免登入唯讀 */}
      <Route path="/share/:token" element={<PublicMapPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<BootstrapGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<MapPage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
