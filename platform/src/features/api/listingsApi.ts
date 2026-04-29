import { apiSlice } from "./apiSlice";

export interface Listing {
  id: number;
  user_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export const listingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<Listing[], void>({
      query: () => "listings/",
      providesTags: ["Listings"],
    }),
    getListingById: builder.query<Listing, number>({
      query: (id) => `listings/${id}`,
      providesTags: ["Listings"],
    }),
    getListingByUserId: builder.query<Listing[], number>({
      query: (userId) => `listings/user/${userId}`,
      providesTags: ["Listings"],
    }),
    createListing: builder.mutation<Listing, {
      user_id: number;
      address: string;
      city: string;
      state: string;
      country: string;
      postal_code: string;
    }>({
      query: (body) => ({
        url: "listings/",
        method: "POST",
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
} = listingsApi;
