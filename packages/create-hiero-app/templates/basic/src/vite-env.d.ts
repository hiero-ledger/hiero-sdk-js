/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HIERO_NETWORK: string;
  readonly VITE_OPERATOR_ID: string;
  readonly VITE_OPERATOR_KEY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
