import { api } from "./apiSlice";
import { Listing } from "../../types";

export const listingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<Listing[], void>({
      query: () => "listings/",
    }),
    getListingById: builder.query<Listing, string>({
      query: (id) => `listings/${id}`,
    }),
  }),
});

export const { useGetListingsQuery, useGetListingByIdQuery } = listingsApi;
