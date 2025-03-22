import { api } from "./apiSlice";
import { IssueBids } from "../../types";

export const issueBidsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBidsByIssueId: builder.query<IssueBids[], number>({
        query: (issueId) => `/issue_bids/issue/${issueId}`,
      }),
      createBid: builder.mutation({
        query: (body) => ({
          url: "issue_bids/",
          method: "POST",
          body,
        }),
      }),
  }),
});

export const { useGetBidsByIssueIdQuery, useCreateBidMutation } = issueBidsApi;
