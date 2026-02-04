import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "../features/api/apiSlice";
import authReducer from "../features/authSlice";
import { persistStore, persistReducer, Persistor } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Use localStorage
import { combineReducers } from "redux";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Persist only auth slice
};

const rootReducer = combineReducers({
  auth: authReducer,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Preserve store across Vite HMR to keep RTK Query cache
const createStore = () => {
  const s = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST"], // Ignore redux-persist actions
          ignoredPaths: ["auth.user"], // Ignore non-serializable user object if needed
        },
      }).concat(api.middleware),
  });
  setupListeners(s.dispatch);
  return s;
};

// Type for our configured store
type AppStore = ReturnType<typeof createStore>;

// Use window to preserve store across HMR
declare global {
  interface Window {
    __REDUX_STORE__?: AppStore;
    __REDUX_PERSISTOR__?: Persistor;
  }
}

// Reuse existing store if available (survives HMR)
let store: AppStore;
let persistor: Persistor;

if (window.__REDUX_STORE__) {
  store = window.__REDUX_STORE__;
  persistor = window.__REDUX_PERSISTOR__!;
} else {
  store = createStore();
  persistor = persistStore(store);
  window.__REDUX_STORE__ = store;
  window.__REDUX_PERSISTOR__ = persistor;
}

export { store, persistor };

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
