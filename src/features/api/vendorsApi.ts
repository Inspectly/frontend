import { api } from "./apiSlice";
import { Vendor } from "../../types";

export const vendorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<Vendor[], void>({
      query: () => "vendors/",
    }),
    getVendorById: builder.query<Vendor, string>({
      query: (id) => `vendors/${id}`,
    }),
  }),
});

export const { useGetVendorsQuery, useGetVendorByIdQuery } = vendorsApi;
