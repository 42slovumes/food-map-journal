import { LogOut, type LucideIcon, Map, Settings, Sparkles, SquareStack } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@/store/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: "/", label: "地圖", icon: Map },
  { to: "/manage", label: "收藏", icon: SquareStack },
  { to: "/discover", label: "探索", icon: Sparkles },
  { to: "/settings", label: "設定", icon: Settings },
];

export function AppLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (user?.display_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-paper">
      {/* 桌機左側導覽軌 */}
      <aside className="hidden w-[76px] shrink-0 flex-col items-center border-r border-line bg-card/60 py-4 md:flex">
        <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-soft">
          <Map size={22} />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `group flex w-[60px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-ink-faint hover:bg-black/[0.04] hover:text-ink"
                }`
              }
            >
              <item.icon size={21} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-2 grid h-10 w-10 place-items-center rounded-2xl text-ink-faint transition hover:bg-black/[0.04] hover:text-ink"
          title="登出"
        >
          <LogOut size={19} />
        </button>
        <div className="mt-2 grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
          {initials}
        </div>
      </aside>

      {/* 內容 */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>

      {/* 手機底部 tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-card/95 backdrop-blur pb-safe md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                isActive ? "text-brand-600" : "text-ink-faint"
              }`
            }
          >
            <item.icon size={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
