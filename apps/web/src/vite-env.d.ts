/// <reference types="vite/client" />

declare module 'qrcode' {
  const QRCode: {
    toDataURL(value: string, options?: Record<string, unknown>): Promise<string>;
  };
  export default QRCode;
}

interface AppConfig {
  authUrl: string;
  activitiesUrl: string;
  wsUrl: string;
}

interface Window {
  __APP_CONFIG__?: AppConfig;
}

interface ImportMetaEnv {
  readonly VITE_AUTH_URL?: string;
  readonly VITE_ACTIVITIES_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
