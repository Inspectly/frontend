import { api } from "./apiSlice";
import { Client } from "../../types";

export const clientsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<Client[], void>({
      query: () => "clients/",
      providesTags: ["Clients"],
    }),
    getClientById: builder.query<Client, string>({
      query: (id) => `clients/${id}`,
      providesTags: ["Clients"],
    }),
    getClientByUserId: builder.query<Client, string>({
      query: (user_id) => `clients/user_id/${user_id}`,
      providesTags: ["Clients"],
    }),
    createClient: builder.mutation({
      query: (body) => ({
        url: "clients/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Clients"],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `clients/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Clients"],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Clients"],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useGetClientByUserIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;
