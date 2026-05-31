import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Base API configuration. The baseUrl is injected at app startup via the
 * `setBaseUrl` helper, allowing each app (web, homeowner, vendor) to point
 * at different backend environments without hardcoding.
 */
let _baseUrl = "/api/";

export const setBaseUrl = (url: string) => {
  _baseUrl = url;
};

/**
 * A dynamic base query that reads the configured `_baseUrl` at call-time,
 * so apps that call `setBaseUrl()` before store creation get it picked up.
 */
const dynamicBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, store, extraOptions) => {
  const rawBaseQuery = fetchBaseQuery({ baseUrl: _baseUrl });
  return rawBaseQuery(args, store, extraOptions);
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: dynamicBaseQuery,
  tagTypes: [
    "Attachments",
    "Comments",
    "Users",
    "UserLogins",
    "UserSessions",
    "Clients",
    "Realtors",
    "Vendors",
    "Listings",
    "Reports",
    "Issues",
    "Offers",
    "Assessments",
    "Disputes",
  ],
  keepUnusedDataFor: 3600,
  endpoints: () => ({}),
});
