import { getIdToken, type User as FirebaseUser } from "firebase/auth";
import {
  useLazyGetUserByFirebaseIdQuery,
  useCreateUserLoginMutation,
  useCreateUserSessionMutation,
} from "@inspectly/shared";

/**
 * Records a login + session row on the backend after a successful Firebase
 * auth, mirroring the web app. Fully non-blocking.
 */
export function useLoginSession() {
  const [fetchUserByFirebaseId] = useLazyGetUserByFirebaseIdQuery();
  const [createUserLogin] = useCreateUserLoginMutation();
  const [createUserSession] = useCreateUserSessionMutation();

  return async (firebaseUser: FirebaseUser, method: "email" | "gmail") => {
    try {
      const backendUser = await fetchUserByFirebaseId(firebaseUser.uid)
        .unwrap()
        .catch(() => null);
      if (!backendUser) return;

      const token = await getIdToken(firebaseUser).catch(() => "");

      try {
        await createUserLogin({
          user_id: backendUser.id,
          email_login: method === "email",
          email: method === "email" ? firebaseUser.email : "",
          phone_login: false,
          phone: "",
          gmail_login: method === "gmail",
          gmail: method === "gmail" ? firebaseUser.email : "",
        }).unwrap();
      } catch {
        // ignore duplicate-login conflicts
      }

      await createUserSession({
        user_id: backendUser.id,
        login: method,
        login_time: new Date().toISOString(),
        authentication_code: token,
      })
        .unwrap()
        .catch(() => {});
    } catch {
      // non-blocking
    }
  };
}
