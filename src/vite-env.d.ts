// src/vite-env.d.ts (Updated)

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // These Firebase ones are not used, but we'll leave them for now
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Your active variables
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_API_URL: string; // This line is new and required
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
