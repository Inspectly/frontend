import { api } from "./apiSlice";
import { Listing } from "../../types";

export const listingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<Listing[], void>({
      query: () => "listings/",
      providesTags: ["Listings"],
      transformResponse: (response: { items: Listing[] }) => response.items,
    }),
    getListingById: builder.query<Listing, number>({
      query: (id) => `listings/${id}`,
    }),
    getListingByUserId: builder.query<Listing[], number>({
      query: (userId) => `listings/user/${userId}`,
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

export const { useGetListingsQuery, useGetListingByIdQuery, useGetListingByUserIdQuery, useCreateListingMutation } = listingsApi;
