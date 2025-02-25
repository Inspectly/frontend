import { api } from "./apiSlice";
import { User_Session } from "../../types";

export const userSessionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserSessions: builder.query<User_Session[], void>({
      query: () => "user_sessions/",
      providesTags: ["UserSessions"],
    }),
    getUserSessionById: builder.query<User_Session, string>({
      query: (id) => `user_sessions/${id}`,
      providesTags: ["UserSessions"],
    }),
    getUserSessionByUserId: builder.query<User_Session, string>({
      query: (userId) => `user_sessions/user/${userId}`,
      providesTags: ["UserSessions"],
    }),
    createUserSession: builder.mutation({
      query: (body) => ({
        url: "user_sessions/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserSessions"],
    }),
    updateUserSession: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `user_sessions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["UserSessions"],
    }),
  }),
});

export const {
  useGetUserSessionsQuery,
  useGetUserSessionByIdQuery,
  useGetUserSessionByUserIdQuery,
  useCreateUserSessionMutation,
  useUpdateUserSessionMutation,
} = userSessionsApi;

export const { getUserSessionByUserId, createUserSession } = userSessionsApi.endpoints;
