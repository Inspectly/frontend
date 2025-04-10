import { api } from "./apiSlice";
import { Realtor } from "../../types";

export const realtorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRealtors: builder.query<Realtor[], void>({
      query: () => "realtors/",
      providesTags: ["Realtors"],
    }),
    getRealtorById: builder.query<Realtor, string>({
      query: (id) => `realtors/${id}`,
      providesTags: ["Realtors"],
    }),
    createRealtor: builder.mutation({
      query: (body) => ({
        url: "realtors/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Realtors"],
    }),
    updateRealtor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `realtors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Realtors"],
    }),
    deleteRealtor: builder.mutation({
      query: (id) => ({
        url: `realtors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Realtors"],
    }),
  }),
});

export const {
  useGetRealtorsQuery,
  useGetRealtorByIdQuery,
  useCreateRealtorMutation,
  useUpdateRealtorMutation,
  useDeleteRealtorMutation,
} = realtorsApi;
