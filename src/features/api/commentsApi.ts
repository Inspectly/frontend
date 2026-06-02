import { api } from "./apiSlice";
import { Comment } from "../../types";

export const commentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], void>({
      query: () => "comments/",
      providesTags: [{ type: "Comments", id: "LIST" }],
    }),
    getCommentsByIssueId: builder.query<Comment[], number>({
      query: (issueId) => `comments/issue/${issueId}`,
      providesTags: (_, __, issueId) => [{ type: "Comments", id: `ISSUE_${issueId}` }],
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
      invalidatesTags: (_, __, { issueId }) => [
        { type: "Comments", id: "LIST" },
        { type: "Comments", id: `ISSUE_${issueId}` },
      ],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useGetCommentsByIssueIdQuery,
  useCreateCommentMutation,
} = commentsApi;
