import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "https://inspectlyai.up.railway.app/api/v0/";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Attachments", "Comments", "Users", "UserLogins", "UserSessions", "Clients", "Realtors", "Vendors", "Listings", "Reports", "Issues", "Offers"],
  endpoints: () => ({}), // Empty, will be extended in other files
});
