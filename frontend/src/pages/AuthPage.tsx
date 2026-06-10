import { MapPin, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GoogleSignInButton, googleSignInEnabled } from "@/components/GoogleSignInButton";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { apiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/store/auth";

const SAMPLE_CHIPS = ["🍜 拉麵", "☕ 咖啡廳", "🏞️ 想去景點", "❤️ 約會清單", "🍣 東京美食"];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleGoogle(credential: string) {
    try {
      await loginWithGoogle(credential);
      navigate("/");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Google 登入失敗"));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, display_name: displayName });
      }
      navigate("/");
    } catch (err) {
      toast.error(apiErrorMessage(err, "登入失敗，請確認帳號密碼"));
    } finally {
      setLoading(false);
    }
  }

  function useDemo() {
    setMode("login");
    setEmail("demo@foodmap.app");
    setPassword("demo1234");
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden md:grid md:grid-cols-2">
      {/* 品牌面板 */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-500 p-12 text-white md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(600px 300px at 20% 10%, rgba(255,255,255,.5), transparent 60%), radial-gradient(500px 400px at 90% 90%, rgba(0,0,0,.25), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <MapPin size={22} />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">Pinmap</span>
        </div>

        <div className="relative">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            把想去的、去過的、
            <br />
            都釘在自己的地圖上。
          </h1>
          <p className="mt-4 max-w-sm text-white/85">
            自由建立任何主題分類，記錄評價與心得，一鍵跳轉 Google Maps 導航。
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {SAMPLE_CHIPS.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/70">不只美食 — 景點、展覽、旅遊、約會清單都收得下。</p>
      </div>

      {/* 表單面板 */}
      <div className="flex min-h-dvh items-center justify-center p-6 sm:p-12 md:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
              <MapPin size={18} />
            </div>
            <span className="font-display text-xl font-semibold">Pinmap</span>
          </div>

          {/* tabs */}
          <div className="mb-7 inline-flex rounded-full border border-line bg-card p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  mode === m ? "bg-brand-500 text-white shadow-soft" : "text-ink-soft hover:text-ink"
                }`}
              >
                {m === "login" ? "登入" : "註冊"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">顯示名稱</label>
                <input
                  className="input"
                  placeholder="例如：小巴"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">電子郵件</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">密碼</label>
              <input
                type="password"
                required
                minLength={8}
                className="input"
                placeholder={mode === "register" ? "至少 8 碼" : "輸入密碼"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? <Spinner className="h-5 w-5 border-white/40 border-t-white" /> : null}
              {mode === "login" ? "登入" : "建立帳號"}
            </button>
          </form>

          {googleSignInEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
                <span className="h-px flex-1 bg-line" />
                或
                <span className="h-px flex-1 bg-line" />
              </div>
              <GoogleSignInButton onCredential={handleGoogle} />
            </>
          )}

          <button
            onClick={useDemo}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-brand-300 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
          >
            <Sparkles size={16} />
            用 demo 帳號快速體驗
          </button>

          <p className="mt-6 text-center text-xs text-ink-faint">
            登入即表示你同意以友善方式使用本服務 ☺
          </p>
        </div>
      </div>
    </div>
  );
}
