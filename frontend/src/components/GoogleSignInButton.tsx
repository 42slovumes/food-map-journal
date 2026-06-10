import { useEffect, useRef, useState } from "react";

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

/** 是否已設定 Google 登入（沒設定則整顆按鈕不顯示） */
export const googleSignInEnabled = CLIENT_ID.trim().length > 0;

let scriptPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("無法載入 Google 登入"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  onCredential: (credential: string) => void;
}

/**
 * Google 登入按鈕（Google Identity Services）。
 * 沒有設定 VITE_GOOGLE_CLIENT_ID 時不渲染任何東西，沿用「雙模式自動降級」哲學。
 */
export function GoogleSignInButton({ onCredential }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!googleSignInEnabled) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => resp?.credential && cb.current(resp.credential),
        });
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320,
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!googleSignInEnabled) return null;
  if (failed)
    return <p className="text-center text-xs text-ink-faint">Google 登入暫時無法使用</p>;

  return <div ref={ref} className="flex justify-center" />;
}
