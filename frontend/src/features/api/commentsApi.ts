import { api } from "./apiSlice";
import { Comment } from "../../types";

export const commentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], void>({
      query: () => "comments/",
      providesTags: [{ type: "Comments", id: "LIST" }],
    }),
    createComment: builder.mutation<any, { issueId: number; comment: string; userId: number }>({
      query: ({ issueId, comment, userId }) => ({
        url: "comments/",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: userId,
          comment,
        }),
      }),
      invalidatesTags: ["Comments"],
    }),
  }),
});

export const { useGetCommentsQuery, useCreateCommentMutation } = commentsApi;
