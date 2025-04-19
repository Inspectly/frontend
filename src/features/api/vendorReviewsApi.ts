import { Vendor_Review } from "../../types";
import { api } from "./apiSlice";

export const vendorReviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendorReviews: builder.query<Vendor_Review[], void>({
      query: () => `vendor_reviews/`,
    }),
    getVendorReviewsByVendorUserId: builder.query<Vendor_Review[], number>({
      query: (vendorUserId) => `vendor_reviews/vendor_user_id/${vendorUserId}`,
    }),
  }),
});

export const {
  useGetVendorReviewsQuery,
  useGetVendorReviewsByVendorUserIdQuery,
} = vendorReviewsApi;
