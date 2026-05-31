import { api } from "./apiSlice";
import { Vendor_Review } from "../types";

export const vendorReviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendorReviews: builder.query<Vendor_Review[], void>({
      query: () => "vendor_reviews/",
    }),
    getVendorReviewsByVendorUserId: builder.query<Vendor_Review[], number>({
      query: (vendorUserId) => `vendor_reviews/vendor_user_id/${vendorUserId}`,
    }),
    createVendorReview: builder.mutation<Vendor_Review, Partial<Vendor_Review>>({
      query: (body) => ({
        url: "vendor_reviews/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetVendorReviewsQuery,
  useGetVendorReviewsByVendorUserIdQuery,
  useCreateVendorReviewMutation,
} = vendorReviewsApi;
