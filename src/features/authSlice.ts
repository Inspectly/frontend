import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserByFirebaseId } from "./api/usersApi";
import { getUserSessionByUserId } from "./api/userSessionsApi";

// Define authentication state
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

// Use async thunk to check authentication state without hooks
export const checkAuthState = createAsyncThunk(
  "auth/checkAuthState",
  async (_, { dispatch }) => {
    dispatch(setLoading(true)); // Start loading

    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          console.warn("Firebase user is null, logging out.");
          dispatch(logout());
          resolve();
          return;
        }

        try {
          // Fetch backend user manually using RTK Query API
          const backendUserResult = await dispatch(
            getUserByFirebaseId.initiate(firebaseUser.uid)
          );
          const backendUser = backendUserResult.data;

          if (!backendUser) {
            console.warn("Backend user not found, logging out.");
            dispatch(logout());
            resolve();
            return;
          }

          // Fetch user session manually using RTK Query API
          const sessionResult = await dispatch(
            getUserSessionByUserId.initiate(backendUser.id.toString())
          );
          const sessionData = sessionResult.data;

          if (!sessionData) {
            console.warn("User session not found, logging out.");
            dispatch(logout());
          } else {
            dispatch(login(backendUser));
          }
        } catch (error) {
          console.error("Auth check error:", error);
          dispatch(logout());
        } finally {
          dispatch(setLoading(false)); // Stop loading
          resolve();
        }
      });

      return () => unsubscribe(); // Cleanup on unmount
    });
  }
);

// Create Redux slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      console.log("Dispatching login with user:", action.payload);
      state.authenticated = true;
      state.user = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      console.log("Redux logout executed!");
      state.authenticated = false;
      state.user = null;
      state.loading = true;
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
