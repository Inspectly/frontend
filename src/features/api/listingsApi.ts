import { api } from "./apiSlice";
import { Listing } from "../../types";

export const listingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<Listing[], void>({
      query: () => "listings/",
      providesTags: ["Listings"],
    }),
    getListingById: builder.query<Listing, string>({
      query: (id) => `listings/${id}`,
    }),
    createListing: builder.mutation<Listing, Partial<Listing>>({
      query: (newListing) => ({
        url: "listings/",
        method: "POST",
        body: newListing,
      }),
      invalidatesTags: ["Listings"],
    }),
  }),
});

export const { useGetListingsQuery, useGetListingByIdQuery, useCreateListingMutation } = listingsApi;
