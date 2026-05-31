import { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { auth } from "../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const isWeb = Platform.OS === "web";

interface UseGoogleSignInArgs {
  onSuccess?: (cred: UserCredential) => void;
  onError?: (error: unknown) => void;
}

/**
 * Google sign-in.
 * - On web: uses Firebase's signInWithPopup (matches the web app; reliable and
 *   doesn't require a separate OAuth redirect URI).
 * - On native (Expo Go / dev builds): uses expo-auth-session to get a Google ID
 *   token, then exchanges it for a Firebase credential.
 */
export function useGoogleSignIn({ onSuccess, onError }: UseGoogleSignInArgs = {}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (isWeb || !response) return;

    if (response.type === "success") {
      const idToken =
        (response.params && response.params.id_token) ||
        response.authentication?.idToken;
      if (!idToken) {
        onError?.(new Error("Google did not return an ID token."));
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential)
        .then((cred) => onSuccess?.(cred))
        .catch((err) => onError?.(err));
    } else if (response.type === "error") {
      onError?.(response.error ?? new Error("Google sign-in failed."));
    }
  }, [response]);

  const signIn = useCallback(async () => {
    if (isWeb) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        onSuccess?.(cred);
      } catch (err) {
        onError?.(err);
      }
      return;
    }

    if (!WEB_CLIENT_ID) {
      onError?.(
        new Error(
          "Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID."
        )
      );
      return;
    }
    promptAsync();
  }, [promptAsync, onSuccess, onError]);

  return {
    signIn,
    // Web works via Firebase popup (no extra client id needed).
    configured: isWeb || Boolean(WEB_CLIENT_ID),
    disabled: !isWeb && !request && Boolean(WEB_CLIENT_ID),
  };
}
