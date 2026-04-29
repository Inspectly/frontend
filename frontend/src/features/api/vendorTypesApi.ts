import { api } from "./apiSlice";
import { Vendor_Type } from "../../types";

export const vendorTypesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendorTypes: builder.query<Vendor_Type[], void>({
      query: () => "vendor_types/",
    }),
  }),
});

export const { useGetVendorTypesQuery } = vendorTypesApi;
