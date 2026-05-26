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
      providesTags: ["Listings"],
    }),
    getListingByUserId: builder.query<Listing[], number>({
      query: (userId) => `listings/user/${userId}`,
      providesTags: ["Listings"],
    }),
    createListing: builder.mutation<Listing, Partial<Listing>>({
      query: (newListing) => ({
        url: "listings/",
        method: "POST",
        body: newListing,
      }),
      invalidatesTags: ["Listings"],
    }),
    updateListing: builder.mutation<Listing, { id: number } & Partial<Listing>>({
      query: ({ id, ...body }) => ({
        url: `listings/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Listings"],
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingByIdQuery,
  useGetListingByUserIdQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
} = listingsApi;
