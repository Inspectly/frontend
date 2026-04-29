import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserByFirebaseId, BackendUser } from "./api/usersApi";
import { getUserSessionByUserId } from "./api/userSessionsApi";

interface AuthState {
  authenticated: boolean;
  user: BackendUser | null;
  loading: boolean;
}

const initialState: AuthState = {
  authenticated: false,
  user: null,
  loading: true,
};

export const checkAuthState = createAsyncThunk(
  "auth/checkAuthState",
  async (_, { dispatch }) => {
    return new Promise<BackendUser | null>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const backendUser = await getUserByFirebaseId(firebaseUser.uid);
            await getUserSessionByUserId(backendUser.id);
            resolve(backendUser);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<BackendUser>) {
      state.authenticated = true;
      state.user = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.authenticated = false;
      state.user = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        if (action.payload) {
          state.authenticated = true;
          state.user = action.payload;
        } else {
          state.authenticated = false;
          state.user = null;
        }
        state.loading = false;
      })
      .addCase(checkAuthState.rejected, (state) => {
        state.authenticated = false;
        state.user = null;
        state.loading = false;
      });
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
