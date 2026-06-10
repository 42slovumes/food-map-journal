/// <reference types="vite/client" />

// Vite define 注入的編譯期常數
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Identity Services（最小型別宣告）
interface GoogleIdConfig {
  client_id: string;
  callback: (resp: { credential: string }) => void;
  auto_select?: boolean;
}
interface GoogleIdButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
}
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfig) => void;
        renderButton: (parent: HTMLElement, options: GoogleIdButtonOptions) => void;
        prompt: () => void;
      };
    };
  };
}
