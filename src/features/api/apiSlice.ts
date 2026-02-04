import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "/api/"; // Backend API

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Attachments", "Comments", "Users", "UserLogins", "UserSessions", "Clients", "Realtors", "Vendors", "Listings", "Reports", "Issues", "Offers"],
  keepUnusedDataFor: 3600, // Keep cached data for 1 hour
  endpoints: () => ({}), // Empty, will be extended in other files
});
