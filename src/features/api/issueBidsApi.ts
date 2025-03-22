import { api } from "./apiSlice";
import { IssueBids } from "../../types";

export const issueBidsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBidsByIssueId: builder.query<IssueBids[], number>({
        query: (issueId) => `/issue_bids/issue/${issueId}`,
      }),
  }),
});

export const { useGetBidsByIssueIdQuery } = issueBidsApi;
