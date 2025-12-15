import { api } from "./apiSlice";
import { Vendor } from "../../types";

export const vendorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<Vendor[], void>({
      query: () => "vendors/",
      providesTags: ["Vendors"],
    }),
    getVendorById: builder.query<Vendor, string>({
      query: (id) => `vendors/${id}`,
      providesTags: ["Vendors"],
    }),
    getVendorByVendorUserId: builder.query<Vendor, string>({
      query: (id) => `vendors/vendor_user_id/${id}`,
      providesTags: ["Vendors"],
    }),
    createVendor: builder.mutation({
      query: (body) => ({
        url: "vendors/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendors"],
    }),
    updateVendor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `vendors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Vendors"],
    }),
  }),
});

export const { useGetVendorsQuery, useGetVendorByIdQuery, useGetVendorByVendorUserIdQuery, useCreateVendorMutation, useUpdateVendorMutation } = vendorsApi;
export const { getVendorById } = vendorsApi.endpoints;
