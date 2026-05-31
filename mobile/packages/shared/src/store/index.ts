import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { combineReducers } from "redux";
import { api } from "../api/apiSlice";
import authReducer from "./authSlice";

/**
 * Creates a Redux store configured for mobile (React Native).
 * The persist storage engine is injected by the caller so this module
 * stays platform-agnostic (AsyncStorage on RN, localStorage on web).
 */
export const createAppStore = (persistStorage?: any) => {
  const rootReducer = combineReducers({
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  });

  let finalReducer = rootReducer;

  if (persistStorage) {
    const { persistReducer } = require("redux-persist");
    const persistConfig = {
      key: "root",
      storage: persistStorage,
      whitelist: ["auth"],
    };
    finalReducer = persistReducer(persistConfig, rootReducer);
  }

  const store = configureStore({
    reducer: finalReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
          ignoredPaths: ["auth.user"],
        },
      }).concat(api.middleware),
  });

  setupListeners(store.dispatch);
  return store;
};

export type RootState = ReturnType<ReturnType<typeof createAppStore>["getState"]>;
export type AppDispatch = ReturnType<typeof createAppStore>["dispatch"];
