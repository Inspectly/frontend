import { api } from "./apiSlice";
import { IssueAddress, IssueType } from "../../types";

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<IssueType[], void>({
      query: () => "issues/",
    }),
    getPaginatedIssues: builder.query<
      { issues: IssueType[]; total: { count: number }, total_filtered?: { count: number} },
      {
        offset: number;
        limit: number;
        search?: string;
        type?: string;
        city?: string;
        state?: string;
        vendor_assigned?: boolean;
      }
    >({
      query: ({ offset, limit, search = "", type = "", city = "", state = "" }) => {
        const params = new URLSearchParams({
          offset: offset.toString(),
          limit: limit.toString(),
        });
    
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (city) params.append("city", city);
        if (state) params.append("state", state);
    
        return `/issues/filter?${params.toString()}`;
      },
    }),
    getIssueById: builder.query<IssueType, string>({
      query: (id) => `issues/${id}`,
    }),
    getIssueAddressById: builder.query<IssueAddress, number>({
      query: (id) => `issues/address/${id}`,
    }),
    getAllIssueAddresses: builder.query<IssueAddress[], void>({
      query: () => "issues/addresses/all",
    }),
    getAddressesByIssueIds: builder.mutation<IssueAddress[], number[]>({
      query: (issueIds) => ({
        url: "issues/addresses/issue_ids",
        method: "POST",
        body: { issue_ids: issueIds },
      }),
    }),
    updateIssue: builder.mutation({
      query: (body) => ({
        url: `issues/${body.id}`,
        method: "PUT",
        body,
      }),
      async onQueryStarted(updatedIssue, { dispatch, queryFulfilled }) {
        // Optimistically update the getIssueById cache
        const patchResult = dispatch(
          issuesApi.util.updateQueryData("getIssueById", updatedIssue.id.toString(), (draft) => {
            const updatedIssueWithStatus = { ...updatedIssue, status: `Status.${updatedIssue.status.toUpperCase()}` };
            Object.assign(draft, updatedIssueWithStatus); // Merge updated fields into the cached draft
          })
        );
    
        try {
          await queryFulfilled; // wait for backend to confirm
        } catch {
          patchResult.undo(); // rollback if the mutation fails
        }
      },
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

export const { useGetIssuesQuery, useGetIssueByIdQuery, useGetPaginatedIssuesQuery, useGetIssueAddressByIdQuery, useGetAllIssueAddressesQuery, useGetAddressesByIssueIdsMutation, useUpdateIssueMutation, useCreateIssueMutation } = issuesApi;
export const { getIssueAddressById } = issuesApi.endpoints;
