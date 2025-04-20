import { api } from "./apiSlice";
import { IssueAddress, IssueType } from "../../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
      query: () => "issues/",
    }),
    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
    }),
    getIssueAddressById: builder.query<IssueAddress, number>({
      query: (id) => `issues/address/${id}`,
    }),
    updateIssue: builder.mutation({
      query: (body) => ({
        url: `issues/${body.id}`,
        method: "PUT",
        body,
      }),
    }),
    createIssue: builder.mutation<IssueType, Partial<IssueType>>({
      query: (newIssue) => ({
        url: "issues/",
        method: "POST",
        body: newIssue,
      }),
    }),
  }),
});

export const { useGetIssuesQuery, useGetIssueByIdQuery, useGetIssueAddressByIdQuery, useUpdateIssueMutation, useCreateIssueMutation } = issuesApi;
export const { getIssueAddressById } = issuesApi.endpoints;
