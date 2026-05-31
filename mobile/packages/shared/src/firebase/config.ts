/**
 * Firebase configuration placeholder.
 * Each app (homeowner/vendor) should call `initializeApp` with their own
 * config from environment variables. This file exports a helper to create
 * the config object from env vars.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const createFirebaseConfig = (env: Record<string, string | undefined>): FirebaseConfig => ({
  apiKey: env.FIREBASE_API_KEY || env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: env.FIREBASE_AUTH_DOMAIN || env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.FIREBASE_PROJECT_ID || env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: env.FIREBASE_STORAGE_BUCKET || env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.FIREBASE_APP_ID || env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: env.FIREBASE_MEASUREMENT_ID || env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
});
