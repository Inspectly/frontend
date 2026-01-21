import { api } from "./apiSlice";
import { User_Login } from "../../types";

export const userLoginsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserLogins: builder.query<User_Login[], void>({
      query: () => "user_logins/",
      providesTags: ["UserLogins"],
    }),
    getUserLoginById: builder.query<User_Login, string>({
      query: (id) => `user_logins/${id}`,
      providesTags: ["UserLogins"],
    }),
    getUserLoginByUserId: builder.query<User_Login, string>({
        query: (userId) => `user_logins/user/${userId}`,
        providesTags: ["UserLogins"],
      }),
    createUserLogin: builder.mutation({
      query: (body) => ({
        url: "user_logins/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserLogins"],
    }),
    updateUserLogin: builder.mutation({
        query: ({ id, ...body }) => ({
          url: `user_logins/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: ["UserLogins"],
      }),
  }),
});

export const { useGetUserLoginsQuery, useGetUserLoginByIdQuery, useGetUserLoginByUserIdQuery, useCreateUserLoginMutation, useUpdateUserLoginMutation } = userLoginsApi;
