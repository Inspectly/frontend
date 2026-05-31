import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getUserByFirebaseId } from "../api/usersApi";

interface AuthState {
  authenticated: boolean;
  user: any | null;
  loading: boolean;
}

const initialState: AuthState = {
  authenticated: false,
  user: null,
  loading: true,
};

let authListenerInitialized = false;

/**
 * Platform-agnostic auth state thunk. The Firebase `onAuthStateChanged`
 * listener is injected by the app at startup via `initAuthListener` so this
 * shared slice doesn't import any platform-specific Firebase SDK.
 */
export const checkAuthState = createAsyncThunk(
  "auth/checkAuthState",
  async (
    { onAuthStateChanged, auth }: { onAuthStateChanged: any; auth: any },
    { dispatch }
  ) => {
    if (authListenerInitialized) return;
    dispatch(setLoading(true));
    authListenerInitialized = true;

    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser: any) => {
        if (!firebaseUser) {
          dispatch(logout());
          dispatch(setLoading(false));
          resolve();
          return;
        }

        try {
          const backendUserResult = await dispatch(
            getUserByFirebaseId.initiate(firebaseUser.uid)
          );
          const backendUser = (backendUserResult as any).data;

          if (!backendUser) {
            dispatch(logout());
          } else {
            dispatch(login(backendUser));
          }
        } catch (error) {
          console.error("Auth check error:", error);
          dispatch(logout());
        } finally {
          dispatch(setLoading(false));
          resolve();
        }
      });
    });
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      state.authenticated = true;
      state.user = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.authenticated = false;
      state.user = null;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthState.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
