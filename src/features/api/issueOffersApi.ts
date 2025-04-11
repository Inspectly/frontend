import { api } from "./apiSlice";
import { IssueOffers } from "../../types";

export const issueOffersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOffersByIssueId: builder.query<IssueOffers[], number>({
        query: (issueId) => `/issue_offers/issue/${issueId}`,
      }),
      createOffer: builder.mutation({
        query: (body) => ({
          url: "issue_offers/",
          method: "POST",
          body,
        }),
      }),
  }),
});

export const { useGetOffersByIssueIdQuery, useCreateOfferMutation } = issueOffersApi;
