import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BE_BASE_URL,
  }),
  tagTypes: ["Listings", "Reports", "Issues"],
  keepUnusedDataFor: 3600,
  endpoints: () => ({}),
});
