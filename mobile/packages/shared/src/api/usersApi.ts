import { api } from "./apiSlice";
import { User } from "../types";

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserByFirebaseId: builder.query<User, string>({
      query: (firebase_id) => `users/firebase/${firebase_id}`,
      transformResponse: (response: any, meta) => {
        if (meta?.response?.status === 404) return null;
        return response;
      },
      providesTags: ["Users"],
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `users/${id}`,
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: "users/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUserByFirebaseIdQuery,
  useLazyGetUserByFirebaseIdQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
} = usersApi;
export const { getUserByFirebaseId, getUserById } = usersApi.endpoints;
