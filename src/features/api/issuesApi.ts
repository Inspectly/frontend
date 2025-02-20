import { api } from "./apiSlice";
import { IssueType } from "../../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
      query: () => "issues/",
    }),
    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
    }),
    updateIssue: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `issues/${id}`,
        method: "PUT",
        body: updates,
      }),
    }),
  }),
});

export const { useGetIssuesQuery, useGetIssueByIdQuery, useUpdateIssueMutation } = issuesApi;
