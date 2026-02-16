/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EMAIL_DOMAIN?: string
  readonly VITE_N8N_WEBHOOK_URL?: string
  readonly VITE_WHATSAPP_FROM_NUMBER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
